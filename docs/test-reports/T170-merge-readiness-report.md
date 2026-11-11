# T170 – Merge Readiness Report

**Ngày:** 11/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh hiện tại:** `recovery/clean-dev` @ `196e23b`

---

## 1. Trạng thái các nhánh

| Nhánh | Commit mới nhất | Trạng thái |
|-------|----------------|-----------|
| `origin/main` | `ef1393d` – fix: decode SSH deploy key | Có CD workflow + VPS deploy |
| `origin/dev` | `2e47fe6` – Merge PR #8 from dev-minh | ❌ Đóng băng — rất cũ, từ đầu dự án |
| `origin/recovery/clean-dev` | `196e23b` – Merge PR #27 | ✅ Nhánh tích hợp thực tế |
| `origin/minh/assigned-tasks` | `e722bc1` – Merge recovery/clean-dev | Nhánh cá nhân Minh |

### Bằng chứng `dev` không còn là nhánh tích hợp

- `origin/dev` commit `2e47fe6` — chỉ có đến PR #8 (đầu dự án)
- Toàn bộ T082–T165 nằm trên `recovery/clean-dev`, không trên `dev`
- `dev` không có commit nào từ tuần 2 trở đi

---

## 2. Đề xuất nhánh nguồn và đích

| Vai trò | Nhánh | Lý do |
|---------|-------|-------|
| **Nguồn** | `recovery/clean-dev` | Nhánh tích hợp thực tế, có toàn bộ code T082–T169 |
| **Đích** | `main` | Nhánh production, có CD workflow + VPS deploy |

> ❌ `dev` không phù hợp làm nhánh nguồn — đã đóng băng.

---

## 3. So sánh commit

### Commits trên `recovery/clean-dev` chưa có trên `main`: 23 commits

Bao gồm toàn bộ công việc tuần 2–3:
- T082–T095: Admin Hotel + Room APIs
- T106–T108: Admin Booking APIs + test
- T120–T135: Security, error handling, CORS, deployment, sprint review
- T140–T165: Test edge cases, pagination, JaCoCo
- T145–T147: Docker server setup, Nginx, MySQL backup
- T156–T158: Smoke test, security review, merge readiness

### Commits trên `main` chưa có trên `recovery/clean-dev`: 15 commits

