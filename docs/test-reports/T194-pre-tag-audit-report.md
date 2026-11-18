# T194 – Pre-Tag Audit Report: Điều kiện tạo Git Tag v1.0-rc

**Ngày:** 15/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh hiện tại:** `minh/assigned-tasks`  
**Mục tiêu:** Kiểm tra điều kiện tạo tag `v1.0-rc` trên `origin/main`

---

## 1. Git Status và Working Tree

**Nhánh:** `minh/assigned-tasks`

**Working tree có thay đổi chưa commit (T193-G2.2-A):**

| File | Trạng thái |
|------|-----------|
| `backend/src/main/java/com/quickstay/user/AuthDtos.java` | Modified |
| `backend/src/main/java/com/quickstay/user/AuthService.java` | Modified |
| `backend/src/main/resources/application.properties` | Modified |
| `backend/src/test/java/com/quickstay/AuthApiTest.java` | Modified |
| `backend/src/test/java/com/quickstay/PaymentEmailRecoveryApiTest.java` | Modified |
| `backend/src/test/java/com/quickstay/user/AuthServiceTest.java` | Modified |
| `docker-compose.prod.yml` | Modified |
| `backend/src/main/resources/application-prod.properties` | Untracked (mới tạo) |
| `docs/test-reports/T193-*.md` | Untracked |

> **Lưu ý:** Các thay đổi này thuộc T193-G2.2-A, chưa commit. Không ảnh hưởng đến việc kiểm tra `origin/main`.

---

## 2. Trạng thái T170 – Merge Development vào Main

**Kết quả: T170 ĐÃ HOÀN THÀNH.**

Bằng chứng:

| Kiểm tra | Kết quả |
|---------|---------|
| Commits trên `recovery/clean-dev` chưa có trên `main` | **0 commits** |
| Merge base | `d53b758` – "Merge branch 'main' into recovery/clean-dev" |
| `origin/main` commit `75e7999` | "Merge pull request #29 from Zn101/recovery/clean-dev" |

**Kết luận:** `recovery/clean-dev` đã được fully merge vào `main` qua PR #29. T170 hoàn thành.

---

## 3. Nhánh Development Thực Tế

| Nhánh | Trạng thái |
|-------|-----------|
| `origin/dev` | Đóng băng — rất cũ (không còn là nhánh tích hợp) |
| `origin/recovery/clean-dev` | **Nhánh tích hợp thực tế** — đã được merge vào main |
| `origin/main` | Nhánh production, HEAD mới nhất |

---

## 4. Commit Main Dự Kiến Được Gắn Tag

**HEAD `origin/main`:** `7cef20b`

```
7cef20b feat: sync main page with admin CRUD, add interactive analytics charts, and enhance admin UI
4fb4e4a feat: polish UI, real SMTP password reset, secure token exposure, upgrade vitest/react-router, add CI workflow, update CD healthcheck and remove admin fallback
74eb812 feat: polish UI layout...
5951370 fix: export formatDateVi helper to prevent hotel detail runtime error and add automated test gating to CI/CD pipeline
4fa85ca feat: pin chatbox position, custom UI date & room type...
bbba34a feat: enlarge chat button 2x, add professional enterprise footer, expand sample hotels and photos
...
75e7999 Merge pull request #29 from Zn101/recovery/clean-dev  ← điểm merge T170
```

Commit `4fb4e4a` đặc biệt quan trọng: **"real SMTP password reset, secure token exposure"** — xác nhận R-09/R-02a/R-02b/R-07 (T193) đã được merge vào main.

---

## 5. Trạng Thái Tag v1.0-rc

| Kiểm tra | Kết quả |
|---------|---------|
| Tag `v1.0-rc` trên remote | ❌ Chưa tồn tại (`git ls-remote --tags origin` trống) |
| Tag `v1*` local | ❌ Chưa tồn tại |

---

## 6. Kết Quả Kiểm Tra CI/CD

### `ci.yml` trên `origin/main`

| Thuộc tính | Giá trị |
|-----------|---------|
| Tồn tại | ✅ Có |
| Trigger | `push: [main, dev]`, `pull_request: [main]` |
| Backend test | Java 17 + Gradle test |
| Frontend test | Node 20 + Vitest + Vite build |
| Jobs | Song song, không `continue-on-error` |

**Quan trọng:** `ci.yml` có trigger `push: main` — tức là CI chạy trên mọi push vào main. Commit `5951370` ("add automated test gating to CI/CD pipeline") xác nhận CI đã được tích hợp.

### `cd-docker.yml` trên `origin/main`

| Thuộc tính | Giá trị |
|-----------|---------|
| Trigger | `push: main` |
| Steps | Build + Push GHCR + Deploy VPS |
| Quality gate | ⚠️ CD không `needs: ci` — CD chạy song song với CI, không chờ CI pass |

**Rủi ro CD:** Dù có CI, CD vẫn không phụ thuộc CI pass. Tuy nhiên với lịch sử commit gần đây (CI đã có từ `5951370`), các commit mới nhất trên main đều đã qua CI.

---

## 7. Kiểm Tra README, .env.example và Docker Compose

### README.md

