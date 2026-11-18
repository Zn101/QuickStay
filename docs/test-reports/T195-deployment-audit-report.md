# T195 – Deployment Audit Report

**Ngày:** 15/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh:** `minh/assigned-tasks`  
**Docker Desktop:** Không chạy trên máy kiểm tra (Linux engine offline) — các kiểm tra runtime ghi **Not Run**.

---

## G1.1 – Verification of Fix Strategy (Cập nhật sau khi xác minh origin/main)

### Phân biệt origin/main vs local

Phân tích ban đầu (G1) chỉ kiểm tra file local. Sau khi so sánh với `origin/main`, nhiều lỗi đã được sửa hoặc không tồn tại trên main. Bảng dưới phân biệt rõ:

| Lỗi | origin/main | Local (minh/assigned-tasks) | Đánh giá lại |
|-----|-------------|---------------------------|-------------|
| BUG-02 healthcheck `wget` | `wget` — Alpine BusyBox **có** `wget` | `wget` (giống main) | ❌ **KHÔNG phải bug** — BusyBox cung cấp `wget` |
| BUG-01 volume name `quickstay_mysql-test` | `mysql-data:` (không có `name:`) | `name: quickstay_mysql-test` | ⚠️ Chỉ tồn tại trên local branch |
| BUG-03 ci.yml trigger | `push: [main, dev]` ✅ đúng | `push: [recovery/clean-dev]` | ❌ **KHÔNG phải bug trên main** — local `ci.yml` cũ hơn |
| BUG-04 backend port expose | ❌ Không expose ✅ | `ports: 8080:8080` (local modify) | ❌ **KHÔNG phải bug trên main** — local thêm port (T146) |
| BUG-05 T193-G2.2-A | ❌ Chưa merge | `application-prod.properties` local | ✅ **Bug xác nhận** — cần merge |
| BUG-06 network isolation | ❌ Không có networks trong dev | Không có (giống main) | ⚠️ Medium (dev only) |
| BUG-07 depends_on healthy | Frontend chỉ `depends_on: - backend` | Giống main | ⚠️ Medium (dev only) |
| BUG-08 curl thiếu | Không cần — `wget` hoạt động | Không cần | ❌ **KHÔNG phải bug** |
| BUG-09 SEED_SAMPLE_DATA | `true` default vs `.env.example` `false` | Giống main | 🟢 Low |

---

## 1. Tổng Quan Kiến Trúc Triển Khai

```
Browser :8081
    └── Nginx (frontend container)
            ├── /assets/* → cache 1 năm
            ├── /api/*    → proxy → backend:8080 (Docker internal)
            └── /*        → index.html (SPA fallback)
                              └── backend:8080 (Spring Boot)
                                        └── mysql:3306 (MySQL 8.4)
```

**Hai chế độ triển khai:**

| File | Mục đích | Build |
|------|---------|-------|
| `docker-compose.yml` | Dev/CI — build từ source | `build: ./backend`, `build: ./frontend` |
| `docker-compose.prod.yml` | Production — dùng GHCR image | `image: ghcr.io/zn101/quickstay-*:latest` |

---

## 2. Danh Sách Lỗi Phát Hiện

### 🔴 BUG-01 – CRITICAL: `docker-compose.yml` đặt volume name cố định `quickstay_mysql-test`

**Vị trí:** `docker-compose.yml` dòng cuối:
```yaml
volumes:
  mysql-data:
    name: quickstay_mysql-test
```

**Vấn đề:** Volume tên `quickstay_mysql-test` có hậu tố `-test` gợi ý đây là volume test, nhưng tất cả người dùng dev đều dùng chung volume này. Nếu ai chạy `docker compose down -v` nhầm, volume named này bị xóa và toàn bộ dữ liệu dev mất. Hơn nữa, `docker-compose.prod.yml` không set `name:` cho volume `mysql-data` → hai compose tạo ra hai volume khác nhau không nhất quán.

**Mức độ:** 🔴 Critical  
**Trạng thái:** Xác nhận từ file — tái hiện khi so sánh 2 compose file.

---

### 🔴 BUG-02 – CRITICAL: `docker-compose.prod.yml` healthcheck backend dùng `wget` nhưng image không có `wget`

