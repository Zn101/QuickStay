# QuickStay

Hệ thống đặt phòng khách sạn, đặt bàn nhà hàng và đặt tour du lịch trực tuyến, xây dựng bằng **React + Vite** (Frontend) và **Spring Boot** (Backend).

---

## Vai trò người dùng

| Vai trò | Ai | Làm được gì | Trang chính |
|---------|----|-------------|-------------|
| `CUSTOMER` | Khách tự đăng ký | Đặt phòng, đặt bàn, đặt tour, thanh toán (giả lập), đánh giá sau khi đã lưu trú, hỏi đáp, đặt dịch vụ concierge | `/my-bookings`, `/profile` |
| `HOTEL_MANAGER` | Đối tác khách sạn / homestay (admin cấp) | Sửa thông tin cơ sở lưu trú, xử lý đơn đặt phòng, trả lời câu hỏi của khách | `/partner` |
| `RESTAURANT_OWNER` | Chủ nhà hàng (admin cấp) | Sửa thông tin nhà hàng của mình, xác nhận / hoàn tất / huỷ đơn đặt bàn | `/owner` |
| `TOUR_OPERATOR` | Đơn vị tour / khu du lịch (admin cấp) | Sửa thông tin tour của mình, xác nhận / hoàn tất / huỷ đơn đặt tour | `/owner` |
| `ADMIN` | Quản trị viên | Toàn quyền: khách sạn, phòng, nhà hàng, tour, tin tức, đơn, tài khoản đối tác, AI | `/admin` |

Tài khoản đối tác chỉ được tạo bởi admin tại **Admin → Tài khoản Đối tác**: chọn loại đối tác, rồi chọn khách sạn (với `HOTEL_MANAGER`) hoặc một hay nhiều nhà hàng / tour (với chủ nhà hàng / đơn vị tour). Mỗi nhà hàng / tour chỉ có một chủ.

Đặt phòng, đặt bàn, đặt tour, đánh giá và đặt dịch vụ yêu cầu **email đã xác thực** (tắt bằng `REQUIRE_VERIFIED_EMAIL=false`). Khi chưa cấu hình SMTP, email xác thực nằm trong **Hộp thư** trên web (hiện sau khi đăng nhập).

---

## 🚀 Triển khai trên VPS Ubuntu (Production)

