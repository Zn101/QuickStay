# T171 – GHCR Docker Image Report

**Ngày:** 11/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh:** `recovery/clean-dev` @ `196e23b`  
**Main:** `ef1393d`

---

## 1. Trạng thái T170 và T121

| Task | Trạng thái | Ghi chú |
|------|-----------|---------|
| T170 – Merge readiness | ❌ NOT READY | `ci.yml` chưa commit, `cd-docker.yml` conflict risk |
| T121 – CD workflow | ✅ Tồn tại | `cd-docker.yml` trên main đã chạy thành công |
| T171 | ⚠️ BLOCKED (T170) | Nhưng GHCR images đã tồn tại từ main |

> T170 chưa hoàn thành, nhưng GHCR images ĐÃ tồn tại vì CD workflow trên `main` đã chạy trước đó (commit `ef1393d`).

---

## 2. Kiểm tra workflow T121 (cd-docker.yml)

### Trên `main` (origin/main)

| Kiểm tra | Kết quả |
|---------|---------|
| Trigger | `push: branches: [main]` ✅ |
| Permissions | `contents: read, packages: write` ✅ |
| GHCR login | `GITHUB_TOKEN` (không PAT) ✅ |
| Backend build + push | ✅ `docker/build-push-action@v6` |
| Frontend build + push | ✅ `docker/build-push-action@v6` |
| Tags | `sha-<short>` + `latest` ✅ |
| Docker Buildx | ✅ `docker/setup-buildx-action@v3` |
| GHA cache | ✅ `cache-from/to: type=gha` |
| Image namespace | `ghcr.io/zn101/quickstay-*` (hardcoded) ✅ |
| VPS deploy | ✅ **Có** — SSH vào VPS, pull image, restart, healthcheck |
| SSH key | `${{ secrets.VPS_SSH_KEY }}` (base64 decoded) ✅ |
| SSH fingerprint verify | ✅ `ssh-keygen -lf` check |
| Quality gate CI | ❌ **Không có** — CD chạy trực tiếp khi push main, không chờ CI |

### Trên `recovery/clean-dev`

| Kiểm tra | Kết quả |
|---------|---------|
| Trigger | `push: branches: [main]` ✅ (giống main) |
| Image namespace | `${{ github.repository_owner }}` (dynamic) ✅ |
| VPS deploy | ❌ **Không có** — chỉ build + push GHCR |
| Khác biệt vs main | Không có SSH deploy steps |

### Rủi ro

| Rủi ro | Mức độ | Ghi chú |
|--------|--------|---------|
| CD không chờ CI pass | 🟡 Trung bình | Push main → CD chạy ngay, không chờ CI |
| `cd-docker.yml` conflict khi merge | 🔴 Cao | main có VPS deploy, recovery/clean-dev không có |
| Không có quality gate | 🟡 Trung bình | Code chưa test có thể deploy lên VPS |

---

## 3. Kiểm tra Backend Dockerfile

| Kiểm tra | Kết quả |
|---------|---------|
| Multi-stage build | ✅ `eclipse-temurin:17-jdk-alpine` → `17-jre-alpine` |
| Java version | ✅ 17 (JDK build, JRE runtime) |
| Non-root user | ✅ `appuser:appgroup` |
| curl installed | ✅ `apk add --no-cache curl` (T146 — cho healthcheck) |
| `.dockerignore` | ✅ Loại trừ `.env`, `build/`, `.gradle/`, IDE files |
| Secret trong image | ✅ Không có — `.env` bị exclude |
| EXPOSE | ✅ 8080 |
| Build command | `./gradlew bootJar --no-daemon -x test` ✅ |
| Image size (GHCR) | 382MB ✅ hợp lý |

---

## 4. Kiểm tra Frontend Dockerfile

| Kiểm tra | Kết quả |
|---------|---------|
| Multi-stage build | ✅ `node:22-alpine` → `nginx:1.27-alpine` |
| Node version | 22 (alpine) ✅ |
| npm ci | ✅ (dùng `package-lock.json`) |
| Build | `npm run build` → `vite build` ✅ |
| Nginx config | ✅ `nginx.conf` copied to `/etc/nginx/conf.d/default.conf` |
| Static files | ✅ `dist/` → `/usr/share/nginx/html` |
| EXPOSE | ✅ 80 |
| Secret trong image | ✅ Không có |
| Image size (GHCR) | 74.2MB ✅ nhỏ gọn |

---

## 5. Kiểm tra docker-compose.prod.yml