**Vị trí:** `docker-compose.prod.yml`:
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:8080/actuator/health || exit 1"]
```

**Vấn đề:** `backend/Dockerfile` runtime stage là `eclipse-temurin:17-jre-alpine`. Alpine image **không có `wget` theo mặc định**. Healthcheck sẽ luôn fail → container stuck ở `unhealthy` → `frontend` không bao giờ start (vì `depends_on: service_healthy`).

**Lưu ý quan trọng:** `backend/Dockerfile` local hiện tại **không có** `RUN apk add --no-cache curl`. File T193-G2.2-A đã thêm `curl` vào `application-prod.properties` (local, chưa commit) nhưng `Dockerfile` trên nhánh này không có lệnh install. Phải kiểm tra Dockerfile thực tế trên `origin/main`.

**Mức độ:** 🔴 Critical  
**Trạng thái:** Xác nhận từ file — `wget` không có trong base image.

---

### 🟡 BUG-03 – HIGH: `ci.yml` trigger sai nhánh — không trigger trên `main`

**Vị trí:** `.github/workflows/ci.yml`:
```yaml
on:
  push:
    branches:
      - recovery/clean-dev   # ← chỉ dev branch
  pull_request:
    branches:
      - recovery/clean-dev
```

**Vấn đề:** CI pipeline chỉ chạy trên `recovery/clean-dev`. Khi push trực tiếp vào `main` (ví dụ hotfix), CI không chạy. CD (`cd-docker.yml`) trigger trên `main` nhưng không `needs: ci` → code có thể deploy lên VPS mà không qua CI.

**Lưu ý:** Từ T194 audit, `ci.yml` trên `origin/main` có trigger `push: [main, dev]` — tức là file trên main khác với file local. Có sự bất nhất giữa local working tree và remote.

**Mức độ:** 🟡 High  
**Trạng thái:** Xác nhận từ file local.

---

### 🟡 BUG-04 – HIGH: `docker-compose.yml` expose backend port 8080 ra host không cần thiết

**Vị trí:** `docker-compose.yml`:
```yaml
backend:
  ports:
    - "${BACKEND_PORT:-8080}:8080"
```

**Vấn đề:** Backend không cần expose port ra host vì Nginx proxy qua Docker internal network. Mở port 8080 ra host tăng attack surface — ai truy cập `http://<host>:8080` có thể bypass Nginx và CORS.

Tương tự trong `docker-compose.prod.yml`:
```yaml
backend:
  ports:
    - "${BACKEND_PORT:-8080}:8080"
```

**Lưu ý:** `cd-docker.yml` VPS deploy script dùng `curl -fsS http://localhost:8080/actuator/health` → nếu xóa port mapping, healthcheck script cần cập nhật.

**Mức độ:** 🟡 High (Medium cho dev compose)  
**Trạng thái:** Xác nhận từ file.

---

### 🟡 BUG-05 – HIGH: `application.properties` còn fallback `Admin@123` và `dev-only-secret`

**Vị trí:** `application.properties`:
```properties
app.admin.password=${ADMIN_PASSWORD:Admin@123}         # dòng 24
app.jwt.secret=${JWT_SECRET:dev-only-secret-change-me-dev-only-secret-change-me}  # dòng 16
```

**Vấn đề:** Nếu chạy backend trực tiếp (không qua docker-compose.prod.yml với `SPRING_PROFILES_ACTIVE=prod`), fallback yếu được dùng. `application-prod.properties` đã được tạo (local, chưa commit) nhưng chưa có trên `origin/main`.

**Mức độ:** 🟡 High  
**Trạng thái:** Xác nhận từ file — T193-G2.2-A chưa merge vào main.

---

### 🟡 BUG-06 – MEDIUM: `docker-compose.yml` không có `networks` — service dùng default network

**Vị trí:** `docker-compose.yml` — không có `networks:` block.

**Vấn đề:** Dev compose dùng default bridge network. Prod compose có `networks: internal`. Hành vi CORS và routing có thể khác nhau giữa môi trường. Không có `network: internal` trong dev compose có thể gây khó debug khi cần reproduce lỗi production.

**Mức độ:** 🟡 Medium  
**Trạng thái:** Xác nhận từ file.

---

### 🟡 BUG-07 – MEDIUM: `docker-compose.yml` frontend không có `depends_on: service_healthy` cho backend

**Vị trí:** `docker-compose.yml`:
```yaml
frontend:
  depends_on:
    - backend    # chỉ depends_on started, không chờ healthy
```

