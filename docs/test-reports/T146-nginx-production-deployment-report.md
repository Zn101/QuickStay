# T146 – Nginx Reverse Proxy & Production Deployment Report

**Ngày thực hiện:** 09/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Môi trường kiểm thử:** Windows 11, Docker Desktop, PowerShell  
**VPS thật:** Chưa có — các kiểm thử runtime trên máy chủ Ubuntu được đánh dấu **Not Run**

---

## 1. Mục tiêu

- Hoàn thiện cấu hình Nginx reverse proxy (thêm forwarded headers chuẩn)
- Cập nhật `docker-compose.prod.yml` với healthcheck đúng và biến môi trường production đầy đủ
- Bảo đảm backend tin tưởng X-Forwarded headers từ Nginx nội bộ
- Không để lộ MySQL và Backend ra Internet

---

## 2. Kiến trúc triển khai thực tế

```
Internet :8081
    └── Nginx (frontend container) – PORT 8081:80
            ├── /assets/* → static files (cache 1 năm)
            ├── /api/*    → proxy → http://backend:8080 (Docker internal)
            └── /*        → index.html (SPA fallback)
                              └── backend:8080 (Spring Boot, không expose)
                                        └── mysql:3306 (MySQL, không expose)

Docker network: internal (bridge)
Volume: mysql-data (persistent)
```

---

## 3. Files đã tạo / chỉnh sửa

| File | Thay đổi |
|------|---------|
| `frontend/nginx.conf` | Thêm `X-Forwarded-For` và `X-Forwarded-Proto` |
| `backend/src/main/resources/application.properties` | Thêm `server.forward-headers-strategy=NATIVE` |
| `backend/Dockerfile` | Thêm `RUN apk add --no-cache curl` vào runtime stage |
| `docker-compose.prod.yml` | Sửa healthcheck backend, thêm `SEED_SAMPLE_DATA`, `APP_TIMEZONE` |
| `.env.example` | Thêm `SEED_SAMPLE_DATA` và `APP_TIMEZONE` với giá trị mẫu |

---

## 4. Chi tiết thay đổi

### 4.1. nginx.conf – Forwarded Headers

```nginx
location /api/ {
    proxy_pass         http://backend:8080;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;  # THÊM MỚI
    proxy_set_header   X-Forwarded-Proto $scheme;                      # THÊM MỚI
    proxy_read_timeout 60s;
}
```

**Lý do:** Cần thiết để Spring Boot ghi log đúng IP client và xử lý scheme (http/https) khi có SSL phía trước.

### 4.2. application.properties – Forward Headers Strategy

```properties
server.forward-headers-strategy=NATIVE
```

**Lý do:** Spring Boot 3.x cần được bật để tin tưởng `X-Forwarded-For` và `X-Forwarded-Proto` từ Nginx nội bộ. Chỉ dùng `NATIVE` khi Nginx là proxy nội bộ đáng tin — KHÔNG bật khi expose backend trực tiếp ra Internet.

### 4.3. backend/Dockerfile – Thêm curl cho healthcheck

```dockerfile
# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk add --no-cache curl    # THÊM MỚI – cho docker healthcheck
```

**Lý do:** `eclipse-temurin:17-jre-alpine` không có `curl` hay `wget` theo mặc định. Cài thêm `curl` (~500KB) để healthcheck trong `docker-compose.prod.yml` hoạt động.

### 4.4. docker-compose.prod.yml – Backend healthcheck và biến mới

```yaml
backend:
  healthcheck:
    test: ["CMD-SHELL", "curl -sf http://localhost:8080/actuator/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s
  environment:
    SEED_SAMPLE_DATA: "false"                         # THÊM MỚI
    APP_TIMEZONE: ${APP_TIMEZONE:-Asia/Ho_Chi_Minh}   # THÊM MỚI
```

**`SEED_SAMPLE_DATA=false`:** Tắt SampleDataSeeder (`@ConditionalOnProperty(name="app.seed.sample-data", havingValue="true", matchIfMissing=true)`) — không seed 4 khách sạn mẫu mỗi lần restart trên production.

**`APP_TIMEZONE`:** Bind vào `app.timezone` trong `application.properties`, ảnh hưởng logic "hôm nay" khi kiểm tra ngày nhận phòng.

---

## 5. Biến môi trường production

| Biến | Bắt buộc | Giá trị mẫu | Ghi chú |
|------|---------|------------|---------|
| `DB_PASSWORD` | ✅ | `openssl rand -hex 20` | MySQL user password |
| `DB_ROOT_PASSWORD` | ✅ | `openssl rand -hex 20` | MySQL root password |
| `JWT_SECRET` | ✅ | `openssl rand -base64 48` | ≥ 32 ký tự |
| `CORS_ORIGINS` | ✅ | `http://<VPS-IP>:8081` | Domain hoặc IP thật |
| `ADMIN_PASSWORD` | Khuyến nghị | *(mật khẩu mạnh)* | Không dùng `Admin@123` |
| `ADMIN_EMAIL` | Không | `admin@yourdomain.com` | Default: `admin@quickstay.local` |
| `ANTHROPIC_API_KEY` | Không | *(để trống)* | AI chatbot, optional |
| `SEED_SAMPLE_DATA` | Không | `false` | Hardcoded `false` trong prod compose |
| `APP_TIMEZONE` | Không | `Asia/Ho_Chi_Minh` | Default có sẵn |

---

## 6. Hướng dẫn tạo .env production trên máy chủ

