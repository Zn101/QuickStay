# QuickStay

Hệ thống đặt phòng khách sạn trực tuyến, được xây dựng bằng **React + Vite** (Frontend) và **Spring Boot** (Backend).

---

## 🚀 Triển khai trên VPS Ubuntu (Production)

> 📄 Xem hướng dẫn cài đặt Docker chi tiết tại: [docs/deployment/T145-docker-server-setup.md](docs/deployment/T145-docker-server-setup.md)

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
| 8081 | Frontend (Nginx) | Truy cập ứng dụng |
| 80/443 | Nếu có reverse proxy | Tùy cấu hình |

> MySQL (:3306) và Backend (:8080) **KHÔNG** expose ra ngoài trong `docker-compose.prod.yml` — chúng giao tiếp nội bộ qua Docker network.

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

**Các giá trị BẮT BUỘC phải đổi trước khi chạy production:**

```bash
# Tạo JWT_SECRET mạnh (≥ 48 ký tự ngẫu nhiên)
openssl rand -base64 48

# Tạo mật khẩu DB mạnh
openssl rand -hex 20
```

Ví dụ nội dung `.env` cho production (thay giá trị thật):

```env
DB_PASSWORD=<mat-khau-mysql-manh>
DB_ROOT_PASSWORD=<mat-khau-root-manh>
JWT_SECRET=<chuoi-ngau-nhien-48-ky-tu>
CORS_ORIGINS=http://<IP-hoac-domain-VPS>:8081
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<mat-khau-admin-manh>
ANTHROPIC_API_KEY=          # Để trống nếu không dùng AI
FRONTEND_PORT=8081
```

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
# Pull image mới nhất từ GHCR
docker pull ghcr.io/zn101/quickstay-backend:latest
docker pull ghcr.io/zn101/quickstay-frontend:latest

# Khởi chạy toàn hệ thống (chạy nền)
docker compose -f docker-compose.prod.yml up -d
```

---

### Bước 6 – Kiểm tra trạng thái

```bash
# Xem trạng thái các container
docker compose -f docker-compose.prod.yml ps

# Kiểm tra health của từng service
docker inspect quickstay-backend-1 --format='{{.State.Health.Status}}'
docker inspect quickstay-mysql-1   --format='{{.State.Health.Status}}'

# Kiểm tra Backend health endpoint
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Kiểm tra Frontend
curl -I http://localhost:8081
# Expected: HTTP/1.1 200 OK

# Kiểm tra API qua Nginx proxy
curl http://localhost:8081/api/hotels
# Expected: JSON array danh sách khách sạn
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

# Lỗi thường gặp:
# - Backend không kết nối được MySQL: kiểm tra DB_PASSWORD khớp nhau
# - Backend lỗi 401/403:             kiểm tra JWT_SECRET
# - CORS error trên browser:         kiểm tra CORS_ORIGINS đúng domain/IP
```

---

### Cập nhật phiên bản mới

```bash
# Pull image mới
docker pull ghcr.io/zn101/quickstay-backend:latest
docker pull ghcr.io/zn101/quickstay-frontend:latest

# Restart service với image mới (không mất dữ liệu)
docker compose -f docker-compose.prod.yml up -d --no-build
```

---

### Dừng hệ thống an toàn (giữ nguyên dữ liệu)

```bash
# Dừng container, GIỮ NGUYÊN dữ liệu MySQL trong volume
docker compose -f docker-compose.prod.yml down

# CẢNH BÁO: Lệnh sau sẽ XÓA TOÀN BỘ dữ liệu MySQL
# docker compose -f docker-compose.prod.yml down -v   # KHÔNG chạy trừ khi muốn reset hoàn toàn
```

---

## 🐳 Chạy bằng Docker Compose (Khuyến nghị)

Đây là cách nhanh nhất để chạy toàn bộ hệ thống (MySQL + Backend + Frontend) chỉ với vài lệnh.

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x (bao gồm Docker Compose v2)

### Các bước khởi động

```bash
# 1. Clone repository
git clone https://github.com/Zn101/QuickStay.git
cd QuickStay

# 2. Tạo file .env từ template
cp .env.example .env

# 3. (Bắt buộc cho production) Đổi JWT_SECRET thành chuỗi ngẫu nhiên ≥ 32 ký tự
# Ví dụ: openssl rand -hex 32