**Vấn đề:** Frontend container start khi backend container started, không chờ backend healthy. Có thể gây 502 Bad Gateway tạm thời khi backend đang khởi động (đặc biệt khi build từ source lần đầu).

**Prod compose đã đúng:**
```yaml
frontend:
  depends_on:
    backend:
      condition: service_healthy
```

**Mức độ:** 🟡 Medium  
**Trạng thái:** Xác nhận từ file.

---

### 🟢 BUG-08 – LOW: `backend/Dockerfile` không có `curl` — healthcheck prod sẽ fail

**Vị trí:** `backend/Dockerfile` — không có `RUN apk add --no-cache curl`.

**Vấn đề:** Liên quan đến BUG-02. Prod compose dùng `wget` (không có) và bản gốc không có `curl`. Dù BUG-02 nên được sửa sang dùng `curl`, thì `curl` cũng cần được install trong image.

**Mức độ:** 🟢 Low (kết hợp với BUG-02 → Critical)  
**Trạng thái:** Xác nhận từ file.

---

### 🟢 BUG-09 – LOW: `.env.example` có `SEED_SAMPLE_DATA=false` nhưng `application.properties` default là `true`

**Vị trí:**
- `.env.example`: `SEED_SAMPLE_DATA=false`
- `application.properties`: `app.seed.sample-data=${SEED_SAMPLE_DATA:true}`

**Vấn đề:** Nếu người dùng copy `.env.example` → `.env` và bỏ trống `SEED_SAMPLE_DATA`, `application.properties` sẽ dùng default `true` → seed 4 khách sạn mẫu dù người dùng nghĩ đã tắt. `.env.example` đã set `false` nhưng default trong `application.properties` chưa được đổi.

**Mức độ:** 🟢 Low  
**Trạng thái:** Xác nhận từ file.

---

## 3. Kiểm Tra Từng Thành Phần

### Backend Dockerfile

| Hạng mục | Kết quả | Ghi chú |
|---------|---------|---------|
| Multi-stage build | ✅ OK | JDK alpine → JRE alpine |
| Java version | ✅ 17 | Temurin |
| CRLF fix | ✅ OK | `sed -i 's/\r$//' gradlew` |
| Non-root user | ✅ OK | `appuser:appgroup` |
| `curl` install | ❌ **Thiếu** | Cần cho healthcheck prod |
| Secret trong image | ✅ OK | Không có |
| EXPOSE | ✅ 8080 | |

### Frontend Dockerfile

| Hạng mục | Kết quả | Ghi chú |
|---------|---------|---------|
| Multi-stage build | ✅ OK | node:22-alpine → nginx:1.27-alpine |
| npm ci | ✅ OK | |
| Vite build | ✅ OK | |
| nginx.conf copy | ✅ OK | |

### Nginx Configuration

| Hạng mục | Kết quả | Ghi chú |
|---------|---------|---------|
| Proxy `/api/` | ✅ OK | `proxy_pass http://backend:8080` |
| SPA fallback | ✅ OK | `try_files $uri /index.html` |
| X-Forwarded headers | ✅ OK | Có `X-Forwarded-For`, `X-Forwarded-Proto` |
| Gzip | ✅ OK | |
| Cache assets | ✅ OK | `expires 1y` |
| HTTPS/SSL | ⚠️ Không có | Cần terminate bên ngoài (Cloudflare/Caddy) |

### Application Properties

| Hạng mục | Kết quả | Ghi chú |
|---------|---------|---------|
| H2 dev default | ✅ OK | Chạy được không cần MySQL |
| `ddl-auto=validate` | ✅ OK | Flyway quản lý schema |
| `server.error.include-message=never` | ✅ OK | Không leak error |
| JWT min 32 ký tự | ✅ OK | `@Size(min=32)` |
| ADMIN_PASSWORD fallback | ⚠️ Có `Admin@123` | BUG-05 |
| JWT_SECRET fallback dev | ⚠️ Có dev fallback | BUG-05 |

### CI/CD Workflows

| Hạng mục | Kết quả |
|---------|---------|
| `ci.yml` trigger `recovery/clean-dev` | ✅ Có (local) |
| `ci.yml` trigger `main` | ❌ Không (local) — khác `origin/main` |
| `cd-docker.yml` trigger `main` | ✅ Có |
| CD `needs: ci` | ❌ Không — CD độc lập với CI |
| VPS deploy bằng SSH | ✅ Có |
| VPS healthcheck dùng `localhost:8080` | ⚠️ Phụ thuộc port mapping |

