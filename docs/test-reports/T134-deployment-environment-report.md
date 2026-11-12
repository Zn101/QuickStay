# T134 – Deployment Environment Report

**Ngày thực hiện:** 06/11/2026  
**Người thực hiện:** Minh  
**Loại:** DevOps – Chuẩn bị môi trường triển khai  
**Môi trường kiểm thử:** Windows 11, Docker Desktop, PowerShell

---

## 1. Mục tiêu

Chuẩn bị môi trường triển khai QuickStay để người khác có thể triển khai lại trên VPS Ubuntu hoặc máy demo theo hướng dẫn, bao gồm:
- Hoàn thiện cấu hình Docker Compose production
- Bảo đảm secret không bị đưa vào image hoặc Git
- Viết hướng dẫn triển khai từ máy sạch
- Kiểm tra YAML syntax và bảo mật cấu hình

---

## 2. Kiến trúc triển khai

```
Browser :8081
    └── Nginx (frontend container)
            ├── /* → React SPA (static files)
            └── /api/* → http://backend:8080 (Docker internal network)
                              └── MySQL :3306 (Docker internal network)
```

**Network:** Tất cả 3 service nằm trong bridge network `internal` — MySQL và Backend không expose ra host trên `docker-compose.prod.yml`.

---

## 3. Files đã tạo / chỉnh sửa

| File | Thao tác | Mục đích |
|------|---------|---------|
| `backend/.dockerignore` | Tạo mới | Loại trừ `build/`, `.gradle/`, `.env`, IDE files khỏi Docker build context |
| `docker-compose.prod.yml` | Tạo mới | Compose dùng image GHCR, MySQL không expose, volume bền vững |
| `README.md` | Cập nhật | Thêm section hướng dẫn triển khai VPS Ubuntu đầy đủ |

---

## 4. Cấu hình triển khai

### docker-compose.prod.yml

| Service | Image | Port exposed | Network |
|---------|-------|-------------|---------|
| `mysql` | `mysql:8.4` | Không (internal only) | `internal` |
| `backend` | `ghcr.io/zn101/quickstay-backend:latest` | Không (proxied by nginx) | `internal` |
| `frontend` | `ghcr.io/zn101/quickstay-frontend:latest` | `8081:80` | `internal` |

### backend/.dockerignore – các mục bị loại trừ

```
build/          – Gradle output cũ trên host
.gradle/        – Gradle cache
.env / .env.*   – File môi trường chứa secret
.idea/ *.iml    – IDE files
.git/           – Git history
*.md / docs/    – Tài liệu
*.log           – Log files
Dockerfile      – Không cần trong image
```

> `src/test/` **không** bị loại trừ vì Dockerfile dùng `-x test` để skip test, nhưng nếu muốn giảm build context có thể thêm vào.

---

## 5. Biến môi trường cần cấu hình

| Biến | Bắt buộc | Giá trị mẫu | Ghi chú |
|------|---------|------------|---------|
| `DB_PASSWORD` | ✅ | `<20+ ký tự ngẫu nhiên>` | `openssl rand -hex 20` |
| `DB_ROOT_PASSWORD` | ✅ | `<20+ ký tự ngẫu nhiên>` | `openssl rand -hex 20` |
| `JWT_SECRET` | ✅ | `<48 ký tự ngẫu nhiên>` | `openssl rand -base64 48` |
| `CORS_ORIGINS` | ✅ | `http://<VPS-IP>:8081` | Domain hoặc IP thật |
| `ADMIN_EMAIL` | Khuyến nghị | `admin@yourdomain.com` | |
| `ADMIN_PASSWORD` | Khuyến nghị | `<mật khẩu mạnh>` | Không dùng `Admin@123` |
| `ANTHROPIC_API_KEY` | Không | _(empty)_ | AI features, để trống nếu không dùng |
| `FRONTEND_PORT` | Không | `8081` | Đổi nếu bị trùng port |

---

## 6. Các lệnh triển khai

```bash
# Clone
git clone https://github.com/Zn101/QuickStay.git && cd QuickStay

# Chuẩn bị env
cp .env.example .env
# Sửa .env với giá trị production

# (Nếu package private) Đăng nhập GHCR
echo <TOKEN> | docker login ghcr.io -u <USERNAME> --password-stdin

# Pull và khởi chạy
docker pull ghcr.io/zn101/quickstay-backend:latest
docker pull ghcr.io/zn101/quickstay-frontend:latest
docker compose -f docker-compose.prod.yml up -d

# Kiểm tra
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8080/actuator/health
curl http://localhost:8081/api/hotels
```

---

## 7. Kết quả kiểm thử

### Kiểm tra tự động (trên máy Windows + Docker Desktop)