# 4. Build và khởi động toàn bộ hệ thống
docker compose up --build
```

Sau khi khởi động thành công:

| Dịch vụ | URL |
|---------|-----|
| **Frontend** (React + Nginx) | http://localhost:8081 |
| **Backend** (Spring Boot API) | http://localhost:8080 |
| **Health Check** | http://localhost:8080/actuator/health |
| **API Hotels** | http://localhost:8081/api/hotels |

### Tài khoản mặc định

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@quickstay.local | Admin@123 |

> **Lưu ý:** Đây là tài khoản mặc định dành cho môi trường phát triển.
> Không sử dụng thông tin đăng nhập này trong môi trường production.
> Hãy thay đổi email và mật khẩu bằng biến môi trường tương ứng.

### Biến môi trường quan trọng (`.env`)

| Biến | Mô tả | Bắt buộc đổi? |
|------|-------|---------------|
| `JWT_SECRET` | Khóa ký JWT (≥ 32 ký tự) | ✅ Production |
| `DB_PASSWORD` | Mật khẩu MySQL user | Khuyến nghị |
| `DB_ROOT_PASSWORD` | Mật khẩu MySQL root | Khuyến nghị |
| `ADMIN_EMAIL` | Email tài khoản admin | Tùy chọn |
| `ADMIN_PASSWORD` | Mật khẩu tài khoản admin | Tùy chọn |
| `ANTHROPIC_API_KEY` | API key Anthropic (AI) | Không bắt buộc |

### Lệnh quản lý container thường dùng

```bash
# Xem trạng thái container
docker compose ps

# Xem log real-time
docker compose logs -f

# Xem log từng service
docker compose logs backend --tail=50
docker compose logs frontend --tail=20
docker compose logs mysql --tail=20

# Dừng hệ thống (giữ nguyên dữ liệu)
docker compose down

# Rebuild sau khi thay đổi code
docker compose up --build

# Chỉ rebuild một service
docker compose up --build backend
```

> **Lưu ý:** Dữ liệu MySQL được lưu trong Docker volume `quickstay_mysql-data-recovery`.
> Lệnh `docker compose down` **không xóa** dữ liệu. Chỉ `docker compose down -v` mới xóa (dùng cẩn thận!).

### Sao lưu & Phục hồi cơ sở dữ liệu MySQL (T147)

> 📄 Xem tài liệu chi tiết tại: [docs/deployment/T147-mysql-backup-restore.md](docs/deployment/T147-mysql-backup-restore.md)

```powershell
# 1. Sao lưu database quickstay (tự động lưu vào thư mục backups/)
.\scripts\backup-mysql.ps1

# 2. Khôi phục an toàn vào database kiểm thử (quickstay_test_restore)
.\scripts\restore-mysql.ps1

# 3. Khôi phục với file backup cụ thể
.\scripts\restore-mysql.ps1 -BackupFile .\backups\quickstay_backup_YYYYMMDD_HHMMSS.sql -TargetDatabase quickstay_test_restore
```

---

## Cấu trúc dự án

```
QuickStay/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Spring Boot + Java 17
├── scripts/           # Script tự động hóa (Backup/Restore MySQL)
├── docs/              # Tài liệu dự án
├── qa/                # Kiểm thử chất lượng
├── .github/workflows/ # GitHub Actions CI/CD
└── docker-compose.yml # Docker compose cho môi trường dev
```

---

## Frontend

### Yêu cầu

- **Node.js** ≥ 18 (khuyến nghị 20 LTS)
- **npm** ≥ 9 (được bao gồm với Node 18+)

### Cài đặt dependencies

```bash
cd frontend
npm ci
```

### Chạy môi trường Development

```bash
cd frontend
npm run dev
# Ứng dụng chạy tại: http://localhost:5173
```

### Build Production

```bash
cd frontend
npm run build
# Output tại: frontend/dist/
```

### Chạy Test

```bash
cd frontend
npm test
```

Test framework: **Vitest** + **@testing-library/react**, chạy trong môi trường **jsdom**.

Các test hiện có:
- `src/lib/format.test.js` — Unit test cho các hàm format tiền tệ và ngày tháng
- `src/App.test.jsx` — Integration test cho routing và UI components

### Preview Build

```bash
cd frontend
npm run build
npm run preview
# Preview tại: http://localhost:4173
```

---

## Backend

### Yêu cầu

- **Java** 17 (Temurin/OpenJDK)
- **MySQL** 8+ (hoặc H2 cho test)

### Chạy Backend (Development)

```bash
cd backend
.\gradlew.bat bootRun
# API chạy tại: http://localhost:8080
```

### Chạy Test Backend

```bash
cd backend
.\gradlew.bat test
```

---

## 📦 Sử dụng Docker Image từ GHCR (T121)

Sau khi merge vào `main`, GitHub Actions tự động build và push image lên GitHub Container Registry.

### Địa chỉ image

| Service | Image |
|---------|-------|
| Backend | `ghcr.io/zn101/quickstay-backend` |
| Frontend | `ghcr.io/zn101/quickstay-frontend` |

### Quy tắc tag

| Tag | Ý nghĩa |
|-----|---------|
| `latest` | Bản build mới nhất từ nhánh `main` |
| `sha-<7 ký tự>` | Bản build tương ứng commit SHA cụ thể |

### Đăng nhập GHCR

```bash
# Dung Personal Access Token (classic) voi quyen read:packages
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Pull image