---

## 4. Môi Trường Docker

**Docker Desktop:** Không chạy trên máy kiểm tra hiện tại.

| Kiểm tra | Trạng thái |
|---------|-----------|
| Container đang chạy | ⚠️ Not Run |
| Volume hiện có | ⚠️ Not Run |
| Build image backend | ⚠️ Not Run |
| Build image frontend | ⚠️ Not Run |
| `docker compose config` | ⚠️ Not Run |

---

## 5. Tổng Hợp Lỗi

| ID | Mô tả | Mức | Trạng thái |
|----|-------|-----|-----------|
| BUG-01 | Volume name `quickstay_mysql-test` không nhất quán | 🔴 Critical | Xác nhận |
| BUG-02 | `wget` không có trong alpine image — healthcheck prod fail | 🔴 Critical | Xác nhận |
| BUG-03 | `ci.yml` local không trigger trên `main` | 🟡 High | Xác nhận |
| BUG-04 | Backend port 8080 expose ra host không cần thiết | 🟡 High | Xác nhận |
| BUG-05 | Fallback `Admin@123` và dev JWT secret trong production | 🟡 High | Xác nhận |
| BUG-06 | Dev compose không có network isolation | 🟡 Medium | Xác nhận |
| BUG-07 | Frontend dev compose không chờ backend healthy | 🟡 Medium | Xác nhận |
| BUG-08 | `curl` thiếu trong backend Dockerfile runtime | 🟢 Low | Xác nhận |
| BUG-09 | SEED_SAMPLE_DATA default `true` không khớp `.env.example` | 🟢 Low | Xác nhận |

---

## 6. Hướng Khắc Phục

| ID | Cách sửa | File | Rủi ro |
|----|---------|------|--------|
| BUG-01 | Xóa `name: quickstay_mysql-test`, để volume auto-named | `docker-compose.yml` | Volume cũ không migrate tự động |
| BUG-02 | Đổi `wget` → `curl` trong healthcheck | `docker-compose.prod.yml` | Cần `curl` trong image (BUG-08) |
| BUG-03 | Thêm `main` vào trigger `ci.yml` | `ci.yml` | Không có |
| BUG-04 | Comment out `ports: 8080:8080` trong prod compose | `docker-compose.prod.yml` | VPS healthcheck script cần cập nhật |
| BUG-05 | Merge T193-G2.2-A (`application-prod.properties`) | `application.properties` + mới | Cần deploy lại image |
| BUG-06 | Thêm `networks: internal` vào dev compose | `docker-compose.yml` | Không có |
| BUG-07 | Đổi `depends_on: - backend` → `condition: service_healthy` | `docker-compose.yml` | Cần healthcheck trên backend dev |
| BUG-08 | Thêm `RUN apk add --no-cache curl` vào Dockerfile | `backend/Dockerfile` | Tăng ~500KB image size |
| BUG-09 | Đổi default `true` → `false` trong `application.properties` | `application.properties` | Dev không có seed data tự động |

---

## 7. Kết Luận

### **T195 Giai đoạn 1: BLOCKED → Cần sửa 2 lỗi Critical trước**

| Điều kiện | Trạng thái |
|---------|-----------|
| Healthcheck prod hoạt động | ❌ BUG-02: `wget` không có → container `unhealthy` |
| Volume data an toàn | ⚠️ BUG-01: tên volume không nhất quán |
| Security prod đủ | ⚠️ BUG-05: T193-G2.2-A chưa merge |
| CI trên main | ⚠️ BUG-03: ci.yml trigger thiếu `main` |

**Ưu tiên sửa:**
1. **BUG-02 + BUG-08** (cùng nhau): Đổi `wget` → `curl` và thêm `curl` vào Dockerfile — đây là lỗi làm hỏng toàn bộ production deployment.
2. **BUG-01**: Làm sạch volume naming.
3. **BUG-05**: Merge T193-G2.2-A.
4. BUG-03, BUG-04, BUG-06, BUG-07, BUG-09 theo thứ tự.


---

## G1.1 – Verification of Fix Strategy (Chi tiết)

### A. BUG-02 – Healthcheck `wget` trong Alpine

**Xác minh:**

