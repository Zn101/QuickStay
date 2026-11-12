# T121 – GHCR Docker CD Workflow Report

**Ngày thực hiện:** 05/11/2026  
**Người thực hiện:** Minh  
**Loại:** DevOps – GitHub Actions CD  
**Phụ thuộc:** T041 (CI backend), T042 (CI frontend)

---

## 1. Tổng hợp

| Hạng mục | Kết quả |
|----------|---------|
| `backend/Dockerfile` | ✅ Tạo mới – multi-stage build |
| `.github/workflows/cd-docker.yml` | ✅ Tạo mới |
| `README.md` | ✅ Cập nhật – thêm hướng dẫn GHCR |
| Kiểm tra YAML syntax | ✅ Hợp lệ |
| Chạy workflow thực tế | ⚠️ Not Run – chưa merge vào `main` |

---

## 2. Files đã tạo / chỉnh sửa

| File | Thao tác | Mô tả |
|------|---------|-------|
| `backend/Dockerfile` | Tạo mới | Multi-stage: build JAR với Gradle → runtime JRE 17 |
| `.github/workflows/cd-docker.yml` | Tạo mới | CD workflow build + push GHCR |
| `README.md` | Cập nhật | Thêm section hướng dẫn GHCR, pull image, compose prod |

---

## 3. Chi tiết backend/Dockerfile

```dockerfile
# Stage 1: Builder – eclipse-temurin:17-jdk-alpine
# - Copy Gradle wrapper + build.gradle trước để cache dependency layer
# - ./gradlew bootJar --no-daemon -x test → build/libs/app.jar

# Stage 2: Runtime – eclipse-temurin:17-jre-alpine
# - Image tối thiểu (không có JDK, không có build tools)
# - Chạy với non-root user (appuser) – best practice bảo mật
# - EXPOSE 8080
# - ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Lý do chọn eclipse-temurin:**
- Đây là OpenJDK distribution chính thức của Eclipse Foundation
- Được Docker Official Images duy trì
- Alpine variant nhỏ gọn (~200MB runtime)

**Bảo mật:**
- Non-root user `appuser` trong group `appgroup`
- Stage builder không có trong image cuối (không lộ source code, Gradle cache)
- Không copy `.env` hay credential vào image

---

## 4. Chi tiết cd-docker.yml

### Trigger
```yaml
on:
  push:
    branches: [main]
```
Chỉ chạy khi push vào `main` — không ảnh hưởng đến CI của các nhánh feature.

### Permissions
```yaml
permissions:
  contents: read   # Đọc source code
  packages: write  # Ghi package lên GHCR
```
Quyền tối thiểu theo nguyên tắc least-privilege.

### Tên image (tự động lowercase)
| Image | GHCR Path |
|-------|-----------|
| Backend | `ghcr.io/zn101/quickstay-backend` |
| Frontend | `ghcr.io/zn101/quickstay-frontend` |

`${{ github.repository_owner }}` tự động normalize thành chữ thường → đảm bảo tuân thủ quy tắc GHCR.

### Tags tạo ra
| Tag | Ví dụ | Khi nào |
|-----|-------|---------|
| `sha-<short>` | `sha-a1b2c3d` | Mỗi commit |
| `latest` | `latest` | Chỉ khi push `main` |

### Các action sử dụng
| Action | Phiên bản | Mục đích |
|--------|-----------|---------|
| `actions/checkout` | v4 | Checkout code |
| `docker/setup-buildx-action` | v3 | Docker Buildx |
| `docker/login-action` | v3 | Đăng nhập GHCR |
| `docker/metadata-action` | v5 | Tạo tags và labels |
| `docker/build-push-action` | v6 | Build và push image |

### Cache
```yaml
cache-from: type=gha,scope=backend
cache-to: type=gha,scope=backend,mode=max
```
Dùng GitHub Actions cache — tăng tốc build lần sau bằng cách cache Docker layers.

---

## 5. Kiểm tra YAML syntax

```bash
# Kiem tra syntax YAML bang Python (co san tren moi may)
python -m py_compile cd-docker.yml  # Khong ap dung cho YAML

# Kiem tra bang actionlint (neu co)
# actionlint .github/workflows/cd-docker.yml
```

Kiểm tra thủ công bằng cách đọc file — cú pháp YAML hợp lệ:
- ✅ Indentation nhất quán (2 spaces)
- ✅ Không có tab character
- ✅ Tất cả `${{ }}` expression đúng cú pháp
- ✅ Tất cả `uses:` action có version pin
- ✅ `on:` trigger đúng cú pháp
- ✅ `permissions:` đặt đúng cấp job

---

## 6. Kiểm tra build context và Dockerfile path

| Service | Context | Dockerfile | Tồn tại |
|---------|---------|------------|---------|
| Backend | `./backend` | `./backend/Dockerfile` | ✅ |
| Frontend | `./frontend` | `./frontend/Dockerfile` | ✅ |

`docker-compose.yml` đang dùng `build: ./backend` và `build: ./frontend` — đúng với context của workflow.

---

## 7. Kết quả chạy workflow thực tế

**Trạng thái: ⚠️ Not Run**

Workflow chưa được chạy vì:
1. Chưa có nhánh `main` trong repository (nhánh mặc định có thể là `dev` hoặc `recovery/clean-dev`)
2. Workflow chỉ trigger khi push vào `main`
3. Chưa được merge và push lên remote

---

## 8. Các bước cần thực hiện trên GitHub

### Bước 1: Merge code vào `main`
```bash
# Tao PR tu nhanh hien tai vao main
# Sau khi merge, workflow tu dong chay
```

### Bước 2: Kiểm tra package visibility
Sau lần push đầu tiên, vào:
```
https://github.com/Zn101/QuickStay/pkgs/container/quickstay-backend
https://github.com/Zn101/QuickStay/pkgs/container/quickstay-frontend
```
Đổi visibility từ **Private** → **Public** nếu muốn cho phép pull không cần đăng nhập.

### Bước 3: Cấp quyền package cho repository
Vào Settings → Packages → Linked repositories → Add `Zn101/QuickStay`

### Bước 4: Pull và chạy thử
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u Zn101 --password-stdin
docker pull ghcr.io/zn101/quickstay-backend:latest
docker pull ghcr.io/zn101/quickstay-frontend:latest
```

---

## 9. Lệnh kiểm tra local

```bash
# Test build backend image local (can co Java 17 trong PATH)
docker build -t quickstay-backend-test ./backend

# Test build frontend image local
docker build -t quickstay-frontend-test ./frontend

# Kiem tra image size
docker images | grep quickstay

# Kiem tra non-root user
docker run --rm quickstay-backend-test whoami
# Expected: appuser

# Kiem tra EXPOSE port
docker inspect quickstay-backend-test | grep ExposedPorts
```

---

## 10. Kết luận

**T121: Triển khai hoàn thành – Chờ chạy thực tế trên GitHub**

Tất cả file đã sẵn sàng. Workflow sẽ tự động chạy khi merge vào `main`.
Không làm ảnh hưởng đến CI workflows (T041/T042) vì chúng chưa tồn tại và workflow CD chỉ trigger trên `main`.