Chủ yếu là CD workflow fixes:
- `ef1393d` – fix: decode SSH deploy key
- `a20511c` – ci: deploy Docker images to VPS after GHCR push
- `f85a1a7` – fix(ci): restore valid cd-docker.yml syntax
- `506ca8a` – fix(deploy): configure GHCR images
- Các merge commit cũ (PR #6, #7, #9, #10, #11, #20)

### Files khác nhau: 83 files

---

## 4. Conflict tiềm ẩn

### Files modified trên CẢ HAI nhánh: 30 files

| File | Rủi ro | Hướng xử lý |
|------|--------|------------|
| `.github/workflows/cd-docker.yml` | 🔴 **Cao** — main có SSH deploy + VPS steps, recovery/clean-dev có `${{ github.repository_owner }}` + cache comments | **Giữ version main** (đầy đủ hơn — có SSH deploy key, VPS deployment) |
| `docker-compose.yml` | 🟡 Trung bình | Merge thủ công |
| `docker-compose.prod.yml` | 🟡 Trung bình | Có thể conflict |
| `README.md` | 🟡 Trung bình | Merge thủ công — giữ cả 2 phần |
| `backend/Dockerfile` | 🟡 Trung bình | recovery/clean-dev có thêm `curl` (T146) |
| `frontend/nginx.conf` | 🟡 Trung bình | recovery/clean-dev có thêm X-Forwarded headers (T146) |
| `application.properties` | 🟡 Trung bình | recovery/clean-dev có thêm `forward-headers-strategy` |
| `SecurityConfig.java` | 🟢 Thấp | Cùng hướng, khác chi tiết nhỏ |
| `BookingService/Controller/Repository` | 🟢 Thấp | recovery/clean-dev có version mới hơn |
| `.env.example`, `.gitignore` | 🟢 Thấp | Recovery/clean-dev đã cập nhật T069 |
| Các file khác | 🟢 Thấp | Mostly recovery/clean-dev newer |

### File mới chỉ có trên recovery/clean-dev

- `backend/.dockerignore` (T134)
- `backend/src/test/java/com/quickstay/CorsTest.java` (T132)
- `backend/src/test/java/com/quickstay/ErrorHandlingTest.java` (T120)
- `backend/src/test/java/com/quickstay/admin/AdminBookingApiTest.java` (T106/T107)
- Nhiều test file khác
- `docs/deployment/T145-docker-server-setup.md`
- Nhiều báo cáo trong `docs/test-reports/`

---

## 5. Kết quả CI/CD

### T169 – CI Pipeline

| Kiểm tra | Kết quả |
|---------|---------|
| `ci.yml` tồn tại | ✅ Có trong working tree |
| `ci.yml` đã commit | ❌ **Chưa commit** (untracked) |
| CI chạy trên GitHub | ⚠️ **Not Run** — chưa push |
| Backend test local | ✅ 260/260 PASSED |
| Frontend test local | ✅ 18/18 PASSED |
| Frontend build local | ✅ Build thành công |

### CD Pipeline

| Kiểm tra | Kết quả |
|---------|---------|
| `cd-docker.yml` trên main | ✅ Có — trigger `push: main`, SSH deploy VPS |
| `cd-docker.yml` trên recovery/clean-dev | ⚠️ Khác version — không có SSH deploy steps |

### Rủi ro CD

> ⚠️ **main có CD workflow deploy lên VPS.** Khi merge recovery/clean-dev vào main, nếu `cd-docker.yml` bị ghi đè bằng version recovery/clean-dev, **VPS deployment sẽ bị mất**. Cần giữ version main của file này.

---

## 6. Working tree status

| Kiểm tra | Kết quả |
|---------|---------|
| File chưa commit | 2 file untracked (`ci.yml`, `T169 report`) |
| Merge đang dang dở | ❌ Không |
| Rebase đang dang dở | ❌ Không |
| Thay đổi chưa staged | Không |

---

## 7. Điều kiện còn thiếu

| # | Điều kiện | Trạng thái | Cách khắc phục |
|---|---------|-----------|---------------|
| C1 | `ci.yml` chưa commit | ❌ Chưa đạt | Commit + push `ci.yml` lên `recovery/clean-dev` |
| C2 | CI chưa chạy trên GitHub | ❌ Chưa đạt | Push để trigger, kiểm tra Actions tab |
| C3 | `cd-docker.yml` conflict risk | ⚠️ Cần xử lý | Giữ version main khi merge |
| Dữ liệu untracked | `ci.yml` + T169 report | ❌ Chưa đạt | Commit trước merge |

---

## 8. Kiểm tra code readiness

| Thành phần | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Backend (Java 17) | ✅ 260/260 test PASS | H2 in-memory, no MySQL needed |
| Frontend (React/Vite) | ✅ 18/18 test PASS + build OK | Vitest CI mode |
| Dockerfile backend | ✅ Multi-stage, non-root, curl added | T134/T146 |
| Dockerfile frontend | ✅ Multi-stage, Nginx proxy | T234 |
| docker-compose.prod.yml | ✅ GHCR images, MySQL not exposed | T134 |
| Nginx reverse proxy | ✅ X-Forwarded headers added | T146 |
| .env.example | ✅ Dev defaults only, có cảnh báo | T069 |
| .gitignore | ✅ Covers .env, *.pem, *.key | T069 |
| JWT/CORS | ✅ Env-based, no wildcard, no hardcoded | T132/T157 |
| Database migration | ✅ Flyway V1__init_schema.sql | |
| README | ✅ VPS deployment guide | T134/T145 |

---

## 9. Kết luận

### T170: **NOT READY**

**Lý do:**

1. **`ci.yml` chưa commit** — CI pipeline (T169) chưa được push lên `recovery/clean-dev`, chưa chạy trên GitHub Actions
2. **`cd-docker.yml` có nguy cơ conflict cao** — main có SSH deploy + VPS deployment, recovery/clean-dev không có. Cần xử lý cẩn thận khi merge.

### Các bước cần thực hiện trước merge

| Bước | Hành động | Người thực hiện |
|------|----------|----------------|
| 1 | Commit `ci.yml` + T169 report lên `minh/assigned-tasks` | Minh |
| 2 | Push và tạo PR vào `recovery/clean-dev` | Minh |
| 3 | Merge PR → CI tự động chạy trên `recovery/clean-dev` | Reviewer |
| 4 | Kiểm tra Actions tab — cả 2 job phải ✅ | Minh |
| 5 | Tạo PR: `recovery/clean-dev` → `main` | Minh |
| 6 | Khi resolve conflict, **giữ `cd-docker.yml` version main** | Minh + reviewer |
| 7 | Merge PR vào `main` → CD tự động deploy VPS | Repo admin |

### Rủi ro chính khi merge

| Rủi ro | Mức độ | Khắc phục |
|--------|--------|----------|
| `cd-docker.yml` bị ghi đè → mất VPS deploy | 🔴 Cao | Giữ version main |
| Code chưa qua CI trên GitHub | 🟡 Trung bình | Chạy CI trước merge |
| 83 file thay đổi — diff lớn | 🟡 Trung bình | Review kỹ trước merge |