```bash
# Pull ban moi nhat
docker pull ghcr.io/zn101/quickstay-backend:latest
docker pull ghcr.io/zn101/quickstay-frontend:latest

# Pull theo commit SHA cu the
docker pull ghcr.io/zn101/quickstay-backend:sha-a1b2c3d
docker pull ghcr.io/zn101/quickstay-frontend:sha-a1b2c3d
```

### Chạy Docker Compose với image đã publish (không cần build lại)

Tạo file `docker-compose.prod.yml`:

```yaml
services:
  mysql:
    image: mysql:8.4
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_DATABASE: quickstay
      MYSQL_USER: quickstay
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${DB_ROOT_PASSWORD}"]
      interval: 5s
      timeout: 5s
      retries: 20

  backend:
    image: ghcr.io/zn101/quickstay-backend:latest
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      DB_URL: jdbc:mysql://mysql:3306/quickstay?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      DB_USER: quickstay
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
    ports:
      - "${BACKEND_PORT:-8080}:8080"

  frontend:
    image: ghcr.io/zn101/quickstay-frontend:latest
    depends_on:
      - backend
    ports:
      - "${FRONTEND_PORT:-8081}:80"

volumes:
  mysql-data:
```

```bash
# Chay voi image tu GHCR (can dang nhap truoc)
docker compose -f docker-compose.prod.yml up -d
```

### Biến môi trường bắt buộc khi dùng image GHCR

| Biến | Bắt buộc | Mô tả |
|------|---------|-------|
| `JWT_SECRET` | ✅ | Khóa ký JWT, tối thiểu 32 ký tự ngẫu nhiên |
| `DB_PASSWORD` | ✅ | Mật khẩu MySQL user `quickstay` |
| `DB_ROOT_PASSWORD` | ✅ | Mật khẩu MySQL root |
| `CORS_ORIGINS` | ✅ | Domain frontend, ví dụ `https://yourdomain.com` |
| `ADMIN_EMAIL` | Khuyến nghị | Email tài khoản admin mặc định |
| `ADMIN_PASSWORD` | Khuyến nghị | Mật khẩu admin (đổi khỏi `Admin@123`) |
| `ANTHROPIC_API_KEY` | Không bắt buộc | AI features, để trống nếu không dùng |

> **Lưu ý bảo mật:** Không commit file `.env` chứa giá trị thật lên Git.
> Tạo JWT_SECRET mạnh: `openssl rand -base64 48`

---

## GitHub Actions CI/CD

### CI Frontend (`ci-frontend.yml`)

Tự động chạy khi:
- Push lên nhánh: `main`, `develop`, `dev`, `dev-minh`
- Tạo hoặc cập nhật Pull Request vào: `main`, `develop`, `dev`, `dev-minh`
- Chỉ khi có thay đổi trong `frontend/` hoặc file workflow

Các bước thực hiện:
1. Checkout source code
2. Cài đặt Node.js 20 LTS (với npm cache)
3. Cài dependencies (`npm ci` — dùng lock file để đảm bảo reproducible)
4. Chạy tests (`npm test`)
5. Build production bundle (`npm run build`)
6. Upload `dist/` artifact (lưu 3 ngày)

### CI Backend (`ci-backend.yml`)

Tự động chạy khi push/PR vào `main`, `develop` với thay đổi trong `backend/`.

### CD Docker (`cd-docker.yml`)

Build và push Docker images lên GitHub Container Registry khi merge vào `main`.

---

## Môi trường

| Biến | Mô tả |
|------|-------|
| `VITE_API_URL` | URL của Backend API (mặc định: `/api`) |

Frontend hỗ trợ **Mock Data mode** — tự động bật khi backend không khả dụng, phù hợp cho phát triển Frontend độc lập.

---

## Công nghệ sử dụng

| Phần | Công nghệ |
|------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Zustand |
| Testing | Vitest, @testing-library/react, jsdom |
| Backend | Spring Boot 3, Java 17, Gradle |
| Database | MySQL 8 |
| CI/CD | GitHub Actions |
| Container | Docker, GitHub Container Registry |