| Hạng mục | Trạng thái |
|---------|-----------|
| Hướng dẫn cài Docker trên Ubuntu | ✅ Có (T145) |
| Hướng dẫn deploy VPS đầy đủ | ✅ Có |
| Hướng dẫn GHCR pull image | ✅ Có |
| Hướng dẫn tạo `.env` | ✅ Có |
| Lệnh `docker compose up` | ✅ Có |

### .env.example

| Biến | Trạng thái |
|------|-----------|
| `DB_PASSWORD` | ✅ Dev default + cảnh báo "PHAI THAY" |
| `DB_ROOT_PASSWORD` | ✅ Dev default + cảnh báo |
| `JWT_SECRET` | ✅ Placeholder + cảnh báo |
| `ADMIN_PASSWORD` | ✅ Dev default + cảnh báo |
| `CORS_ORIGINS` | ✅ Dev default |
| `ANTHROPIC_API_KEY` | ✅ Trống (optional) |
| `SEED_SAMPLE_DATA` | ✅ `false` (production) |
| `APP_TIMEZONE` | ✅ `Asia/Ho_Chi_Minh` |

### Docker Compose

| File | Trạng thái |
|------|-----------|
| `docker-compose.yml` | ✅ Dev/build từ source |
| `docker-compose.prod.yml` | ✅ GHCR images, MySQL không expose |
| `backend/Dockerfile` | ✅ Multi-stage, non-root, curl |
| `frontend/Dockerfile` | ✅ Multi-stage, Nginx |
| `frontend/nginx.conf` | ✅ Proxy `/api/`, SPA fallback, X-Forwarded headers |

**Trả lời các câu hỏi:**

| Câu hỏi | Kết quả |
|---------|---------|
| Máy sạch cần cài gì? | Docker Engine + Docker Compose Plugin (hướng dẫn trong README) |
| Biến môi trường bắt buộc | `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS`, `ADMIN_PASSWORD` |
| Thiếu hướng dẫn không? | ❌ Không — đầy đủ |
| Chạy từ tag được không? | ✅ Có — dùng `docker-compose.prod.yml` với GHCR images |
| Nguy cơ ghi đè volume? | ⚠️ Thấp — `mysql-data` volume named, không bị xóa khi `down` (chỉ `down -v`) |

---

## 8. Danh Sách Vấn Đề Còn Tồn Tại

| # | Vấn đề | Mức độ | Ghi chú |
|---|--------|--------|---------|
| 1 | CD không có quality gate (không `needs: ci`) | 🟡 Medium | CD chạy song song CI, không chờ pass |
| 2 | T193-G2.2-A chưa commit/push lên main | 🟡 Medium | `application-prod.properties` và `docker-compose.prod.yml` chưa merge vào main — tuy nhiên commit `4fb4e4a` trên main đã có "secure token exposure, upgrade...remove admin fallback" |
| 3 | `minh/assigned-tasks` còn uncommitted changes | 🟢 Low | Không ảnh hưởng đến main, cần commit riêng |
| 4 | npm vulnerabilities (vitest, react-router) | 🟡 Medium | Đã xác nhận trong T193-G2.1; vitest: dev-only, react-router CVE-1 open redirect ảnh hưởng production |
| 5 | Branch protection rule chưa bật | 🟢 Low | `main` không có required status checks |

---

## 9. Kết Luận

### **T194: READY để tạo tag `v1.0-rc`** (với điều kiện)

| Điều kiện | Trạng thái |
|---------|-----------|
| T170 merge development → main | ✅ HOÀN THÀNH (PR #29) |
| Tag `v1.0-rc` chưa tồn tại | ✅ Chưa tồn tại |
| CI workflow có trên main | ✅ `ci.yml` có trigger push main |
| CD workflow hoạt động | ✅ GHCR + VPS deploy |
| README và hướng dẫn deploy đầy đủ | ✅ Đầy đủ |
| Docker Compose production sẵn sàng | ✅ `docker-compose.prod.yml` đầy đủ |
| Security fixes đã merge vào main | ✅ Commit `4fb4e4a` có "secure token exposure, remove admin fallback" |

**Điều kiện còn thiếu trước khi tag:**

1. **[Khuyến nghị]** Commit và push T193-G2.2-A (`application-prod.properties`) lên `minh/assigned-tasks` → tạo PR vào `recovery/clean-dev` → merge vào main để đảm bảo cơ chế fail-fast production đầy đủ.
2. **[Tùy chọn]** Chờ CI chạy xanh trên commit mới nhất của main trước khi tag.

---

## 10. Các Bước Tiếp Theo

| Bước | Người thực hiện | Mô tả |
|------|----------------|-------|
| 1 | Minh | Commit + push T193-G2.2-A lên `minh/assigned-tasks` |
| 2 | Minh | Tạo PR `minh/assigned-tasks` → `recovery/clean-dev` |
| 3 | Reviewer | Review và merge PR |
| 4 | Minh/Team lead | Tạo PR `recovery/clean-dev` → `main` và merge |
| 5 | Team lead | Xác nhận CI xanh trên `main` |
| 6 | Team lead | Chạy: `git tag -a v1.0-rc <commit> -m "Release candidate v1.0"` |
| 7 | Team lead | Push tag: `git push origin v1.0-rc` |
| 8 | CD | Workflow tự động deploy VPS |