```bash
# Chạy trực tiếp trên VPS — KHÔNG lưu vào script hay Git
cd /path/to/QuickStay
cp .env.example .env

# Tạo secret mạnh
DB_PWD=$(openssl rand -hex 20)
DB_ROOT_PWD=$(openssl rand -hex 20)
JWT_KEY=$(openssl rand -base64 48)

# Ghi vào .env (sed thay thế giá trị)
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PWD}|" .env
sed -i "s|DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=${DB_ROOT_PWD}|" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_KEY}|" .env
sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://YOUR_VPS_IP:8081|" .env
sed -i "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=YourStrongAdminPassword|" .env

# Kiểm tra (không hiển thị giá trị secret)
grep -E "^(DB_PASSWORD|JWT_SECRET|CORS_ORIGINS)=" .env | sed 's/=.*/=***/'
```

> **Quan trọng:** Sau khi ghi xong, xóa các biến shell: `unset DB_PWD DB_ROOT_PWD JWT_KEY`

---

## 7. Kết quả kiểm thử

### Kiểm thử trên máy Windows (Docker Desktop)

| # | Kiểm tra | Lệnh | Kết quả | Status |
|---|---------|------|---------|--------|
| T146-01 | `docker-compose.yml` syntax | `docker compose config --quiet` | Exit 0 | ✅ Pass |
| T146-02 | `docker-compose.prod.yml` syntax | `docker compose -f docker-compose.prod.yml config --quiet` | Exit 0 | ✅ Pass |
| T146-03 | nginx.conf có X-Forwarded-For | `Select-String nginx.conf` | Header có mặt | ✅ Pass |
| T146-04 | nginx.conf có X-Forwarded-Proto | `Select-String nginx.conf` | Header có mặt | ✅ Pass |
| T146-05 | application.properties có forward strategy | `Select-String application.properties` | `NATIVE` có mặt | ✅ Pass |
| T146-06 | backend Dockerfile có curl | `Select-String Dockerfile` | `apk add --no-cache curl` có mặt | ✅ Pass |
| T146-07 | prod compose có SEED_SAMPLE_DATA | `Select-String docker-compose.prod.yml` | `SEED_SAMPLE_DATA: "false"` có mặt | ✅ Pass |
| T146-08 | MySQL không expose port | Parse prod config | Không có `ports:` dưới mysql | ✅ Pass |
| T146-09 | Backend không expose port | Parse prod config | Port commented out | ✅ Pass |
| T146-10 | .env.example cập nhật đủ biến | `Get-Content .env.example` | `SEED_SAMPLE_DATA`, `APP_TIMEZONE` có mặt | ✅ Pass |

### Kiểm thử runtime trên VPS Ubuntu (cần máy chủ thật)

| # | Kiểm tra | Lệnh | Status |
|---|---------|------|--------|
| T146-11 | Containers khởi động | `docker compose -f docker-compose.prod.yml ps` | ⚠️ Not Run |
| T146-12 | MySQL healthcheck | `docker inspect quickstay-mysql-1 --format='{{.State.Health.Status}}'` | ⚠️ Not Run |
| T146-13 | Backend health UP | `curl http://localhost:8080/actuator/health` | ⚠️ Not Run |
| T146-14 | Frontend HTTP 200 | `curl -I http://localhost:8081` | ⚠️ Not Run |
| T146-15 | Nginx proxy /api/ | `curl http://localhost:8081/api/hotels` | ⚠️ Not Run |
| T146-16 | SPA fallback | `curl http://localhost:8081/some-page` → index.html | ⚠️ Not Run |
| T146-17 | Đăng nhập hoạt động | `curl -X POST http://localhost:8081/api/auth/login ...` | ⚠️ Not Run |
| T146-18 | X-Forwarded-For được xử lý | Backend log hiển thị IP thật | ⚠️ Not Run |
| T146-19 | SEED_SAMPLE_DATA=false có hiệu lực | `curl http://localhost:8081/api/hotels` → `[]` (nếu không có data) | ⚠️ Not Run |
| T146-20 | MySQL volume bền vững sau restart | `docker compose restart` rồi kiểm tra data | ⚠️ Not Run |

---

## 8. Vấn đề còn tồn tại

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|----------|
| GHCR image chưa được publish | Medium | Merge vào `main` để trigger `cd-docker.yml` |
| Chưa có HTTPS/SSL | Medium | Cài Certbot + Nginx bên ngoài hoặc dùng Caddy |
| `forward-headers-strategy=NATIVE` chỉ an toàn khi backend sau proxy nội bộ | Low | Đã cấu hình đúng — backend không expose ra Internet |
| `ANTHROPIC_API_KEY` để trống — AI chatbot dùng fallback | Low | Bổ sung key khi cần AI features |

---

## 9. Hướng dẫn kiểm thử trên máy chủ

```bash
# Bước 1: Chuẩn bị .env (xem mục 6)

# Bước 2: Khởi chạy
docker compose -f docker-compose.prod.yml up -d

# Bước 3: Theo dõi startup (~90s)
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Bước 4: Kiểm tra trạng thái
docker compose -f docker-compose.prod.yml ps
# Mong đợi: mysql (healthy), backend (healthy), frontend (running)

# Bước 5: Kiểm tra health endpoint
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Bước 6: Kiểm tra Nginx proxy
curl http://localhost:8081/api/hotels
# Expected: JSON array

# Bước 7: Kiểm tra SPA fallback
curl -sI http://localhost:8081/some-nonexistent-page | head -5
# Expected: HTTP 200, Content-Type: text/html

# Bước 8: Kiểm tra SEED bị tắt
curl http://localhost:8081/api/hotels | python3 -m json.tool | head
# Expected: [] (rỗng) nếu chưa có dữ liệu
```