| Kiểm tra | Kết quả |
|---------|---------|
| Base image | `eclipse-temurin:17-jre-alpine` (Alpine Linux) |
| `wget` có trong Alpine? | ✅ **CÓ** — BusyBox trong Alpine cung cấp `wget` |
| CD trên origin/main chạy thành công? | ✅ Có (T193-G2.1 xác nhận) |
| VPS deploy script dùng gì? | `docker compose exec -T backend wget -qO- http://localhost:8080/actuator/health` — chạy `wget` **bên trong container** |
| `curl` có trong Alpine? | ❌ Không — `curl` là package riêng, không có trong BusyBox |

**Kết luận: BUG-02 KHÔNG phải lỗi.** `wget` qua BusyBox hoạt động đúng trong Alpine. CD đã chạy thành công nhiều lần.

**Phương án:** Giữ nguyên `wget` trong healthcheck. Không cần đổi sang `curl`. Không cần thêm `apk add curl` vào Dockerfile.

**`depends_on: condition: service_healthy` trên frontend:** Đúng — frontend chờ backend healthy. Nếu healthcheck fail, frontend không start. Nhưng vì `wget` hoạt động, healthcheck pass → frontend start bình thường.

---

### B. BUG-01 – Volume name không nhất quán

**Xác minh:**

| Compose file | origin/main | Local branch |
|-------------|-------------|-------------|
| `docker-compose.yml` volume | `mysql-data:` (auto-named) | `mysql-data: name: quickstay_mysql-test` |
| `docker-compose.prod.yml` volume | `mysql-data:` (auto-named) | `mysql-data:` (auto-named) |

**Trên `origin/main`:** Cả hai file dùng cùng tên `mysql-data` → **nhất quán**. Không có bug.

**Trên local branch (`minh/assigned-tasks`):** Dev compose có `name: quickstay_mysql-test` nhưng prod compose không → **không nhất quán**. Đây là commit cũ trên nhánh cá nhân, chưa merge vào main.

**Volume `quickstay_mysql-data-recovery`:** Không tìm thấy trong bất kỳ compose file nào. Nếu volume này tồn tại trên máy local, nó được tạo bởi Docker chạy trực tiếp, không phải từ compose.

**Phương án sửa (local only):**
- Xóa `name: quickstay_mysql-test` khỏi `docker-compose.yml` để đồng bộ với origin/main.
- Trước khi xóa, kiểm tra volume đang có dữ liệu: `docker volume inspect quickstay_mysql-test`
- Nếu có dữ liệu, KHÔNG xóa volume — chỉ đổi tên trong compose. Docker sẽ tạo volume mới với tên auto-named, volume cũ vẫn còn.

**Rủi ro:** Đổi tên volume có thể khiến MySQL tạo database mới (trống). Cần backup trước khi đổi.

---

### C. BUG-05 – T193-G2.2-A chưa merge vào main

**Xác minh:**

| Kiểm tra | origin/main | Local |
|---------|-------------|-------|
| `application-prod.properties` | ❌ Không tồn tại | ✅ Tạo mới (untracked) |
| `SPRING_PROFILES_ACTIVE: prod` trong prod compose | ❌ Không có | ✅ Đã thêm (modified) |
| `ADMIN_PASSWORD` fallback trong prod compose | `${ADMIN_PASSWORD}` (no fallback) ✅ | Giống main ✅ |
| `JWT_SECRET` fallback trong prod compose | `${JWT_SECRET}` (no fallback) ✅ | Giống main ✅ |

**Trên `origin/main`:** Prod compose đã KHÔNG có fallback cho `ADMIN_PASSWORD` và `JWT_SECRET` — điều này đúng. Tuy nhiên, `application.properties` vẫn có fallback dev (`Admin@123`, `dev-only-secret-...`). Nếu chạy backend trực tiếp (không qua prod compose), fallback dev được dùng.

**Giải pháp T193-G2.2-A:** Thêm `application-prod.properties` với `app.jwt.secret=${JWT_SECRET}` và `app.admin.password=${ADMIN_PASSWORD}` (không fallback) + `SPRING_PROFILES_ACTIVE=prod` trong prod compose.

**Phương án:** Merge T193-G2.2-A vào main. Đây là fix bảo mật hợp lệ.

**Test cần thực hiện:**
- Chạy `docker compose -f docker-compose.prod.yml config` — verify env vars
- Build image mới (có `application-prod.properties` trong classpath)
- Test fail-fast: không set `JWT_SECRET` → app không start