> 📄 Hướng dẫn cài Docker chi tiết: [docs/deployment/T145-docker-server-setup.md](docs/deployment/T145-docker-server-setup.md)
>
> ⚠️ **Đang chạy bản cũ?** Đọc mục [Nâng cấp lên bản này](#nâng-cấp-lên-bản-này) trước khi pull image mới.

### Yêu cầu hệ thống

| Thành phần | Tối thiểu | Khuyến nghị |
|-----------|---------|------------|
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 / 24.04 LTS |
| RAM | 2 GB | 4 GB |
| CPU | 1 core | 2 cores |
| Disk | 10 GB | 20 GB |
| Docker Engine | 24+ | Latest |
| Docker Compose Plugin | v2+ | Latest |

**Port cần mở trên firewall:**

| Port | Dịch vụ | Ghi chú |
|------|---------|---------|
| 22 | SSH | Quản trị server |
| 8081 | Frontend (Nginx) | Truy cập ứng dụng; API đi qua `/api` |
| 80/443 | Nếu có reverse proxy | Tùy cấu hình |

> MySQL (:3306) và Backend (:8080) **KHÔNG** mở ra ngoài trong `docker-compose.prod.yml`; chúng giao tiếp nội bộ qua Docker network. Nginx của frontend chuyển `/api/*` vào backend.

---

### Bước 1 – Cài Docker Engine trên Ubuntu

```bash
# Cập nhật package list
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Thêm Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Thêm Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài Docker Engine + Compose Plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Cho phép user hiện tại dùng Docker không cần sudo
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra
docker --version
docker compose version
```

---

### Bước 2 – Clone repository

```bash
git clone https://github.com/Zn101/QuickStay.git
cd QuickStay
```

---

### Bước 3 – Chuẩn bị file .env

```bash
cp .env.example .env
nano .env   # Hoặc: vi .env
```

`docker-compose.prod.yml` **từ chối khởi động** nếu thiếu `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET` hoặc `ADMIN_PASSWORD`.

```bash
# Tạo JWT_SECRET mạnh (≥ 48 ký tự ngẫu nhiên)
openssl rand -base64 48

# Tạo mật khẩu DB / admin mạnh
openssl rand -hex 20
```

Ví dụ `.env` cho production (thay giá trị thật):

```env
DB_PASSWORD=<mat-khau-mysql-manh>
DB_ROOT_PASSWORD=<mat-khau-root-manh>
JWT_SECRET=<chuoi-ngau-nhien-48-ky-tu>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<mat-khau-admin-manh>
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
SEED_SAMPLE_DATA=false
REQUIRE_VERIFIED_EMAIL=true
ANTHROPIC_API_KEY=          # Để trống nếu không dùng AI
FRONTEND_PORT=8081
```

Danh sách đầy đủ: xem [Biến môi trường](#biến-môi-trường).

> **Lưu ý:** Không commit file `.env` lên Git. File này đã được `.gitignore` bảo vệ.

---

### Bước 4 – Đăng nhập GHCR (nếu package private)

```bash
# Tạo Personal Access Token tại: https://github.com/settings/tokens
# Cần quyền: read:packages
echo <GITHUB_TOKEN> | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
```

---

### Bước 5 – Pull image và khởi chạy

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Lần chạy đầu, backend tự tạo bảng bằng Flyway (`backend/src/main/resources/db/migration`) và tạo tài khoản admin từ `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

### Bước 6 – Kiểm tra trạng thái

```bash
# Trạng thái và health của các container
docker compose -f docker-compose.prod.yml ps

# Health của backend (backend không mở cổng ra host, nên kiểm tra từ trong container)
docker compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Frontend
curl -I http://localhost:8081
# Expected: HTTP/1.1 200 OK

# API qua Nginx proxy
curl http://localhost:8081/api/hotels
curl http://localhost:8081/api/restaurants
curl http://localhost:8081/api/tours
# Expected: JSON array
```

---

### Xem log khi gặp lỗi

```bash
# Log tất cả service
docker compose -f docker-compose.prod.yml logs -f

# Log từng service
docker compose -f docker-compose.prod.yml logs backend  --tail=100
docker compose -f docker-compose.prod.yml logs frontend --tail=50
docker compose -f docker-compose.prod.yml logs mysql    --tail=50
```

| Triệu chứng | Kiểm tra |
|-------------|----------|
| `docker compose` báo `required variable ... is missing` | Thiếu `DB_PASSWORD` / `DB_ROOT_PASSWORD` / `JWT_SECRET` / `ADMIN_PASSWORD` trong `.env` |
| Backend không kết nối được MySQL | `DB_PASSWORD` khớp giữa MySQL và backend (MySQL chỉ đọc mật khẩu lúc tạo volume lần đầu) |
| Backend không khởi động, log có `JWT_SECRET phai co it nhat 32 ky tu` | `JWT_SECRET` quá ngắn |
| Backend dừng với lỗi `Flyway` / `Migration` | Xem log backend; khôi phục bản sao lưu nếu migration lỗi giữa chừng |
| Lỗi CORS trên trình duyệt | `CORS_ORIGINS` đúng domain / IP và cổng của frontend |
| Khách báo "Vui long xac thuc email" khi đặt | Khách chưa xác thực email; gửi lại từ trang Hồ sơ, hoặc đặt `REQUIRE_VERIFIED_EMAIL=false` |
| Link trong email trỏ sai địa chỉ | `FRONTEND_URL` |

---

### Cập nhật phiên bản mới

```bash
# 1. Sao lưu DB trước (migration mới có thể thay đổi bảng)
docker compose -f docker-compose.prod.yml exec mysql \
  sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" quickstay' > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Lấy file compose / .env.example mới nhất (có thể có biến mới)
git pull

# 3. Pull image mới và khởi động lại (không mất dữ liệu)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

### Nâng cấp lên bản này

> ⚠️ Bản cập nhật bảo mật + đối tác nhà hàng / tour.

Áp dụng khi server đang chạy bản trước commit `aa69637`. Làm theo thứ tự:

1. **Sao lưu DB** (lệnh ở mục trên). Bản này chạy 3 migration mới khi khởi động:
   - `V7`: thêm cột `users.tokens_valid_after`, `bookings.payment_account_label` và bảng `site_contents` (tin tức).
   - `V8`: thêm bảng `restaurants`, `tours`, `restaurant_reservations`, `tour_bookings`, và nạp sẵn 8 nhà hàng + 9 tour (trước đây viết cứng trong frontend).
   - `V9`: thêm thực đơn, số điện thoại cho nhà hàng; lịch trình, giá bao gồm / chưa bao gồm, điểm đón, số khách tối đa / ngày cho tour (mặc định 30); bảng `venue_reviews` (đánh giá nhà hàng / tour) và bổ sung chi tiết cho dữ liệu mẫu.
2. **Bổ sung `.env`**: `JWT_SECRET` và `ADMIN_PASSWORD` giờ bắt buộc (thiếu là compose không chạy). `ADMIN_PASSWORD` chỉ dùng khi tạo admin lần đầu, không đổi mật khẩu admin đã có.
3. **Kiểm tra `SEED_SAMPLE_DATA`**: bản prod giờ mặc định `false` (trước đây ngầm là `true`). DB đã có dữ liệu thì không ảnh hưởng; chỉ đặt `true` nếu muốn DB mới có khách sạn mẫu và tài khoản đối tác mẫu.
4. **Quyết định `REQUIRE_VERIFIED_EMAIL`** (mặc định `true`): khách **chưa xác thực email sẽ không đặt được phòng, bàn hay tour**. Nếu nhiều khách cũ chưa xác thực, cân nhắc đặt `false` tạm thời và thông báo cho họ xác thực.
5. **Pull image mới và khởi động** (`pull` rồi `up -d`), kiểm tra như Bước 6, gồm `curl http://localhost:8081/api/restaurants`.
6. **Đổi mật khẩu các tài khoản mẫu đã có trong DB** (mật khẩu mặc định công khai trong mã nguồn):
   - Admin `admin@quickstay.local` / `Admin@123` (nếu chưa đổi): đổi tại trang **Hồ sơ**.
   - `homestay@quickstay.local` / `Host@123` và `partner@quickstay.local` / `Partner@123`: **Admin → Tài khoản Đối tác → Sửa** → đặt mật khẩu mới, hoặc xoá nếu không dùng.
7. **Gán chủ cho nhà hàng / tour**: tạo tài khoản Chủ nhà hàng / Đơn vị tour ở **Admin → Tài khoản Đối tác**. Nhà hàng / tour chưa gán chủ vẫn nhận đơn; admin xử lý tại `/owner`.

Thay đổi hành vi người dùng sẽ thấy:
- Đổi mật khẩu hoặc email cần nhập **mật khẩu hiện tại**. Đổi / đặt lại mật khẩu sẽ **đăng xuất các thiết bị khác**.
- Link xác thực email và link đặt lại mật khẩu gửi **trước khi nâng cấp** không còn dùng được (DB chỉ lưu bản băm); khách cần yêu cầu gửi lại.
- Chỉ khách đã nhận phòng / hoàn tất kỳ nghỉ tại cơ sở mới được đánh giá, mỗi người một lần. Khách sạn chưa có đánh giá hiển thị "Chưa có đánh giá" thay vì điểm mặc định.
- Đặt phòng tối đa 30 đêm, trước tối đa 365 ngày. Phí dịch vụ concierge tính theo bảng giá của hệ thống.
- Nhà hàng và tour có trang chi tiết riêng (`/restaurants/:id`, `/tours/:id`) với thực đơn / lịch trình, bản đồ, đánh giá thật và form đặt chỗ; đặt bàn / đặt tour tạo đơn thật. Tour giới hạn số khách mỗi ngày khởi hành. Trang khách sạn gợi ý nhà hàng và tour cùng thành phố.
- Trợ lý AI giới hạn theo người dùng / IP (`AI_RATE_PER_MINUTE`, `AI_PER_CLIENT_DAILY_CAP`) và trả lỗi 429 khi vượt.

---

### Dừng hệ thống an toàn (giữ nguyên dữ liệu)

```bash
# Dừng container, GIỮ NGUYÊN dữ liệu MySQL trong volume
docker compose -f docker-compose.prod.yml down

# CẢNH BÁO: Lệnh sau sẽ XÓA TOÀN BỘ dữ liệu MySQL
# docker compose -f docker-compose.prod.yml down -v   # KHÔNG chạy trừ khi muốn reset hoàn toàn
```

---

## 🐳 Chạy bằng Docker Compose (Development)

Cách nhanh nhất để chạy toàn bộ hệ thống (MySQL + Backend + Frontend) trên máy cá nhân.

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x (bao gồm Docker Compose v2)

### Các bước khởi động

```bash
# 1. Clone repository
git clone https://github.com/Zn101/QuickStay.git
cd QuickStay

# 2. Tạo file .env từ template (các giá trị mặc định đủ để chạy dev)
cp .env.example .env

# 3. Build và khởi động toàn bộ hệ thống
docker compose up --build
```

`docker-compose.yml` (dev) mặc định `SEED_SAMPLE_DATA=true`: tạo khách sạn mẫu và các tài khoản đối tác mẫu bên dưới.

| Dịch vụ | URL |
|---------|-----|
| **Ứng dụng** (React + Nginx) | http://localhost:8081 |
| **API** (qua Nginx) | http://localhost:8081/api/hotels |
| **Health Check** | `docker compose exec backend wget -qO- http://localhost:8080/actuator/health` |

### Tài khoản mẫu (chỉ dùng cho phát triển)

| Vai trò | Email | Mật khẩu | Khi nào có |
|---------|-------|----------|-----------|
| Admin | `admin@quickstay.local` | `Admin@123` | Luôn tạo (lấy từ `ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| Đối tác Homestay | `homestay@quickstay.local` | `Host@123` | `SEED_SAMPLE_DATA=true` |
| Đối tác Khách sạn | `partner@quickstay.local` | `Partner@123` | `SEED_SAMPLE_DATA=true` |
| Chủ nhà hàng (Sunrise Bistro) | `restaurant@quickstay.local` | `Restaurant@123` | `SEED_SAMPLE_DATA=true` |
| Đơn vị tour (các tour Đà Nẵng) | `tour@quickstay.local` | `Tour@123` | `SEED_SAMPLE_DATA=true` |

> **Không dùng các mật khẩu này trên production.** Chúng công khai trong mã nguồn. Production đặt `SEED_SAMPLE_DATA=false` và `ADMIN_PASSWORD` riêng.

Khách hàng tự đăng ký tại `/register`. Khi chưa cấu hình SMTP, đăng nhập rồi mở **Hộp thư** (biểu tượng phong bì trên thanh menu) để lấy link xác thực email.

### Lệnh quản lý container thường dùng

```bash
# Xem trạng thái container
docker compose ps

# Xem log real-time
docker compose logs -f
docker compose logs backend --tail=50

# Dừng hệ thống (giữ nguyên dữ liệu)
docker compose down

# Rebuild sau khi thay đổi code
docker compose up --build
docker compose up --build backend   # chỉ rebuild một service
```

> Dữ liệu MySQL nằm trong Docker volume `mysql-data` (tên đầy đủ có tiền tố tên thư mục, ví dụ `quickstay_mysql-data`).
> `docker compose down` **không xoá** dữ liệu; chỉ `docker compose down -v` mới xoá (dùng cẩn thận!).

### Sao lưu & Phục hồi cơ sở dữ liệu MySQL (Windows)

> 📄 Tài liệu chi tiết: [docs/deployment/T147-mysql-backup-restore.md](docs/deployment/T147-mysql-backup-restore.md). Trên VPS Linux dùng lệnh `mysqldump` ở mục [Cập nhật phiên bản mới](#cập-nhật-phiên-bản-mới).

```powershell
# 1. Sao lưu database quickstay (tự động lưu vào thư mục backups/)
.\scripts\backup-mysql.ps1

# 2. Khôi phục an toàn vào database kiểm thử (quickstay_test_restore)
.\scripts\restore-mysql.ps1

# 3. Khôi phục với file backup cụ thể
.\scripts\restore-mysql.ps1 -BackupFile .\backups\quickstay_backup_YYYYMMDD_HHMMSS.sql -TargetDatabase quickstay_test_restore
```

---

## Biến môi trường

Đặt trong file `.env` ở thư mục gốc; cả hai file compose đều chuyển các biến này vào backend. Mẫu đầy đủ: [.env.example](.env.example).

| Biến | Production | Mặc định | Mô tả |
|------|-----------|----------|-------|
| `DB_PASSWORD` | ✅ Bắt buộc | dev: `quickstay_pw` | Mật khẩu MySQL user `quickstay` |
| `DB_ROOT_PASSWORD` | ✅ Bắt buộc | dev: `root_pw` | Mật khẩu MySQL root |
| `JWT_SECRET` | ✅ Bắt buộc | chỉ có giá trị dev | Khoá ký JWT, ≥ 32 ký tự. Đổi khoá thì mọi người dùng bị đăng xuất |
| `ADMIN_PASSWORD` | ✅ Bắt buộc | dev: `Admin@123` | Mật khẩu admin khi tạo lần đầu (không đổi admin đã có) |
| `ADMIN_EMAIL` | Khuyến nghị | `admin@quickstay.local` | Email admin khi tạo lần đầu |
| `CORS_ORIGINS` | Khuyến nghị | `http://localhost:8081` | Domain frontend, cách nhau bằng dấu phẩy |
| `FRONTEND_URL` | Khuyến nghị | prod: `https://quickstay.io.vn` | Gốc của link trong email |
| `SEED_SAMPLE_DATA` | | prod `false`, dev `true` | Tạo khách sạn mẫu và tài khoản đối tác mẫu |
| `REQUIRE_VERIFIED_EMAIL` | | `true` | Bắt buộc email đã xác thực khi đặt / đánh giá |
| `APP_TIMEZONE` | | `Asia/Ho_Chi_Minh` | Múi giờ nghiệp vụ ("hôm nay" khi kiểm tra ngày) |
| `ANTHROPIC_API_KEY` | | trống | Bật AI thật; trống thì dùng bộ trả lời dự phòng |
| `AI_RATE_PER_MINUTE` | | `25` | Số lần gọi AI / phút cho mỗi người dùng hoặc IP |
| `AI_PER_CLIENT_DAILY_CAP` | | `200` | Số lần gọi AI / ngày cho mỗi người dùng hoặc IP |
| `AI_DAILY_REQUEST_CAP` | | `5000` | Trần gọi AI / ngày toàn hệ thống |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS`, `MAIL_FROM` | | trống | SMTP thật; để trống `MAIL_HOST` thì email chỉ lưu trong Hộp thư trên web |
| `FRONTEND_PORT` | | `8081` | Cổng ra ngoài của frontend |

---

## Cấu trúc dự án

```
QuickStay/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Spring Boot + Java 17
│   └── src/main/resources/db/migration/   # Migration Flyway (V1 … V9)
├── scripts/           # Script tự động hóa (Backup/Restore MySQL)
├── docs/              # Tài liệu dự án
├── qa/                # Kiểm thử chất lượng
├── .github/workflows/ # GitHub Actions CI/CD
├── docker-compose.yml       # Development (build từ mã nguồn)
└── docker-compose.prod.yml  # Production (image từ GHCR)
```

---

## Frontend

### Yêu cầu

- **Node.js** ≥ 20 (CI dùng Node 22)
- **npm** ≥ 9

### Lệnh thường dùng

```bash
cd frontend
npm ci            # cài dependencies
npm run dev       # dev server: http://localhost:5173 (proxy /api tới http://localhost:8080)
npm test          # Vitest + @testing-library/react (jsdom)
npm run build     # output: frontend/dist/
npm run preview   # xem bản build: http://localhost:4173
```

Frontend gọi API qua đường dẫn tương đối `/api` (Vite proxy khi dev, Nginx khi chạy Docker). Không có biến môi trường riêng cho frontend.

---

## Backend

### Yêu cầu

- **Java** 17 (Temurin/OpenJDK)
- **MySQL** 8+ cho production; mặc định chạy **H2 in-memory** khi không đặt `DB_URL`

### Lệnh thường dùng

```bash
cd backend
.\gradlew.bat bootRun   # API: http://localhost:8080 (H2 in-memory, dữ liệu mất khi tắt)
.\gradlew.bat test      # toàn bộ test (H2)
```

Cấu hình đầy đủ: [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).

---

## 📦 Docker Image trên GHCR

Mỗi lần **push lên `main`**, workflow `cd-docker.yml` chạy test backend + frontend rồi build và đẩy image lên GitHub Container Registry. `docker-compose.prod.yml` dùng tag `latest`, nên **push lên `main` là bản production kế tiếp**.

| Service | Image |
|---------|-------|
| Backend | `ghcr.io/zn101/quickstay-backend` |
| Frontend | `ghcr.io/zn101/quickstay-frontend` |

| Tag | Ý nghĩa |
|-----|---------|
| `latest` | Bản build mới nhất từ nhánh `main` |
| `sha-<7 ký tự>` | Bản build của một commit cụ thể (dùng để quay lại bản cũ) |

```bash
# Chạy một bản cụ thể thay vì latest (vd. để quay lại khi bản mới lỗi):
# sửa image trong docker-compose.prod.yml thành :sha-a1b2c3d rồi
docker compose -f docker-compose.prod.yml up -d
```

> Quay lại bản cũ **không hoàn tác migration DB**. Khôi phục bản sao lưu nếu cần quay lại trước một migration.

---

## GitHub Actions CI/CD

| Workflow | Chạy khi | Làm gì |
|----------|----------|--------|
| `ci.yml` | Push / Pull Request vào `main`, `dev` | Test backend (Gradle) và frontend (Vitest + build) |
| `cd-docker.yml` | Push lên `main` | Test, rồi build và đẩy image backend + frontend lên GHCR |

---

## Công nghệ sử dụng

| Phần | Công nghệ |
|------|-----------|
| Frontend | React 18, Vite 8, Tailwind CSS 3, Zustand |
| Testing | Vitest, @testing-library/react, jsdom; JUnit 5 + Spring Boot Test |
| Backend | Spring Boot 3.5, Java 17, Gradle, Spring Security (JWT), Flyway |
| Database | MySQL 8.4 (H2 cho dev / test) |
| AI | Anthropic API (tuỳ chọn) với bộ trả lời dự phòng |
| CI/CD | GitHub Actions |
| Container | Docker, GitHub Container Registry |
