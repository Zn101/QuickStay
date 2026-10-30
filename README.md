# QuickStay

Hệ thống đặt phòng khách sạn trực tuyến, được xây dựng bằng **React + Vite** (Frontend) và **Spring Boot** (Backend).

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

---

## Cấu trúc dự án

```
QuickStay/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Spring Boot + Java 17
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
./gradlew bootRun
# API chạy tại: http://localhost:8080
```

### Chạy Test Backend

```bash
cd backend
./gradlew test
```

---

## GitHub Actions CI/CD

### CI Frontend (`ci-frontend.yml`)

Tự động chạy khi:
- Push lên nhánh: `main`, `develop`, `dev`, `dev-minh`
- Tạo hoặc cập nhật Pull Request vào: `main`, `develop`, `dev`
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