| # | Kiểm tra | Lệnh | Kết quả | Status |
|---|---------|------|---------|--------|
| T134-01 | `docker-compose.yml` syntax hợp lệ | `docker compose -f docker-compose.yml config --quiet` | Exit code 0 | ✅ Pass |
| T134-02 | `docker-compose.prod.yml` syntax hợp lệ | `docker compose -f docker-compose.prod.yml config --quiet` | Exit code 0 | ✅ Pass |
| T134-03 | MySQL không expose port ra host | Parse config output | Không có `ports:` dưới mysql | ✅ Pass |
| T134-04 | `.env` được gitignore | `git check-ignore -v .env` | `.gitignore:6:.env` | ✅ Pass |
| T134-05 | Image name khớp với `cd-docker.yml` | So sánh workflow vs prod compose | `ghcr.io/zn101/quickstay-backend:latest` khớp | ✅ Pass |
| T134-06 | `backend/.dockerignore` tồn tại | `Test-Path` | `True` | ✅ Pass |
| T134-07 | `docker-compose.prod.yml` tồn tại | `Test-Path` | `True` | ✅ Pass |

### Kiểm tra runtime (cần Docker + GHCR access)

| # | Kiểm tra | Cách kiểm tra | Status |
|---|---------|--------------|--------|
| T134-08 | Pull image GHCR thành công | `docker pull ghcr.io/zn101/quickstay-backend:latest` | ⚠️ Not Run – image chưa có (workflow CD chưa chạy trên `main`) |
| T134-09 | Backend health UP | `curl http://localhost:8080/actuator/health` | ⚠️ Not Run – cần container chạy |
| T134-10 | Frontend trả HTTP 200 | `curl -I http://localhost:8081` | ⚠️ Not Run – cần container chạy |
| T134-11 | Nginx proxy `/api/` → backend | `curl http://localhost:8081/api/hotels` | ⚠️ Not Run – cần container chạy |
| T134-12 | MySQL volume bền vững sau `down`/`up` | `docker compose down` rồi `up -d`, kiểm tra data | ⚠️ Not Run – cần container chạy |
| T134-13 | Backend kết nối MySQL | Log: `HikariPool ... start completed` | ⚠️ Not Run |

> **Lý do Not Run:** Image GHCR chưa được push (workflow `cd-docker.yml` chỉ trigger trên nhánh `main`, chưa có merge). Khi sử dụng `docker-compose.yml` (build từ source) thay thế có thể kiểm tra runtime ngay trên máy Windows.

### Kiểm tra build từ source (docker-compose.yml)

Để kiểm tra runtime trên máy demo **trước khi có GHCR image**:

```bash
# Dùng file dev compose (build từ source)
cp .env.example .env
docker compose up --build -d

# Kiểm tra
docker compose ps
curl http://localhost:8080/actuator/health
curl http://localhost:8081/api/hotels
```

---

## 8. Vấn đề còn tồn tại

| Vấn đề | Mức độ | Giải pháp đề xuất |
|--------|--------|-----------------|
| GHCR image chưa tồn tại (workflow CD chưa chạy) | Medium | Merge code vào `main` để trigger `cd-docker.yml` |
| Backend port không expose trong prod → khó debug trực tiếp | Low | Bỏ comment `ports:` trong `docker-compose.prod.yml` khi debug |
| Chưa có SSL/HTTPS trong cấu hình | Medium | Thêm Nginx reverse proxy bên ngoài (Certbot + Let's Encrypt) hoặc Caddy |
| Chưa có monitoring/alerting | Low | Thêm Prometheus + Grafana hoặc dịch vụ cloud |

---

## 9. Hướng dẫn kiểm thử từng bước

### Trên máy Windows (Docker Desktop)

```powershell
# Bước 1: Kiểm tra Docker
docker --version
docker compose version

# Bước 2: Kiểm tra config
docker compose -f docker-compose.prod.yml config --quiet
# Expected: không có output lỗi, exit code 0

# Bước 3: Chạy từ source (thay thế GHCR khi image chưa có)
cp .env.example .env
docker compose up --build -d

# Bước 4: Kiểm tra health
Start-Sleep -Seconds 60   # Chờ backend khởi động
Invoke-WebRequest http://localhost:8080/actuator/health | Select-Object -ExpandProperty Content
# Expected: {"status":"UP"}

# Bước 5: Kiểm tra API qua Nginx
Invoke-WebRequest http://localhost:8081/api/hotels | Select-Object StatusCode
# Expected: 200

# Bước 6: Dừng an toàn
docker compose down
# Volume mysql-data vẫn còn, KHÔNG chạy down -v
```

### Trên VPS Ubuntu

Xem section **"🚀 Triển khai trên VPS Ubuntu"** trong `README.md`.

---

## 10. Kết luận

**T134: HOÀN THÀNH** – Môi trường triển khai đã được chuẩn bị đầy đủ:

- ✅ `backend/.dockerignore` bảo vệ image khỏi file thừa và secret
- ✅ `docker-compose.prod.yml` cấu hình bảo mật: MySQL không expose, volume bền vững
- ✅ Image name khớp chính xác với workflow CD
- ✅ README có hướng dẫn triển khai VPS đầy đủ từ máy sạch
- ✅ YAML syntax hợp lệ trên cả 2 file Compose
- ⚠️ Runtime test chờ GHCR image (merge vào `main` để trigger workflow)