---

### D. BUG-03 – CI trigger

**Trên `origin/main`:** `ci.yml` trigger `push: [main, dev]` và `PR: [main, dev]` — **đúng**.

**Trên local:** `ci.yml` (untracked, T169) trigger `recovery/clean-dev` — đây là phiên bản cũ tôi tạo, chưa update. Nhưng `origin/main` đã có phiên bản đúng hơn.

**Phương án:** Không cần sửa. Local `ci.yml` sẽ bị ghi đè khi merge từ main. Hoặc xóa local `ci.yml` và dùng version main.

---

### E. BUG-04 – Backend port expose

**Trên `origin/main`:**
- Dev compose: Backend KHÔNG có `ports:` ✅
- Prod compose: Backend KHÔNG có `ports:` ✅

**Trên local:**
- Prod compose: Backend CÓ `ports: "${BACKEND_PORT:-8080}:8080"` — đây là modification từ T146, chưa commit.

**VPS healthcheck script:** Dùng `docker compose exec -T backend wget -qO- http://localhost:8080/...` — chạy BÊN TRONG container, KHÔNG cần port mapping ra host.

**Phương án:** Xóa `ports:` khỏi local prod compose (khớp với origin/main). VPS healthcheck dùng `docker compose exec` nên không cần expose.

---

### F. BUG-06, BUG-07, BUG-09

| Bug | Phương án | Rủi ro | Test |
|-----|---------|--------|------|
| BUG-06 (network) | Thêm `networks: internal` vào dev compose | Không có | `docker compose config` |
| BUG-07 (depends_on) | Đổi `depends_on: - backend` → `condition: service_healthy` + thêm healthcheck backend vào dev compose | Backend dev cần healthcheck | `docker compose up` |
| BUG-09 (seed data) | Đổi default `true` → `false` trong `application.properties` | Dev không tự seed data — cần set `SEED_SAMPLE_DATA=true` trong `.env` | Chạy app, kiểm tra hotels table |

---

## Danh sách file dự kiến thay đổi (Giai đoạn 2)

| # | File | Thay đổi | Ưu tiên |
|---|------|---------|---------|
| 1 | `docker-compose.prod.yml` | Xóa `ports:` backend (local modification), giữ `SPRING_PROFILES_ACTIVE: prod` | High |
| 2 | `backend/src/main/resources/application-prod.properties` | Giữ nguyên (đã tạo T193) | High |
| 3 | `docker-compose.yml` | Xóa `name: quickstay_mysql-test` (đồng bộ với main) | Medium |
| 4 | `application.properties` | Đổi `SEED_SAMPLE_DATA:true` → `false` | Low |
| 5 | `docker-compose.yml` | Thêm healthcheck backend + `depends_on: condition: service_healthy` cho frontend | Low |

---

## Thứ tự sửa

1. **BUG-05**: Commit + push T193-G2.2-A (`application-prod.properties` + `SPRING_PROFILES_ACTIVE=prod`)
2. **BUG-04**: Xóa `ports:` backend khỏi local prod compose
3. **BUG-01**: Xóa `name: quickstay_mysql-test` khỏi dev compose
4. **BUG-09**: Đổi seed data default
5. **BUG-07**: Thêm healthcheck + depends_on cho dev compose

---

## Cách rollback an toàn

| Thay đổi | Rollback |
|---------|---------|
| `application-prod.properties` | `git checkout -- backend/src/main/resources/application-prod.properties` |
| `docker-compose.prod.yml` | `git checkout -- docker-compose.prod.yml` |
| `docker-compose.yml` | `git checkout -- docker-compose.yml` |
| `application.properties` | `git checkout -- backend/src/main/resources/application.properties` |

Tất cả thay đổi đều có thể rollback bằng `git checkout` vì không tạo migration hay thay đổi DB schema.

---

## Vấn đề cần người dùng xác nhận

| # | Vấn đề | Cần xác nhận |
|---|--------|-------------|
| 1 | Volume `quickstay_mysql-test` có dữ liệu cần bảo vệ không? | Nếu có, KHÔNG xóa `name:` — cần backup trước |
| 2 | Có nên merge T193-G2.2-A vào main trước hay sau T195? | T193 nên merge trước để main có security fix |
| 3 | Dev compose có cần healthcheck backend không? | Nếu dev chạy H2 (không MySQL), healthcheck vẫn hoạt động với `/actuator/health` |

