# QuickStay – Hướng dẫn chạy dự án

> Trở về [README tổng](../README.md)

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Clone repository](#2-clone-repository)
3. [Cấu hình môi trường](#3-cấu-hình-môi-trường)
4. [Khởi chạy hệ thống](#4-khởi-chạy-hệ-thống)
5. [Kiểm tra trạng thái](#5-kiểm-tra-trạng-thái)
6. [Truy cập hệ thống](#6-truy-cập-hệ-thống)
7. [Database và dữ liệu mẫu](#7-database-và-dữ-liệu-mẫu)
8. [Xem logs](#8-xem-logs)
9. [Dừng hệ thống an toàn](#9-dừng-hệ-thống-an-toàn)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu | Khuyến nghị |
|-----------|--------------------|-----------:|
| **OS** | Windows 10 / Ubuntu 20.04 / macOS 12 | Ubuntu 22.04 LTS |
| **RAM** | 4 GB | 8 GB |
| **CPU** | 2 cores | 4 cores |
| **Disk** | 5 GB trống | 10 GB SSD |
| **Git** | 2.x | Latest |
| **Docker Desktop** | 4.x (Docker Engine 24+) | Latest |
| **Docker Compose** | Plugin v2+ (tích hợp sẵn trong Docker Desktop) | Latest |

> **Lưu ý:** Không cần cài Java, Node.js hay bất kỳ SDK nào khác — tất cả được xử lý trong Docker containers.

---

## 2. Clone repository

```bash
git clone https://github.com/Zn101/QuickStay.git
cd QuickStay
```

---

## 3. Cấu hình môi trường

### Bước 3.1 – Tạo file `.env`

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

### Bước 3.2 – Chỉnh sửa `.env`

Mở file `.env` bằng editor và điền các giá trị phù hợp:

```bash
# Windows PowerShell
notepad .env

# Linux / macOS
nano .env
```

### Bước 3.3 – Biến môi trường

#### Bắt buộc (phải thay đổi trước khi chạy)

| Biến | Mô tả | Giá trị mặc định (dev) |
|------|-------|----------------------|
| `DB_PASSWORD` | Mật khẩu MySQL user `quickstay` | `quickstay_pw` |
| `DB_ROOT_PASSWORD` | Mật khẩu MySQL root | `root_pw` |
| `JWT_SECRET` | Khóa ký JWT, **tối thiểu 32 ký tự** | `doi-chuoi-nay-...` |
| `ADMIN_PASSWORD` | Mật khẩu tài khoản admin | `Admin@123` |

> **Tạo JWT_SECRET mạnh:**
> ```bash
> # Linux / macOS / Git Bash
> openssl rand -base64 48
> ```

#### Tùy chọn

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `ADMIN_EMAIL` | Email tài khoản admin | `admin@quickstay.local` |
| `CORS_ORIGINS` | Domain frontend được phép | `http://localhost:8081` |
| `ANTHROPIC_API_KEY` | API key Anthropic (AI chatbot) | _(trống — dùng chế độ dự phòng)_ |
| `SEED_SAMPLE_DATA` | Tạo 4 khách sạn mẫu khi DB trống | `false` |
| `FRONTEND_PORT` | Port frontend | `8081` |
| `MAIL_HOST` | SMTP server | _(trống — dùng Demo Mail Outbox)_ |

---

## 4. Khởi chạy hệ thống

### Lần đầu tiên (build từ source)

```bash
docker compose up -d --build
```

Lần đầu sẽ mất 3–5 phút để tải dependencies và build.

### Các lần tiếp theo (đã có image)

```bash
docker compose up -d
```

### Kiểm tra quá trình khởi động

```bash
docker compose logs -f
```

Nhấn `Ctrl+C` để thoát khỏi chế độ follow logs.

---

## 5. Kiểm tra trạng thái

### Xem tất cả services

```bash
docker compose ps
```

**Kết quả mong đợi:**

```
NAMES                  STATUS
quickstay-mysql-1      Up X minutes (healthy)
quickstay-backend-1    Up X minutes (healthy)
quickstay-frontend-1   Up X minutes
```

> `(healthy)` nghĩa là healthcheck đã pass. Chờ đến khi backend `healthy` trước khi truy cập.

### Kiểm tra backend health

```bash
# Từ terminal host (backend expose port 8080 trong dev compose)
curl http://localhost:8080/actuator/health

# Hoặc từ trong container
docker exec quickstay-backend-1 wget -qO- http://localhost:8080/actuator/health
```

**Kết quả mong đợi:** `{"status":"UP"}`

### Kiểm tra Flyway migration

```bash
docker logs quickstay-backend-1 | grep -i flyway
```

**Kết quả mong đợi:** `Successfully applied X migration(s)` hoặc `No migration necessary`

### Kiểm tra MySQL

```bash
docker exec quickstay-mysql-1 mysqladmin ping -h localhost -u root -p"$DB_ROOT_PASSWORD"
```

**Kết quả mong đợi:** `mysqld is alive`

---

## 6. Truy cập hệ thống

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | http://localhost:8081 | Giao diện người dùng |
| **Backend API** | http://localhost:8080/api | REST API (dev only) |
| **Backend Health** | http://localhost:8080/actuator/health | Health check |
| **API qua Nginx** | http://localhost:8081/api | API thông qua proxy |

> **Tài khoản mặc định:**
> - **Admin:** `admin@quickstay.local` / `Admin@123` *(đổi mật khẩu trước khi dùng thật)*
> - **Customer:** Đăng ký mới tại http://localhost:8081/register

---

## 7. Database và dữ liệu mẫu

### Thông tin database

| Thuộc tính | Giá trị |
|-----------|---------|
| Engine | MySQL 8.4 |
| Database name | `quickstay` |
| User | `quickstay` |
| Migration | Flyway (tự động khi backend khởi động) |

### Migration files

| File | Nội dung |
|------|---------|
| `V1__init_schema.sql` | Tạo tables: users, hotels, rooms, bookings |
| `V2__payments_emails_auth_tokens.sql` | Thêm payment, email logs, auth tokens |
| `V3__hotel_extras_reviews_qa_settings.sql` | Thêm reviews, QA, settings |
| `V4__fix_booking_status_type.sql` | Fix column type cho volume cũ |

### Seed data mẫu

Nếu muốn tạo 4 khách sạn mẫu để xem thử:

```bash
# Thêm hoặc đổi trong .env
SEED_SAMPLE_DATA=true
```

Sau đó restart backend:

```bash
docker compose restart backend
```

---

## 8. Xem logs

```bash
# Tất cả services
docker compose logs -f

# Chỉ backend
docker compose logs -f backend

# Chỉ database
docker compose logs -f mysql

# 50 dòng cuối của backend
docker compose logs --tail=50 backend
```

---

## 9. Dừng hệ thống an toàn

### Dừng containers (giữ nguyên dữ liệu)

```bash
docker compose down
```

Lệnh này chỉ dừng và xóa containers, **không xóa dữ liệu MySQL** (volume được giữ nguyên).

### Khởi động lại

```bash
docker compose up -d
```

> ⚠️ **KHÔNG chạy `docker compose down -v`** — lệnh này sẽ xóa toàn bộ dữ liệu MySQL.

---

## 10. Xử lý lỗi thường gặp

### Lỗi: Backend crash ngay sau khi start

**Triệu chứng:** `quickstay-backend-1 Restarting (1)`

**Kiểm tra log:**
```bash
docker logs quickstay-backend-1 --tail 20
```

**Nguyên nhân thường gặp:**

| Lỗi trong log | Nguyên nhân | Cách sửa |
|--------------|-------------|---------|
| `Found non-empty schema but no schema history table` | Volume có data cũ, Flyway chưa baseline | Thêm `spring.flyway.baseline-on-migrate=true` vào `application.properties` |
| `wrong column type found [enum] expecting [varchar(20)]` | Schema không khớp entity | Chạy `ALTER TABLE` hoặc dùng migration V4 |
| `BindValidationException on app.admin.password` | Biến `ADMIN_PASSWORD` chưa set hoặc quá ngắn (< 6 ký tự) | Kiểm tra file `.env` |
| `Communications link failure` | Backend khởi động trước MySQL healthy | Đợi 30-60s, MySQL cần thời gian khởi động |

### Lỗi: Không truy cập được `localhost:8081`

```bash
# Kiểm tra frontend có chạy không
docker ps | grep frontend
# Kiểm tra port binding
docker compose ps
```

### Lỗi: `port is already allocated`

Port 8081 hoặc 8080 đang được ứng dụng khác dùng:

```bash
# Windows PowerShell — kiểm tra port 8081
netstat -ano | findstr :8081
```

Đổi port trong `.env`:
```
FRONTEND_PORT=8082
BACKEND_PORT=8083
```

### Lỗi: MySQL không healthy sau 2 phút

```bash
docker logs quickstay-mysql-1 --tail 30
```

Thường do thiếu disk space hoặc permission. Kiểm tra dung lượng ổ đĩa.

### Reset hoàn toàn (MẤT DỮ LIỆU)

> ⚠️ Chỉ dùng khi muốn bắt đầu từ đầu hoàn toàn.

```bash
docker compose down
docker volume rm quickstay_mysql-data  # Xóa dữ liệu MySQL
docker compose up -d --build
```

---

*Tài liệu này được tạo ngày 17/11/2026. Trở về [README tổng](../README.md).*