| Kiểm tra | Kết quả |
|---------|---------|
| Backend image | `ghcr.io/zn101/quickstay-backend:latest` ✅ |
| Frontend image | `ghcr.io/zn101/quickstay-frontend:latest` ✅ |
| MySQL image | `mysql:8.4` ✅ |
| MySQL expose port | ❌ Không expose ✅ (internal only) |
| Backend expose port | ❌ Không expose ✅ (Nginx proxies) |
| Frontend expose port | `${FRONTEND_PORT:-8081}:80` ✅ |
| MySQL volume | `mysql-data` ✅ persistent |
| Network | `internal` bridge ✅ |
| Backend healthcheck | `curl /actuator/health` ✅ |
| MySQL healthcheck | `mysqladmin ping` ✅ |
| Env vars đầy đủ | ✅ DB_PASSWORD, JWT_SECRET, CORS_ORIGINS, ADMIN_PASSWORD, SEED_SAMPLE_DATA, APP_TIMEZONE |
| Env vars thiếu | ❌ Không có |

---

## 6. Tên chính xác của hai image

| Image | GHCR Path | Tag |
|-------|-----------|-----|
| Backend | `ghcr.io/zn101/quickstay-backend` | `latest`, `sha-<short>` |
| Frontend | `ghcr.io/zn101/quickstay-frontend` | `latest`, `sha-<short>` |

---

## 7. Kết quả kiểm tra GHCR thực tế

### Pull test trên máy Windows

| Image | Pull | Size | Status |
|-------|------|------|--------|
| `ghcr.io/zn101/quickstay-backend:latest` | ✅ Thành công | 382MB | ✅ PASS |
| `ghcr.io/zn101/quickstay-frontend:latest` | ✅ Thành công | 74.2MB | ✅ PASS |

### Bằng chứng

```
$ docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}"
ghcr.io/zn101/quickstay-frontend:latest   74.2MB
ghcr.io/zn101/quickstay-backend:latest    382MB
```

Cả 2 image tồn tại trên GHCR và pull thành công.

---

## 8. Tags thực tế

| Tag | Ý nghĩa | Trạng thái |
|-----|---------|-----------|
| `latest` | Bản build mới nhất từ `main` | ✅ Tồn tại |
| `sha-<short>` | Bản build theo commit SHA | ⚠️ Không kiểm tra từng tag |

---

## 9. Kiểm tra Git state

| Kiểm tra | Kết quả |
|---------|---------|
| Nhánh hiện tại | `recovery/clean-dev` |
| Working tree | 3 file untracked (`ci.yml`, T169, T170 reports) |
| T170 merged? | ❌ **Chưa** — recovery/clean-dev chưa merge vào main |
| Merge in progress? | ❌ Không |
| Rebase in progress? | ❌ Không |

---

## 10. Lỗi, rủi ro và cách khắc phục

| # | Vấn đề | Mức độ | Cách khắc phục |
|---|--------|--------|---------------|
| 1 | T170 chưa hoàn thành — `ci.yml` chưa commit | 🔴 Cao | Commit + push ci.yml, merge vào recovery/clean-dev, sau đó merge vào main |
| 2 | `cd-docker.yml` conflict khi merge vào main | 🔴 Cao | Giữ version main (có VPS deploy) |
| 3 | CD không có quality gate (chờ CI pass) | 🟡 Trung bình | Thêm `needs: ci` hoặc dùng `workflow_run` trigger |
| 4 | `ci.yml` untracked trên recovery/clean-dev | 🟡 Trung bình | Commit trước merge |
| 5 | GHCR package visibility | Low | Kiểm tra Settings → Packages → Public |

---

## 11. Kết luận

**T171: BLOCKED (T170 chưa hoàn thành) — nhưng GHCR images đã tồn tại**

| Tiêu chí | Trạng thái |
|---------|-----------|
| Workflow T121 cấu hình đúng | ✅ PASS |
| Backend Dockerfile đúng | ✅ PASS |
| Frontend Dockerfile đúng | ✅ PASS |
| docker-compose.prod.yml đúng | ✅ PASS |
| GHCR backend image tồn tại | ✅ PASS (pulled 382MB) |
| GHCR frontend image tồn tại | ✅ PASS (pulled 74.2MB) |
| T170 đã merge vào main | ❌ BLOCKED |
| CI đã chạy trên recovery/clean-dev | ❌ BLOCKED (ci.yml uncommitted) |
| Quality gate trước CD | ❌ MISSING |

### Các bước tiếp theo

1. Commit `ci.yml` + T169/T170/T171 reports lên `minh/assigned-tasks`
2. Tạo PR vào `recovery/clean-dev` → CI tự chạy
3. CI pass → Tạo PR `recovery/clean-dev` → `main`
4. Merge → CD tự động build + push GHCR + deploy VPS
5. Kiểm tra Actions tab — cả CI và CD phải xanh