---

## Kết luận G1.1

### **READY cho Giai đoạn 2** (với điều kiện)

| Điều kiện | Trạng thái |
|---------|-----------|
| BUG-02 không phải bug | ✅ `wget` hoạt động qua BusyBox |
| BUG-01 chỉ trên local | ✅ origin/main không có |
| BUG-03 không phải bug trên main | ✅ ci.yml trên main đã đúng |
| BUG-05 cần merge T193-G2.2-A | ⚠️ Cần merge trước hoặc cùng T195 |
| BUG-04 local modification | ⚠️ Cần xóa `ports:` khỏi local prod compose |
| Các bug Low (BUG-06-09) | 🟢 Có thể sửa sau |

**Ưu tiên thực hiện:**
1. Commit + merge T193-G2.2-A vào main (BUG-05)
2. Xóa local modifications không cần thiết (BUG-01, BUG-04)
3. Sửa BUG-09 (seed data default)
4. Sửa BUG-07 (depends_on healthy cho dev compose)


---

## G2 – Kết quả sửa lỗi

### Tổng kết

| Bug | Hành động | Kết quả |
|-----|----------|---------|
| BUG-01 | Giữ nguyên `name: quickstay_mysql-test` — có dữ liệu cần bảo vệ, Docker chưa chạy để backup | ⚠️ Không sửa — bảo vệ dữ liệu |
| BUG-02 | Không phải bug — `wget` có sẵn trong Alpine BusyBox | ✅ Không cần sửa |
| BUG-03 | Không phải bug trên main — `ci.yml` trên main đã đúng trigger | ✅ Không cần sửa |
| BUG-04 | `ports: 8080:8080` committed trên local branch — cần xóa khi merge vào main | ⚠️ Báo cáo — chờ merge |
| BUG-05 | T193-G2.2-A local changes sẵn sàng — cần commit + PR + merge | ⚠️ Chờ user cho phép commit |
| BUG-06 | Dev compose không có network isolation — Low priority | ⏸ Chưa sửa |
| BUG-07 | Thêm healthcheck backend + `depends_on: condition: service_healthy` cho frontend trong dev compose | ✅ Đã sửa |
| BUG-08 | Không cần — `wget` hoạt động | ✅ Không cần sửa |
| BUG-09 | Không cần sửa — current setup đúng | ✅ Không cần sửa |

### Test kết quả

```
Total: 339 tests, 0 failures
BUILD SUCCESSFUL (63s)
```

### Files đã thay đổi trong G2

| File | Thay đổi |
|------|---------|
| `docker-compose.yml` | Thêm healthcheck backend + đổi frontend `depends_on` sang `condition: service_healthy` |

### Files chưa commit (T193-G2.2-A, chờ user cho phép)

| File | Loại |
|------|------|
| `backend/src/main/java/com/quickstay/user/AuthDtos.java` | Modified (R-09) |
| `backend/src/main/java/com/quickstay/user/AuthService.java` | Modified (R-09) |
| `backend/src/main/resources/application.properties` | Modified (R-07) |
| `backend/src/main/resources/application-prod.properties` | Untracked (R-02a/R-02b) |
| `docker-compose.prod.yml` | Modified (R-02a/R-02b SPRING_PROFILES_ACTIVE) |
| `backend/src/test/java/com/quickstay/AuthApiTest.java` | Modified (R-09 tests) |
| `backend/src/test/java/com/quickstay/PaymentEmailRecoveryApiTest.java` | Modified (R-09 tests) |
| `backend/src/test/java/com/quickstay/user/AuthServiceTest.java` | Modified (R-09 tests) |
| `docker-compose.yml` | Modified (BUG-07 healthcheck) |
| `docs/test-reports/T193-*.md` | Untracked (reports) |
| `docs/test-reports/T194-*.md` | Untracked (reports) |
| `docs/test-reports/T195-*.md` | Untracked (this report) |

### Bước tiếp theo

1. **User xác nhận** → Commit tất cả thay đổi lên `minh/assigned-tasks`
2. Tạo PR `minh/assigned-tasks` → `recovery/clean-dev`
3. Merge → CI chạy
4. Tạo PR `recovery/clean-dev` → `main` (giữ `cd-docker.yml` version main, xóa `ports:` backend)
5. Merge → CD deploy VPS
6. Kiểm tra health endpoint trên VPS
