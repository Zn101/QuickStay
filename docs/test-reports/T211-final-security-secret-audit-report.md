# T211 – Final Security & Secret Audit Report

**Mã nhiệm vụ:** T211 – Rà soát lại bảo mật và secret lần cuối  
**Ngày thực hiện:** 18/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Repository:** `D:\OJT_QuickStay_Project\QuickStay` (`https://github.com/Zn101/QuickStay`)  
**Nhánh kiểm tra chính:** `minh/assigned-tasks` (`HEAD = bf86e61`) đối chiếu với `origin/main` (`7cef20b`)  
**Tổng số commit đã quét trên toàn bộ nhánh (`--all`):** 145 commits  

---

## 1. Mục tiêu và phạm vi

### 1.1. Mục tiêu
- Rà soát bảo mật và secret lần cuối trước khi phát hành (`v1.0`), xác nhận repository và cấu hình hệ thống không chứa thông tin bí mật thực tế (API key, JWT secret thật, mật khẩu DB production, SSH private key, GitHub PAT) bị lộ trong working tree hoặc lịch sử Git.
- Đánh giá toàn diện cấu hình bảo mật của **Backend (Spring Security, JWT, BCrypt, CORS, Reset Password, Error Handling)**, **Docker / Docker Compose**, **GitHub Actions CI/CD** và **Production Configuration**.
- Thực thi và ghi nhận bằng chứng cho 12 test case bảo mật chuẩn (`SEC-01` → `SEC-12`).
- Ghi nhận đầy đủ các lỗi/rủi ro phát hiện vào bảng Bug kèm người phụ trách, mức độ và hướng khắc phục.

### 1.2. Phạm vi kiểm tra
| Khu vực | Phạm vi |
|---|---|
| **Working Tree** | Toàn bộ 241 file văn bản trong repository (source code Java/JSX, cấu hình `.properties`, `.yml`, `.conf`, scripts `.ps1`/`.mjs`, tài liệu `docs/`, thư mục `backups/`). |
| **Git History** | Toàn bộ 145 commits trên tất cả các nhánh local và remote (`git log --all -p`), bao gồm `main`, `dev`, `minh/assigned-tasks`, `recovery/clean-dev`, `dev-vuong`, `dev-duc`, `dev-hung`, `dev-minh`. |
| **Docker & Env** | `.gitignore`, `backend/.dockerignore`, `frontend/.dockerignore`, `.env.example`, `docker-compose.yml`, `docker-compose.prod.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`. |
| **GitHub Actions** | `.github/workflows/ci.yml`, `.github/workflows/cd-docker.yml` (so sánh giữa `minh/assigned-tasks` và `origin/main`). |
| **Backend Security** | `SecurityConfig`, `JwtService`, `JwtProperties`, `JwtAuthFilter`, `AuthController`, `AuthService`, `AuthDtos`, `AdminAccountInitializer`, `AdminProperties`, `ApiExceptionHandler`, `EmailService`, `EmailController`, `BookingService`, `UserService`. |

---

## 2. Môi trường kiểm thử

| Thành phần | Thông số |
|---|---|
| **Hệ điều hành** | Windows 11 Pro (x64) |
| **Shell** | PowerShell 5.1 |
| **Java / JDK** | Eclipse Temurin JDK 17 (`C:\Program Files\Java\jdk-17`) |
| **Build Tool Backend** | Gradle Wrapper 8.x (`./gradlew test`) |
| **Python (Secret Scanner)** | Python 3.x (bộ rule tương đương Gitleaks kèm cơ chế tự động che `***REDACTED***`) |
| **Git** | Git 2.x (`git log --all --full-history`, `git ls-files`, `git diff`) |
| **Môi trường VPS thật** | Không truy cập trực tiếp SSH vào `/opt/quickstay/.env` trên VPS trong phiên kiểm thử này (đảm bảo nguyên tắc không đọc/in secret production thật). |

---

## 3. Công cụ sử dụng và phiên bản

1. **Git CLI (`git log --all -p`, `git ls-files`, `git log --all --full-history`):** Quét toàn bộ lịch sử 145 commits và kiểm tra việc theo dõi file nhạy cảm (`.env`, `*.pem`, `*.key`, `*.sql`).
2. **Python Gitleaks-Equivalent Secret Scanner (`secret_scanner.py`):** Quét theo 9 nhóm biểu thức chính quy (Anthropic API Key `sk-ant-*`, OpenAI Key `sk-*`, GitHub PAT `ghp_*/github_pat_*`, AWS Key `AKIA*`, Google API Key `AIza*`, Private Key Header `-----BEGIN * PRIVATE KEY-----`, BCrypt Hash `$2a$*`, biến môi trường `DB_PASSWORD`/`JWT_SECRET`/`ADMIN_PASSWORD`/`ANTHROPIC_API_KEY`/`MAIL_PASSWORD`/`VPS_SSH_KEY`, và Spring properties). Mọi giá trị khớp đều được tự động redact trước khi xuất ra console.
3. **JUnit 5 + Spring Boot Test (`MockMvc` & `TestRestTemplate`):** Bộ kiểm thử tự động 31 test suites (339 tests PASS), bao gồm `JwtServiceTest`, `AuthApiTest`, `AuthServiceTest`, `RealHttpPermissionTest`, `CorsTest`, `ErrorHandlingTest`, `UnexpectedErrorTest`, `PaymentEmailRecoveryApiTest`.

---

## 4. Phạm vi Secret Scanning

| Hạng mục quét | Trạng thái quét | Chi tiết phạm vi |
|---|---|---|
| Source code hiện tại (`backend/`, `frontend/`, `qa/`, `scripts/`) | **ĐÃ QUÉT (100%)** | 241 file văn bản trong working tree |
| Toàn bộ lịch sử Git (`git log --all -p`) | **ĐÃ QUÉT (100%)** | 145 commits trên toàn bộ 11 nhánh local và 13 nhánh remote tracking |
| File `.env`, `.env.example`, `.gitignore`, `.dockerignore` | **ĐÃ QUÉT (100%)** | Kiểm tra cả trên đĩa, Git index và lịch sử commit |
| Thư mục `backups/` và file `.sql` | **ĐÃ QUÉT (100%)** | Kiểm tra 2 file `.sql` local trong `backups/` và 4 file Flyway migration |
| `Dockerfile` và `docker-compose*.yml` | **ĐÃ QUÉT (100%)** | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml` |
| GitHub Actions workflows (`.github/workflows/`) | **ĐÃ QUÉT (100%)** | `ci.yml`, `cd-docker.yml` (cả bản hiện tại và lịch sử `ci-backend.yml`) |
| `README.md` và toàn bộ tài liệu trong `docs/` | **ĐÃ QUÉT (100%)** | Toàn bộ báo cáo `.md`, hướng dẫn triển khai và checklist |
| GitHub Actions Artifacts & `/opt/quickstay/.env` trên VPS | **NOT TESTED** | Không có quyền đọc artifact/secret trực tiếp trên GitHub UI hoặc SSH vào VPS |

---

## 5. Kết quả Scan Source Code (Working Tree)

Tổng số file văn bản đã quét: **241 files**.  
Tổng số dòng khớp quy tắc (raw matches): **51 phát hiện** (0 Confirmed Secret thật trên Git, 47 Placeholder/Example/Biến môi trường, 4 BCrypt hash trong file backup local không bị Git track).

### Bảng phân loại kết quả quét Working Tree

| STT | Vị trí file | Biến / Mẫu phát hiện | Giá trị (đã che / phân loại) | Phân loại | Đánh giá |
|---|---|---|---|---|---|
| 1 | `.env.example:12-22` | `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD` | `quickstay_pw`, `root_pw`, `doi-chuoi-nay-...`, `Admin@123` | **Placeholder/example** | Giá trị mẫu cho môi trường dev, có cảnh báo rõ ở đầu file |
| 2 | `docker-compose.prod.yml:39-52` | `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `MAIL_PASSWORD` | `${DB_PASSWORD}`, `${JWT_SECRET}`, `${ADMIN_PASSWORD}`, `${ANTHROPIC_API_KEY:-}`, `${MAIL_PASSWORD:-}` | **Placeholder/example** | Tham chiếu biến môi trường, không hardcode secret |
| 3 | `docker-compose.yml:28-38` | `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD` | `${DB_PASSWORD:-quickstay_pw}`, `${JWT_SECRET:-change-me-...}`, `${ADMIN_PASSWORD:-Admin@123}` | **Placeholder/example** | Fallback dành riêng cho dev compose (xem thêm `BUG-SEC-03`) |
| 4 | `backend/src/main/resources/application-prod.properties:10,15` | `app.jwt.secret`, `app.admin.password` | `${JWT_SECRET}`, `${ADMIN_PASSWORD}` | **Placeholder/example** | Bắt buộc nạp từ biến môi trường, không có fallback |
| 5 | `backend/src/main/resources/application.properties:7,22,30,50` | `spring.datasource.password`, `app.jwt.secret`, `app.admin.password`, `spring.mail.password` | `${DB_PASSWORD:}`, `${JWT_SECRET:dev-only-secret-...}`, `${ADMIN_PASSWORD:Admin@123}`, `${MAIL_PASSWORD:}` | **Placeholder/example** | Giá trị mặc định cho H2/dev local; bị ghi đè khi bật profile `prod` |
| 6 | `.github/workflows/cd-docker.yml:112-114` | `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` | `${{ secrets.VPS_HOST }}`, `${{ secrets.VPS_USER }}`, `${{ secrets.VPS_SSH_KEY }}` | **Placeholder/example** | Sử dụng GitHub Encrypted Secrets đúng chuẩn |
| 7 | `README.md` & `docs/test-reports/*.md` | Các ví dụ cấu hình `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `VPS_SSH_KEY` | `<mat-khau-mysql-manh>`, `${JWT_SECRET}`, `${{ secrets.VPS_SSH_KEY }}` | **False positive / Placeholder** | Tài liệu hướng dẫn và trích dẫn cấu hình, không chứa secret thật |
| 8 | `backups/quickstay_backup_20261109_230010.sql:141` & `230947.sql:141` | `INSERT INTO users` (2 bản ghi BCrypt hash) | `$2a$***REDACTED***(60 chars)` | **False positive (Untracked Local Dev Dump)** | File nằm trong `backups/` đã được `.gitignore` chặn (`git ls-files backups/` trống). Chứa dữ liệu thử nghiệm T147 trên Docker local (xem `BUG-SEC-04`) |

> **Kết luận mục 5:** Không có bất kỳ API key, private key, password thật hay JWT secret production nào nằm trong mã nguồn được Git theo dõi.

---

## 6. Kết quả Scan Git History (`--all`)

Đã quét toàn bộ **145 commits** trên tất cả các nhánh (`git log --all -p`).
- **Kiểm tra file nhạy cảm từng được commit:**
  ```text
  $ git log --all --full-history --oneline -- ".env" "**/.env" ".env.local" ".env.production" "*.pem" "*.key" "*.p12" "*.jks" "backups/*" "db-backup/*"
  (Không có kết quả - 0 file)
  ```
- **Tổng số dòng khớp quy tắc trong lịch sử Git:** **47 unique findings**.
  - **46/47 phát hiện:** Là các biến tham chiếu `${...}`, `${{ secrets.* }}` hoặc dev default (`quickstay_pw`, `Admin@123`, `dev-only-secret-change-me-dev-only-secret-change-me`, `<mat-khau-mysql-manh>`).
  - **1/47 phát hiện cần xác minh sâu (`commit ee35d609`):**
    - Vị trí: `.github/workflows/ci-backend.yml` dòng 34.
    - Kiểm tra bằng script xác minh (`verify_findings.py`): Giá trị chỉ gồm các từ tiếng Anh nối bằng dấu gạch ngang (`test-secret-test-...`, độ dài 47 ký tự, `words_only=True`), được dùng để chạy JUnit test trong CI ở giai đoạn đầu dự án.
    - Phân loại: **Placeholder/example (False positive)** — không phải secret thật.

> **Kết luận mục 6:** Trong toàn bộ 145 commits lịch sử Git của dự án, **chưa từng có secret thật (0 Confirmed Secrets)** nào bị commit. Không cần viết lại lịch sử Git (`git filter-repo` / `BFG`) hay force-push.

---

## 7. Kết quả kiểm tra `.env` và `.env.example`

1. **Kiểm tra sự tồn tại và trạng thái theo dõi của `.env`:**
   - Lệnh `git ls-files | Select-String "env"` chỉ trả về duy nhất `.env.example`.
   - Trong `.gitignore` (dòng 6–9) đã khai báo đầy đủ:
     ```gitignore
     .env
     .env.local
     .env.*.local
     *.secret
     ```
   - Trong `backend/.dockerignore` (dòng 7–9) đã loại trừ `.env` và `.env.*` khỏi Docker build context.
2. **Kiểm tra nội dung `.env.example`:**
   - Dòng 1–8 có cảnh báo rõ: *"TUYET DOI khong commit file .env len Git. Tat ca gia tri duoi day la MAU DE PHAT TRIEN (development defaults). PHAI THAY THE bang gia tri ngau nhien, du manh truoc khi deploy len production."*
   - Các biến trong `.env.example`:
     - `DB_PASSWORD=quickstay_pw` (Placeholder dev)
     - `DB_ROOT_PASSWORD=root_pw` (Placeholder dev)
     - `JWT_SECRET=doi-chuoi-nay-toi-thieu-32-ky-tu-ngau-nhien` (Placeholder dev)
     - `ADMIN_EMAIL=admin@quickstay.local` / `ADMIN_PASSWORD=Admin@123` (Placeholder dev)
     - `ANTHROPIC_API_KEY=` (Để trống)
     - `MAIL_HOST=`, `MAIL_USERNAME=`, `MAIL_PASSWORD=` (Để trống)
     - `SEED_SAMPLE_DATA=false` (An toàn cho production)

---

## 8. Kết quả kiểm tra Docker & Environment

| File kiểm tra | Kết quả đánh giá | Trạng thái |
|---|---|---|
| `backend/Dockerfile` | Multi-stage build (`eclipse-temurin:17-jdk-alpine` → `eclipse-temurin:17-jre-alpine`). Không dùng `ARG`/`ENV` chứa secret, không copy `.env`, chạy bằng non-root user (`USER appuser`). | **PASS** |
| `frontend/Dockerfile` | Multi-stage build (`node:22-alpine` → `nginx:1.27-alpine`). Chỉ copy `dist` và `nginx.conf`, không nhúng biến môi trường nhạy cảm vào bundle. | **PASS** |
| `docker-compose.prod.yml` (nhánh `minh/assigned-tasks`) | Không có fallback yếu cho `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`. Đã bật `SPRING_PROFILES_ACTIVE: prod`. Không expose cổng MySQL `3306` và không expose cổng Backend `8080` ra host; toàn bộ giao tiếp nội bộ đi qua mạng `internal`. | **PASS** |
| `docker-compose.prod.yml` (nhánh `origin/main`) | Đã bỏ fallback cho `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, nhưng **chưa có `SPRING_PROFILES_ACTIVE: prod`** và trên `origin/main` chưa có file `application-prod.properties` (xem `BUG-SEC-01`). | **FAIL (Cần merge)** |
| `docker-compose.yml` (Dev compose) | Có fallback mặc định cho dev (`quickstay_pw`, `change-me-...`, `Admin@123`) và mở cổng `${BACKEND_PORT:-8080}:8080` ra host (xem `BUG-SEC-03`). | **Cảnh báo (Low/Medium)** |

---

## 9. Kết quả kiểm tra GitHub Actions

1. **Quản lý Secret & Quyền (`permissions`):**
   - `ci.yml`: `permissions: contents: read` (quyền tối thiểu). Không sử dụng hay in bất kỳ secret nào.
   - `cd-docker.yml`: `permissions: contents: read, packages: write`. Đăng nhập GHCR bằng `${{ secrets.GITHUB_TOKEN }}`. Bước deploy SSH sử dụng `${{ secrets.VPS_HOST }}`, `${{ secrets.VPS_USER }}`, `${{ secrets.VPS_SSH_KEY }}`.
   - Không có lệnh `echo` hay `env` nào in giá trị secret ra build log; không upload artifact chứa secret.
   - Có kiểm tra fingerprint host key (`grep -F "SHA256:fC0vLYUEKoEyoQsLPjKfSwCm1N9fN5g08MRUyKgAgQM"`) chống tấn công MITM khi SSH.
2. **Phát hiện lệch cấu hình Workflow giữa `minh/assigned-tasks` và `origin/main` (`BUG-SEC-01`):**
   - Trên `origin/main` (`7cef20b`): `ci.yml` đã trigger trên `[main, dev]`, và `cd-docker.yml` đã có 2 job kiểm thử chặn trước (`needs: [backend-test, frontend-test]`) đồng thời dùng `docker compose exec -T backend wget -qO- http://localhost:8080/actuator/health` (tương thích với việc đóng cổng 8080 ra host).
   - Trên `minh/assigned-tasks` (`bf86e61`): `ci.yml` vẫn chỉ trigger trên `recovery/clean-dev`, và `cd-docker.yml` chưa đồng bộ lại bản có `needs: [backend-test, frontend-test]` và vẫn gọi `curl -fsS http://localhost:8080/actuator/health` từ host (sẽ lỗi sau khi `T204` đóng port 8080 trên host). Nếu merge nguyên trạng `minh/assigned-tasks` vào `main` mà không giữ lại phần workflow của `origin/main`, sẽ làm hồi quy (regress) CI/CD trên `main`.

---

## 10. Kết quả kiểm tra Backend Security

| Hạng mục | Thực tế trong mã nguồn | Đánh giá |
|---|---|---|
| **Password Hashing** | `SecurityConfig.passwordEncoder()` dùng `BCryptPasswordEncoder` (mặc định strength 10). Kiểm chứng qua `TC_AUTH_02`: hash bắt đầu bằng `$2a$`, mật khẩu gốc giới hạn tối đa 72 bytes UTF-8 (`@MaxUtf8Bytes(72)`) tránh lỗi cắt ngắn của BCrypt. | **PASS** |
| **JWT Production** | `JwtService` dùng HMAC-SHA (`Keys.hmacShaKeyFor`), thời hạn 24h (`app.jwt.expiration=24h`). `JwtProperties` kiểm tra `@NotBlank @Size(min = 32)`. Khi chạy với `SPRING_PROFILES_ACTIVE=prod` (`application-prod.properties`), `app.jwt.secret=${JWT_SECRET}` không có fallback → thiếu hoặc < 32 ký tự sẽ fail-fast ngay khi khởi động. | **PASS (trên `minh/assigned-tasks`)** |
| **Authentication & Roles** | Hệ thống sử dụng 2 role thực tế theo thiết kế QuickStay: `CUSTOMER` và `ADMIN` (`com.quickstay.user.Role`). Session hoàn toàn `STATELESS`. `JwtAuthFilter` xác thực chữ ký và hạn token trên mỗi request. | **PASS** |
| **Authorization (Phân quyền API)** | `/api/admin/**` yêu cầu `hasRole("ADMIN")`; `POST /api/bookings` yêu cầu `hasRole("CUSTOMER")`; `/api/users/me/**`, `/api/bookings/**`, `/api/emails/me`, `/api/concierge/me` yêu cầu đăng nhập và lấy danh tính trực tiếp từ `Authentication.getName()` (chống IDOR). Trong `BookingService.pay()` và `cancel()`, kiểm tra `!b.getUser().getEmail().equals(email)` → ném `403 Forbidden`. | **PASS** |
| **Reset Password & Token Exposure** | Trên `minh/assigned-tasks`: `ForgotPasswordResponse` chỉ có duy nhất 1 trường `String message`; `EmailPreview` và `demoMode` đã bị xóa hoàn toàn. Token khôi phục dùng `UUID.randomUUID()`, hết hạn sau 15 phút, và bị xóa (`setResetToken(null)`) ngay sau lần sử dụng đầu tiên. Tuy nhiên, `EmailService` vẫn lưu nội dung HTML của email `PASSWORD_RESET` (chứa token) vào bảng `email_logs`, khiến tài khoản `ADMIN` có thể đọc qua `GET /api/admin/emails` (xem `BUG-SEC-02`). | **PASS (API công khai) / Cảnh báo nội bộ (`BUG-SEC-02`)** |
| **Error Handling & Stack Trace** | `ApiExceptionHandler` bắt toàn bộ exception (`ApiException`, validation, `DataIntegrityViolationException`, `PessimisticLockingFailureException`, và `Exception.class` chung) trả về JSON chuẩn `{"message": "..."}`. Với lỗi 500 bất ngờ, chỉ trả `"Loi he thong, vui long thu lai"`, không bao giờ lộ câu lệnh SQL, tên class exception hay stack trace. `application.properties` đã đặt `server.error.include-message=never`. | **PASS** |
| **CORS** | `SecurityConfig.corsConfigurationSource` chỉ cho phép danh sách origin cấu hình trong `app.cors.allowed-origins` (không dùng wildcard `*`), chỉ mở các method `GET, POST, PUT, PATCH, DELETE, OPTIONS` và header `Authorization, Content-Type`. | **PASS** |
| **Logging thông tin nhạy cảm** | Đã rà soát toàn bộ lời gọi `log.info`/`log.warn`/`log.error` trong `AuthService`, `UserService`, `EmailService`, `BookingService`, `AdminAccountInitializer`: chỉ log `user.getId()`, `email`, `booking.getId()`, tuyệt đối không log mật khẩu, JWT hay reset token. | **PASS** |

---

## 11. Bảng kết quả thực hiện Test Case (SEC-01 đến SEC-12)

### 11.1. Bảng tổng hợp nhanh

| Test ID | Tên Test Case | Trạng thái | Bằng chứng chính | Bug liên quan |
|---|---|---|---|---|
| **SEC-01** | Scan source code for secrets | **PASS** | Quét 241 file văn bản: 0 secret thật trong các file được Git track | `BUG-SEC-04` (Low - file backup untracked) |
| **SEC-02** | Scan Git history for leaked secrets | **PASS** | Quét 145 commits (`git log --all -p`): 0 secret thật từng được commit | Không có |
| **SEC-03** | Verify `.env` is not tracked | **PASS** | `git ls-files "*env*"` chỉ có `.env.example`; lịch sử `.env` = 0 commit | Không có |
| **SEC-04** | Verify `.env.example` contains safe placeholders only | **PASS** | `.env.example` (52 dòng) chỉ chứa dev defaults & chuỗi rỗng | Không có |
| **SEC-05** | Verify Docker Compose has no hardcoded credentials | **PASS** | `docker-compose.prod.yml` dùng `${DB_PASSWORD}`, `${JWT_SECRET}`, `${ADMIN_PASSWORD}` | `BUG-SEC-03` (Low - fallback trong dev compose) |
| **SEC-06** | Verify Dockerfiles do not embed secrets | **PASS** | `backend/Dockerfile` & `frontend/Dockerfile` + `.dockerignore` sạch | Không có |
| **SEC-07** | Verify GitHub Actions does not expose secrets | **PASS** | `ci.yml` & `cd-docker.yml` dùng `${{ secrets.* }}`, không echo secret | `BUG-SEC-01` (High - lệch workflow giữa 2 nhánh) |
| **SEC-08** | Verify production JWT configuration | **FAIL** | Nhánh `minh/assigned-tasks` đạt (`JwtServiceTest` 4/4 PASS + `application-prod.properties`), nhưng **chưa merge lên `origin/main`** | `BUG-SEC-01` |
| **SEC-09** | Verify authentication and authorization | **PASS** | `RealHttpPermissionTest` (7/7 PASS), `AuthApiTest` (10/10 PASS), `Admin*ApiTest` (111/111 PASS) | Không có |
| **SEC-10** | Verify production error handling | **FAIL** | Nhánh `minh/assigned-tasks` đạt (`ErrorHandlingTest` 23/23 PASS, `UnexpectedErrorTest` 1/1 PASS, `include-message=never`), nhưng `origin/main` vẫn còn `include-message=always` | `BUG-SEC-01` |
| **SEC-11** | Verify CORS configuration | **PASS** | `CorsTest` (14/14 PASS): chặn `evil.com`, không dùng wildcard `*` | Không có |
| **SEC-12** | Verify password reset does not expose sensitive tokens | **FAIL** | API `/api/auth/forgot-password` đã an toàn (`AuthServiceTest` 13/13 PASS, `AuthApiTest` 4/4 PASS), nhưng `EmailService` vẫn lưu HTML chứa reset token vào `email_logs` hiển thị trên `GET /api/admin/emails` | `BUG-SEC-02`, `BUG-SEC-01` |

> **Tổng kết số lượng Test Case:** **9 PASS**, **3 FAIL**, **0 NOT TESTED** (trên tổng số 12 test cases).

---

### 11.2. Chi tiết từng Test Case (SEC-01 → SEC-12)

#### SEC-01: Scan source code for secrets
- **Mục tiêu:** Xác nhận toàn bộ mã nguồn hiện tại không chứa API key, private key, password thật hoặc JWT secret thật.
- **Tiền điều kiện:** Repository tại `D:\OJT_QuickStay_Project\QuickStay`.
- **Các bước thực hiện:**
  1. Chạy script quét `secret_scanner.py` trên toàn bộ working tree (loại trừ `.git`, `node_modules`, `build`, `dist`).
  2. Phân loại toàn bộ kết quả khớp theo 4 nhóm: Confirmed secret, False positive, Placeholder/example, Unverified.
- **Kết quả mong đợi:** 0 Confirmed secret trong toàn bộ file được Git theo dõi.
- **Kết quả thực tế:** Đã quét 241 file văn bản, ghi nhận 51 dòng khớp: 47 dòng là biến môi trường `${...}` hoặc placeholder dev (`.env.example`, `application.properties`, `README.md`, `docs/`), 4 dòng là BCrypt hash của dữ liệu test local trong `backups/*.sql` (file untracked, đã bị `.gitignore` chặn). Không có secret thật.
- **Trạng thái:** **PASS** (ghi nhận thêm `BUG-SEC-04` mức Low để dọn file backup local).
- **Bằng chứng log:** Xem Mục 5 và Mục 14.1.

#### SEC-02: Scan Git history for leaked secrets
- **Mục tiêu:** Xác nhận không có secret thật nào từng bị commit rồi xóa trong quá khứ trên mọi nhánh.
- **Tiền điều kiện:** Đã fetch các nhánh remote (`origin/main`, `origin/dev`, `origin/dev-*`, `origin/recovery/*`).
- **Các bước thực hiện:**
  1. Chạy `git rev-list --all` xác định tổng số commit (145 commits).
  2. Chạy `git log --all -p --unified=0` qua bộ lọc regex của `secret_scanner.py`.
  3. Kiểm tra riêng commit `ee35d609` tại `.github/workflows/ci-backend.yml`.
- **Kết quả mong đợi:** Không có secret thật nào trong 145 commits.
- **Kết quả thực tế:** 47 unique matches trong lịch sử đều là biến tham chiếu `${...}` hoặc chuỗi placeholder (`test-secret-test-...` ở `ee35d609`). 0 Confirmed secret.
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem Mục 6 và Mục 14.1.

#### SEC-03: Verify `.env` is not tracked
- **Mục tiêu:** Đảm bảo file `.env`, private key và file backup `.sql` không bị Git theo dõi ở hiện tại và trong lịch sử.
- **Tiền điều kiện:** Working tree và lịch sử Git sẵn sàng.
- **Các bước thực hiện:**
  1. Kiểm tra `.gitignore` dòng 6–20 và 75–79.
  2. Chạy `git ls-files | Select-String "(^|/)\.env($|\.)|\.(pem|key|p12|jks|pfx|secret|sql|bak)$"`.
  3. Chạy `git log --all --full-history --oneline -- ".env" "**/.env" ".env.local" "*.pem" "*.key" "backups/*"`.
- **Kết quả mong đợi:** Chỉ `.env.example` và các file migration `V1..V4__*.sql` được phép nằm trong Git; lịch sử commit của `.env` trống.
- **Kết quả thực tế:** `git ls-files` chỉ trả về `.env.example` và `V1`–`V4` trong `db/migration/`. Lịch sử commit của `.env` và `backups/*` trả về 0 kết quả.
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem Mục 14.2.

#### SEC-04: Verify `.env.example` contains safe placeholders only
- **Mục tiêu:** Xác nhận `.env.example` chỉ chứa giá trị mẫu an toàn và có hướng dẫn thay thế khi lên production.
- **Tiền điều kiện:** Đọc file `.env.example` (52 dòng).
- **Các bước thực hiện:**
  1. Kiểm tra từng biến trong `.env.example`.
  2. Đối chiếu với các biến trong `docker-compose.yml` và `docker-compose.prod.yml`.
- **Kết quả mong đợi:** Tất cả các biến nhạy cảm (`DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `MAIL_PASSWORD`) chỉ mang giá trị mẫu hoặc rỗng.
- **Kết quả thực tế:** `DB_PASSWORD=quickstay_pw`, `DB_ROOT_PASSWORD=root_pw`, `JWT_SECRET=doi-chuoi-nay-toi-thieu-32-ky-tu-ngau-nhien`, `ADMIN_PASSWORD=Admin@123`, `ANTHROPIC_API_KEY=`, `MAIL_PASSWORD=`, `SEED_SAMPLE_DATA=false`.
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem file `.env.example:1-52`.

#### SEC-05: Verify Docker Compose has no hardcoded credentials
- **Mục tiêu:** Đảm bảo file Compose production không chứa mật khẩu thật hoặc fallback yếu.
- **Tiền điều kiện:** Đọc `docker-compose.prod.yml` và `docker-compose.yml`.
- **Các bước thực hiện:**
  1. Kiểm tra các biến môi trường trong `docker-compose.prod.yml`.
  2. Kiểm tra cấu hình port và network trong `docker-compose.prod.yml`.
- **Kết quả mong đợi:** `docker-compose.prod.yml` truyền `${DB_PASSWORD}`, `${DB_ROOT_PASSWORD}`, `${JWT_SECRET}`, `${ADMIN_PASSWORD}` không kèm fallback yếu; bật `SPRING_PROFILES_ACTIVE: prod`; không mở cổng 3306 và 8080 ra host.
- **Kết quả thực tế:** `docker-compose.prod.yml` đạt toàn bộ tiêu chí trên nhánh `minh/assigned-tasks`. (Ghi chú: `docker-compose.yml` dùng cho dev vẫn giữ fallback dev — ghi nhận tại `BUG-SEC-03`).
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem `docker-compose.prod.yml:14-64`.

#### SEC-06: Verify Dockerfiles do not embed secrets
- **Mục tiêu:** Xác nhận `backend/Dockerfile` và `frontend/Dockerfile` không đóng gói `.env` hay secret vào Docker image.
- **Tiền điều kiện:** Đọc `backend/Dockerfile`, `frontend/Dockerfile`, `backend/.dockerignore`, `frontend/.dockerignore`.
- **Các bước thực hiện:**
  1. Kiểm tra các chỉ thị `COPY`, `ADD`, `ENV`, `ARG` trong 2 Dockerfile.
  2. Kiểm tra `.dockerignore` và quyền user chạy container.
- **Kết quả mong đợi:** Không copy `.env`, không có `ENV`/`ARG` chứa secret, backend chạy bằng non-root user (`appuser`).
- **Kết quả thực tế:** `backend/Dockerfile` chỉ copy `gradlew`, `gradle`, `build.gradle`, `settings.gradle`, `src/`, build `app.jar` và chạy bằng `USER appuser`. `backend/.dockerignore` chặn `.env` và `.env.*`. `frontend/Dockerfile` chỉ copy source build tĩnh sang Nginx.
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem `backend/Dockerfile:1-44` và `backend/.dockerignore:1-24`.

#### SEC-07: Verify GitHub Actions does not expose secrets
- **Mục tiêu:** Đảm bảo workflow CI/CD không hardcode secret, không in secret ra log và giới hạn quyền `GITHUB_TOKEN`.
- **Tiền điều kiện:** Đọc `.github/workflows/ci.yml` và `.github/workflows/cd-docker.yml`.
- **Các bước thực hiện:**
  1. Kiểm tra khối `permissions:` trong `ci.yml` và `cd-docker.yml`.
  2. Kiểm tra cách truyền `GITHUB_TOKEN`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
- **Kết quả mong đợi:** Không có secret hardcode, không in biến môi trường nhạy cảm ra log.
- **Kết quả thực tế:** Cả hai workflow hoàn toàn không làm lộ secret. Tuy nhiên, phát hiện sự lệch phiên bản giữa `minh/assigned-tasks` và `origin/main` (trên `minh/assigned-tasks` thiếu job test gate trong `cd-docker.yml` và `ci.yml` chỉ chạy trên `recovery/clean-dev`), đã ghi nhận vào `BUG-SEC-01`.
- **Trạng thái:** **PASS** (về mặt không lộ secret; lỗi đồng bộ nhánh ghi ở `BUG-SEC-01`).
- **Bằng chứng log:** Xem `.github/workflows/ci.yml:19-20` và `.github/workflows/cd-docker.yml:18-20, 110-131`.

#### SEC-08: Verify production JWT configuration
- **Mục tiêu:** Đảm bảo JWT secret trên production bắt buộc từ 32 ký tự trở lên, không dùng fallback của dev và từ chối token giả mạo/hết hạn.
- **Tiền điều kiện:** Kiểm tra `JwtProperties.java`, `JwtService.java`, `application-prod.properties`, `JwtServiceTest.java` và đối chiếu với `origin/main`.
- **Các bước thực hiện:**
  1. Kiểm tra validation `@NotBlank @Size(min = 32)` trong `JwtProperties.java`.
  2. Chạy `JwtServiceTest` (4 unit tests).
  3. Kiểm tra `application-prod.properties` và `docker-compose.prod.yml` trên cả `minh/assigned-tasks` và `origin/main`.
- **Kết quả mong đợi:** `JwtServiceTest` PASS 4/4; cấu hình production fail-fast nếu thiếu `JWT_SECRET` trên cả nhánh phát triển và nhánh `main`.
- **Kết quả thực tế:**
  - Trên `minh/assigned-tasks`: `JwtServiceTest` PASS 4/4 (`token_carries_email_role_and_expiry`, `tampered_token_is_rejected`, `expired_token_is_rejected`, `token_signed_with_another_secret_is_rejected`); `application-prod.properties` đã bỏ fallback (`app.jwt.secret=${JWT_SECRET}`).
  - **Điểm chưa đạt:** File `application-prod.properties` và biến `SPRING_PROFILES_ACTIVE: prod` mới nằm trên `minh/assigned-tasks` (`50ab5f5`), **chưa được merge vào `origin/main` (`7cef20b`)**. Trên `origin/main`, `application.properties` vẫn còn fallback `dev-only-secret-change-me-dev-only-secret-change-me`.
- **Trạng thái:** **FAIL** (do bản vá `T193-G2.2-A` chưa được merge vào `origin/main`).
- **Bằng chứng log:** Xem Mục 14.3 và `git diff origin/main..HEAD -- backend/src/main/resources/`.
- **Bug ID:** `BUG-SEC-01`.

#### SEC-09: Verify authentication and authorization
- **Mục tiêu:** Xác nhận mật khẩu được băm bằng BCrypt, không tiết lộ email tồn tại khi đăng nhập sai, phân quyền chặt chẽ giữa ẩn danh (`401`), `CUSTOMER` (`403` khi gọi `/api/admin/**`) và `ADMIN` (`403` khi gọi `POST /api/bookings`), chống bypass URL path.
- **Tiền điều kiện:** Chạy bộ test `AuthApiTest`, `RealHttpPermissionTest`, `AdminHotelApiTest`, `AdminRoomApiTest`, `AdminBookingApiTest`.
- **Các bước thực hiện:**
  1. Kiểm tra kết quả chạy thực tế của `AuthApiTest` (10 tests) và `RealHttpPermissionTest` (7 tests qua cổng HTTP thật).
  2. Kiểm tra việc chặn các biến thể đường dẫn (`/api/admin/hotels/`, `/api//admin/hotels`, `/API/admin/hotels`, `/api/admin/%68otels`).
- **Kết quả mong đợi:** Toàn bộ test xác thực và phân quyền đạt 100%, trả đúng mã `401`/`403` kèm JSON `{"message": "..."}`.
- **Kết quả thực tế:** `AuthApiTest` (10/10 PASS), `RealHttpPermissionTest` (7/7 PASS), `AdminBookingApiTest` (29/29 PASS), `AdminHotelApiTest` (35/35 PASS), `AdminRoomApiTest` (47/47 PASS).
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem Mục 14.3.

#### SEC-10: Verify production error handling
- **Mục tiêu:** Đảm bảo khi xảy ra lỗi validation (`400`), không tìm thấy (`404`), xung đột (`409`) hoặc lỗi hệ thống bất ngờ (`500`), API chỉ trả về `{"message": "..."}` an toàn, không lộ stack trace, câu lệnh SQL hay message nội bộ của exception.
- **Tiền điều kiện:** Kiểm tra `ApiExceptionHandler.java`, `application.properties`, `ErrorHandlingTest` và `UnexpectedErrorTest`.
- **Các bước thực hiện:**
  1. Kiểm tra kết quả chạy `ErrorHandlingTest` (23 tests) và `UnexpectedErrorTest` (1 test giả lập `IllegalStateException("SELECT * FROM users WHERE password_hash = 'bi-mat'")`).
  2. Kiểm tra cấu hình `server.error.include-message` trên `minh/assigned-tasks` và `origin/main`.
- **Kết quả mong đợi:** `ErrorHandlingTest` (23/23 PASS), `UnexpectedErrorTest` (1/1 PASS), và `server.error.include-message=never` có mặt trên nhánh chính `origin/main`.
- **Kết quả thực tế:**
  - Trên `minh/assigned-tasks`: 24/24 tests PASS, `server.error.include-message=never` đã được cập nhật.
  - **Điểm chưa đạt:** Trên `origin/main` (`7cef20b`), dòng 35 của `application.properties` vẫn đang là `server.error.include-message=always` vì nhánh `minh/assigned-tasks` chưa được merge vào `main`.
- **Trạng thái:** **FAIL** (cần merge bản sửa từ `minh/assigned-tasks` vào `origin/main`).
- **Bằng chứng log:** Xem Mục 14.3 và `git diff origin/main..HEAD -- backend/src/main/resources/application.properties`.
- **Bug ID:** `BUG-SEC-01`.

#### SEC-11: Verify CORS configuration
- **Mục tiêu:** Xác nhận Backend chỉ cấp header `Access-Control-Allow-Origin` cho các origin nằm trong danh sách cho phép (`app.cors.allowed-origins`), từ chối các origin lạ (`evil.com`, `attacker.example.com`, `localhost:5173.evil.com`) và không bao giờ trả về wildcard `*`.
- **Tiền điều kiện:** Kiểm tra `SecurityConfig.corsConfigurationSource` và chạy `CorsTest`.
- **Các bước thực hiện:**
  1. Thực thi 14 test cases trong `CorsTest` (`CORS_01a` → `CORS_07`).
- **Kết quả mong đợi:** 14/14 test cases trong `CorsTest` PASS.
- **Kết quả thực tế:** 14/14 PASS (`0.212s`).
- **Trạng thái:** **PASS**
- **Bằng chứng log:** Xem Mục 14.3.

#### SEC-12: Verify password reset does not expose sensitive tokens
- **Mục tiêu:** Xác nhận luồng quên mật khẩu (`/api/auth/forgot-password` và `/api/auth/reset-password`) không làm lộ reset token qua API response hoặc qua các endpoint khác, không tiết lộ email có tồn tại hay không, và token chỉ dùng được 1 lần trong 15 phút.
- **Tiền điều kiện:** Kiểm tra `AuthDtos.java`, `AuthService.java`, `EmailService.java`, `EmailController.java`, chạy `AuthServiceTest`, `AuthApiTest`, `PaymentEmailRecoveryApiTest`.
- **Các bước thực hiện:**
  1. Kiểm tra kết quả chạy `AuthServiceTest` (9 unit tests cho forgot/reset password), `AuthApiTest` (`TC_AUTH_FORGOT_01..04`), `PaymentEmailRecoveryApiTest`.
  2. Rà soát luồng lưu trữ email khôi phục mật khẩu trong `EmailService` và các API đọc `email_logs` trong `EmailController`.
- **Kết quả mong đợi:** Không có API nào trả về reset token của người dùng; token hết hạn sau 15 phút và bị xóa sau khi sử dụng.
- **Kết quả thực tế:**
  - Endpoint công khai `POST /api/auth/forgot-password` trên `minh/assigned-tasks` đã an toàn tuyệt đối: chỉ trả về 1 trường `{"message": "Neu email ton tai trong he thong, chung toi da gui huong dan dat lai mat khau."}` (13/13 unit tests trong `AuthServiceTest` và 4/4 integration tests trong `AuthApiTest` đều PASS).
  - **Điểm chưa đạt (Phát hiện mới trong T211):**
    1. Trong `EmailService.sendPasswordResetEmail()` (dòng 102–114), toàn bộ nội dung HTML chứa đường dẫn `/reset-password?token=<UUID>` và mã khôi phục dạng rõ (plaintext) được lưu vào cột `body_html` của bảng `email_logs` (cả khi gửi qua SMTP thật lẫn chế độ demo).
    2. Trong `EmailController.adminEmails()` (`GET /api/admin/emails`, dòng 37–41), bất kỳ tài khoản nào có quyền `ADMIN` đều xem được 50 bản ghi `email_logs` mới nhất của toàn hệ thống kèm đầy đủ `bodyHtml`, từ đó nhìn thấy trực tiếp `resetToken` đang còn hiệu lực của bất kỳ người dùng hoặc Admin khác.
    3. Кроме đó, trên `origin/main`, `ForgotPasswordResponse` vẫn còn trường `demoMode` (chưa merge bản xóa `demoMode` từ `minh/assigned-tasks`).
- **Trạng thái:** **FAIL**
- **Bằng chứng log:** Xem `EmailService.java:102-114`, `EmailController.java:37-41` và Mục 12 (`BUG-SEC-02`).
- **Bug ID:** `BUG-SEC-02`, `BUG-SEC-01`.

---

## 12. Danh sách Bug phát hiện & Bảng chuyển giao cột Bug (Giai đoạn 5 & 6)

### 12.1. Tổng hợp các Bug phát hiện trong T211

| Bug ID | Tiêu đề | Mức độ | Người phụ trách | Thành phần | Trạng thái |
|---|---|---|---|---|---|
| **BUG-SEC-01** | Các bản vá bảo mật `T193-G2.2-A` / `T204` trên `minh/assigned-tasks` chưa merge vào `origin/main` và workflow CI/CD giữa 2 nhánh đang lệch nhau | **High** | Lê Duy Minh & Nguyễn Thạc Hưng | `.github/workflows/`, `application-prod.properties`, `application.properties`, `docker-compose.prod.yml`, `AuthDtos.java` | **OPEN** |
| **BUG-SEC-02** | `EmailService` lưu nội dung HTML chứa plaintext reset token vào `email_logs` và hiển thị qua `GET /api/admin/emails` | **Medium** | Phùng Văn Vượng | `EmailService.java`, `EmailController.java` | **OPEN** |
| **BUG-SEC-03** | `docker-compose.yml` (dev) chứa fallback mật khẩu mặc định, mở port 8080 ra `0.0.0.0` và thiếu `SEED_SAMPLE_DATA` | **Low** | Lê Duy Minh | `docker-compose.yml` | **OPEN** |
| **BUG-SEC-04** | Tồn tại 2 file SQL dump local trong thư mục `backups/` chứa BCrypt hash và SĐT người dùng thử nghiệm | **Low** | Lê Duy Minh | `backups/*.sql` (Local workspace) | **OPEN** |

---

### 12.2. Chi tiết từng Bug (chuyển vào cột Bug trên bảng quản lý công việc)

#### 1. `BUG-SEC-01` – Lệch trạng thái bảo mật và CI/CD giữa `minh/assigned-tasks` và `origin/main`
- **Mức độ:** **High**
- **Người phụ trách:** Lê Duy Minh (DevOps) & Nguyễn Thạc Hưng (Team Lead / Merge PR)
- **Thành phần bị ảnh hưởng:**
  - `backend/src/main/resources/application-prod.properties`
  - `backend/src/main/resources/application.properties`
  - `backend/src/main/java/com/quickstay/user/AuthDtos.java`
  - `docker-compose.prod.yml`
  - `.github/workflows/ci.yml`
  - `.github/workflows/cd-docker.yml`
- **Cách tái hiện:**
  1. Chạy `git diff origin/main..HEAD -- .github/workflows/ docker-compose.prod.yml backend/src/main/resources/ backend/src/main/java/com/quickstay/user/`.
  2. Kiểm tra nhánh `origin/main` (`7cef20b`) và nhánh `minh/assigned-tasks` (`bf86e61`).
- **Kết quả thực tế:**
  - Trên `origin/main`: Chưa có `application-prod.properties`, `docker-compose.prod.yml` chưa có `SPRING_PROFILES_ACTIVE: prod`, `application.properties` vẫn để `server.error.include-message=always`, và `ForgotPasswordResponse` vẫn còn trường `boolean demoMode`.
  - Ngược lại, trên `minh/assigned-tasks`: `.github/workflows/ci.yml` vẫn chỉ trigger trên `recovery/clean-dev` (mất trigger `main`, `dev` đã có trên `origin/main`), và `.github/workflows/cd-docker.yml` thiếu 2 job `backend-test`, `frontend-test` đồng thời dùng `curl -fsS http://localhost:8080/actuator/health` trên host (không tương thích với việc đã xóa `ports: 8080:8080` khỏi `docker-compose.prod.yml`).
- **Kết quả mong đợi:** Nhánh `main` phải có đầy đủ `application-prod.properties`, `SPRING_PROFILES_ACTIVE: prod`, `server.error.include-message=never`, `ForgotPasswordResponse(String message)` đồng thời giữ nguyên cấu hình `ci.yml` (trigger `main`, `dev`) và `cd-docker.yml` (có test gate `needs: [backend-test, frontend-test]` và healthcheck qua `docker compose exec -T backend wget`).
- **Bằng chứng:** Diff tại Mục 14.4.
- **Hướng khắc phục:** Trước khi tạo PR merge `minh/assigned-tasks` vào `main`, đồng bộ (`git checkout origin/main -- .github/workflows/ci.yml .github/workflows/cd-docker.yml`) để giữ bản workflow chuẩn của `origin/main`, sau đó merge các bản vá bảo mật `T193-G2.2-A` và `T204` lên `main`.
- **Trạng thái:** **OPEN**

---

#### 2. `BUG-SEC-02` – Lộ plaintext Reset Token và Verification Token trong bảng `email_logs` qua API `GET /api/admin/emails`
- **Mức độ:** **Medium**
- **Người phụ trách:** Phùng Văn Vượng (Backend)
- **Thành phần bị ảnh hưởng:**
  - `backend/src/main/java/com/quickstay/email/EmailService.java` (dòng 88–114)
  - `backend/src/main/java/com/quickstay/email/EmailController.java` (dòng 15–21, 37–41)
- **Cách tái hiện:**
  1. Gửi request `POST /api/auth/forgot-password` với email của một người dùng bất kỳ.
  2. Đăng nhập bằng tài khoản `ADMIN` và gọi `GET /api/admin/emails`.
  3. Quan sát trường `bodyHtml` của bản ghi có `emailType = "PASSWORD_RESET"`.
- **Kết quả thực tế:** `bodyHtml` lưu trong bảng `email_logs` và trả về qua `GET /api/admin/emails` chứa nguyên vẹn đường dẫn `/reset-password?token=<UUID>` và mã token khôi phục mật khẩu đang còn hiệu lực.
- **Kết quả mong đợi:** Không lưu token khôi phục mật khẩu dạng rõ trong `email_logs.body_html` (che thành `***REDACTED***` trước khi lưu vào `email_logs`), hoặc ẩn trường `bodyHtml` của các email loại `PASSWORD_RESET` / `EMAIL_VERIFICATION` khi trả về qua endpoint quản trị `GET /api/admin/emails`.
- **Bằng chứng:** `EmailService.java` dòng 103, 110 và `EmailController.java` dòng 37–41.
- **Hướng khắc phục:** Trong `EmailService.send()`, sau khi gửi `JavaMailSender` (nếu `smtpEnabled()`), che chuỗi token trong `safeBody` trước khi lưu `logs.save(entry)`, hoặc trong `EmailController.adminEmails()` lọc bỏ/redact `bodyHtml` đối với `emailType` nhạy cảm (`PASSWORD_RESET`, `EMAIL_VERIFICATION`).
- **Trạng thái:** **OPEN**

---

#### 3. `BUG-SEC-03` – Cấu hình `docker-compose.yml` (Dev) còn mở port 8080 ra `0.0.0.0` và dùng fallback yếu
- **Mức độ:** **Low**
- **Người phụ trách:** Lê Duy Minh (DevOps)
- **Thành phần bị ảnh hưởng:** `docker-compose.yml` (dòng 28–32, 41)
- **Cách tái hiện:** Đọc file `docker-compose.yml` dòng 28–42.
- **Kết quả thực tế:**
  - `ports: - "${BACKEND_PORT:-8080}:8080"` mở cổng backend ra tất cả interface (`0.0.0.0:8080`) thay vì chỉ `127.0.0.1`.
  - Chứa fallback `${DB_PASSWORD:-quickstay_pw}`, `${JWT_SECRET:-change-me-change-me-change-me-change-me}`, `${ADMIN_PASSWORD:-Admin@123}`. Nếu người vận hành chạy nhầm `docker compose up -d` (thiếu `-f docker-compose.prod.yml`) trên máy chủ chưa có `.env`, container vẫn chạy với mật khẩu mặc định.
- **Kết quả mong đợi:** Giới hạn port dev về `127.0.0.1:${BACKEND_PORT:-8080}:8080` và truyền thêm `SEED_SAMPLE_DATA: ${SEED_SAMPLE_DATA:-true}`.
- **Bằng chứng:** `docker-compose.yml` dòng 28–42.
- **Hướng khắc phục:** Đổi port binding trong `docker-compose.yml` thành `127.0.0.1:${BACKEND_PORT:-8080}:8080` và bổ sung ghi chú cảnh báo không dùng file này trên production.
- **Trạng thái:** **OPEN**

---

#### 4. `BUG-SEC-04` – Tồn tại 2 file SQL dump thử nghiệm trong thư mục `backups/` trên đĩa local
- **Mức độ:** **Low**
- **Người phụ trách:** Lê Duy Minh (DevOps)
- **Thành phần bị ảnh hưởng:**
  - `backups/quickstay_backup_20261109_230010.sql`
  - `backups/quickstay_backup_20261109_230947.sql`
- **Cách tái hiện:** Quét working tree bằng `secret_scanner.py` phát hiện 2 dòng `INSERT INTO users` tại dòng 141 của 2 file `.sql` trong thư mục `backups/`.
- **Kết quả thực tế:** Dù `.gitignore` đã chặn hoàn toàn thư mục `backups/` và `*.sql` (`git ls-files backups/` trả về rỗng, không bị lộ lên Git), hai file backup sinh ra từ bài test T147 vẫn còn lưu trên ổ cứng máy phát triển và chứa email, số điện thoại cùng BCrypt password hash.
- **Kết quả mong đợi:** Xóa hoặc di chuyển các bản dump chứa dữ liệu người dùng ra khỏi thư mục làm việc sau khi hoàn tất kiểm thử backup/restore T147.
- **Bằng chứng:** Kết quả quét `BCRYPT_HASH` tại `backups/quickstay_backup_20261109_*.sql:141`.
- **Hướng khắc phục:** Dọn dẹp các file `.sql` cũ trong `backups/` khi không còn nhu cầu đối chiếu T147 (tuân thủ quy tắc T211: hiện tại không tự ý xóa file dữ liệu khi chưa có xác nhận).
- **Trạng thái:** **OPEN**

---

### 12.3. Thẻ Bug chuẩn hóa để nhập vào cột **Bug** (Lark Base / Trello / Jira)

```text
[BUG-SEC-01] Đồng bộ workflow CI/CD trên origin/main và merge bản vá bảo mật T193-G2.2-A + T204 vào main [Minh, Hưng] (Mức độ: High | Trạng thái: OPEN)
[BUG-SEC-02] Che (redact) reset token và verification token trong email_logs / GET /api/admin/emails [Vượng] (Mức độ: Medium | Trạng thái: OPEN)
[BUG-SEC-03] Giới hạn port 8080 về 127.0.0.1 và bổ sung SEED_SAMPLE_DATA trong docker-compose.yml dev [Minh] (Mức độ: Low | Trạng thái: OPEN)
[BUG-SEC-04] Dọn dẹp 2 file SQL dump thử nghiệm T147 trong thư mục backups/ local sau khi nghiệm thu [Minh] (Mức độ: Low | Trạng thái: OPEN)
```

---

## 13. Người phụ trách và mức độ ưu tiên xử lý

| Thứ tự ưu tiên | Mã Bug | Người phụ trách | Mức độ | Cần xoay vòng (Rotate) Secret? | Hành động yêu cầu trước khi gắn tag `v1.0` |
|---|---|---|---|---|---|
| **1 (Bắt buộc trước release)** | `BUG-SEC-01` | Lê Duy Minh & Nguyễn Thạc Hưng | **High** | Không | Giữ `ci.yml` + `cd-docker.yml` của `origin/main` và merge `application-prod.properties`, `docker-compose.prod.yml`, `AuthDtos.java` từ `minh/assigned-tasks` vào `main`. |
| **2 (Khuyến nghị cao)** | `BUG-SEC-02` | Phùng Văn Vượng | **Medium** | Không | Không trả `bodyHtml` chứa token `PASSWORD_RESET` qua `/api/admin/emails` hoặc redact token trước khi lưu vào `email_logs`. |
| **3 (Cải thiện cấu hình)** | `BUG-SEC-03` | Lê Duy Minh | **Low** | Không | Bind `127.0.0.1:8080:8080` trong `docker-compose.yml` dev. |
| **4 (Vệ sinh môi trường)** | `BUG-SEC-04` | Lê Duy Minh | **Low** | Không | Xóa 2 file `.sql` local trong `backups/` sau khi giảng viên/trưởng nhóm xác nhận không cần dùng lại. |

> **Đánh giá việc Rotate/Revoke Secret (Giai đoạn 5):**  
> Vì **không có bất kỳ secret thật nào** (`JWT_SECRET` production, `DB_PASSWORD` production, `ADMIN_PASSWORD` production, `ANTHROPIC_API_KEY`, `MAIL_PASSWORD`, `VPS_SSH_KEY`) bị lộ trong mã nguồn hay trong 145 commits lịch sử Git, **không có secret nào bị lộ cần phải revoke khẩn cấp do rò rỉ Git**. Tuy nhiên, trên VPS production (`/opt/quickstay/.env`), quản trị viên cần đảm bảo `ADMIN_PASSWORD` và `JWT_SECRET` đã được đặt bằng chuỗi ngẫu nhiên mạnh (không dùng giá trị mẫu `Admin@123`).

---

## 14. Bằng chứng Log đã che thông tin nhạy cảm (`***REDACTED***`)

### 14.1. Log quét Secret trên Working Tree và Lịch sử Git (`SEC-01`, `SEC-02`)
```text
=== WORKING TREE SCAN ===
Scanned 241 text files in working tree. Findings: 51
  [ENV_ASSIGNMENT] .env.example:12 -> DB_PASSWORD=[KNOWN_DEV_OR_PLACEHOLDER: quickstay_pw]
  [ENV_ASSIGNMENT] .env.example:13 -> DB_ROOT_PASSWORD=[KNOWN_DEV_OR_PLACEHOLDER: root_pw]
  [ENV_ASSIGNMENT] .env.example:17 -> JWT_SECRET=[KNOWN_DEV_OR_PLACEHOLDER: doi-chuoi-nay-toi-thieu-32-ky-tu-ngau-nhien]
  [ENV_ASSIGNMENT] .env.example:22 -> ADMIN_PASSWORD=[KNOWN_DEV_OR_PLACEHOLDER: Admin@123]
  [ENV_ASSIGNMENT] docker-compose.prod.yml:39 -> DB_PASSWORD=[KNOWN_DEV_OR_PLACEHOLDER: ${DB_PASSWORD}]
  [ENV_ASSIGNMENT] docker-compose.prod.yml:40 -> JWT_SECRET=[KNOWN_DEV_OR_PLACEHOLDER: ${JWT_SECRET}]
  [ENV_ASSIGNMENT] docker-compose.prod.yml:43 -> ADMIN_PASSWORD=[KNOWN_DEV_OR_PLACEHOLDER: ${ADMIN_PASSWORD}]
  [ENV_ASSIGNMENT] .github\workflows\cd-docker.yml:112 -> VPS_HOST=[KNOWN_DEV_OR_PLACEHOLDER: ${{ secrets.VPS_HOST }}]
  [ENV_ASSIGNMENT] .github\workflows\cd-docker.yml:114 -> VPS_SSH_KEY=[KNOWN_DEV_OR_PLACEHOLDER: ${{ secrets.VPS_SSH_KEY }}]
  [SPRING_PROP_SECRET] backend\src\main\resources\application-prod.properties:10 -> app.jwt.secret=[KNOWN_DEV_OR_PLACEHOLDER: ${JWT_SECRET}]
  [SPRING_PROP_SECRET] backend\src\main\resources\application-prod.properties:15 -> app.admin.password=[KNOWN_DEV_OR_PLACEHOLDER: ${ADMIN_PASSWORD}]
  [BCRYPT_HASH] backups\quickstay_backup_20261109_230010.sql:141 -> $2a$***REDACTED***(60 chars)
  [BCRYPT_HASH] backups\quickstay_backup_20261109_230947.sql:141 -> $2a$***REDACTED***(60 chars)

=== GIT HISTORY SCAN (--all) ===
Total commits scanned across all branches: 145
Unique findings across all 145 commits: 47 (0 Confirmed secrets; 47 placeholders/env references)
  [ENV_ASSIGNMENT] commit ee35d609 | .github/workflows/ci-backend.yml:34 -> JWT_SECRET=test***REDACTED***(47 chars) [Verified: words_only=True, CI test placeholder]
```

### 14.2. Log kiểm tra Git Index và Lịch sử File nhạy cảm (`SEC-03`)
```text
=== Check tracked sensitive files in current index ===
$ git ls-files | Select-String -Pattern "(^|/)\.env($|\.)|\.(pem|key|p12|jks|pfx|secret|sql|bak)$"
.env.example
backend/src/main/resources/db/migration/V1__init_schema.sql
backend/src/main/resources/db/migration/V2__payments_emails_auth_tokens.sql
backend/src/main/resources/db/migration/V3__hotel_extras_reviews_qa_settings.sql
backend/src/main/resources/db/migration/V4__fix_booking_status_type.sql

=== Check Git history (--all) for any .env, key, or backup .sql files ever committed ===
$ git log --all --full-history --oneline -- ".env" "**/.env" ".env.local" ".env.production" "*.pem" "*.key" "*.p12" "*.jks" "backups/*" "db-backup/*"
(0 results)
```

### 14.3. Log kết quả thực thi các Suite Kiểm thử Bảo mật Backend (`SEC-08` → `SEC-12`)
```text
=== com.quickstay.security.JwtServiceTest (tests=4, failures=0, time=0.02s) ===
  [PASS] token_carries_email_role_and_expiry() (0.002s)
  [PASS] tampered_token_is_rejected() (0.004s)
  [PASS] expired_token_is_rejected() (0.005s)
  [PASS] token_signed_with_another_secret_is_rejected() (0.003s)

=== com.quickstay.AuthApiTest (tests=10, failures=0, time=1.636s) ===
  [PASS] TC_AUTH_FORGOT_03_response_has_exactly_one_field_message() (0.74s)
  [PASS] TC_AUTH_09_default_admin_can_login_with_admin_role() (0.143s)
  [PASS] TC_AUTH_04_register_validates_input() (0.052s)
  [PASS] TC_AUTH_FORGOT_04_nonexistent_and_existing_email_return_identical_message() (0.106s)
  [PASS] TC_AUTH_03_duplicate_email_is_rejected_even_with_other_case_and_spaces() (0.088s)
  [PASS] TC_AUTH_FORGOT_02_existing_customer_email_returns_200_with_only_message_no_token_fields() (0.091s)
  [PASS] TC_AUTH_02_password_is_stored_as_bcrypt_hash() (0.101s)
  [PASS] TC_AUTH_05_login_success_and_wrong_password() (0.219s)
  [PASS] TC_AUTH_FORGOT_01_nonexistent_email_returns_200_with_only_message_field() (0.01s)
  [PASS] TC_AUTH_01_register_returns_token_and_customer_role() (0.078s)

=== com.quickstay.user.AuthServiceTest (tests=13, failures=0, time=0.727s) ===
  [PASS] forgotPassword_with_email_service_customer_no_token_in_response() (0.633s)
  [PASS] resetPassword_valid_token_clears_token_and_updates_password() (0.005s)
  [PASS] register_saves_customer_with_hashed_password_and_normalized_email() (0.007s)
  [PASS] forgotPassword_no_email_service_nonexistent_email_returns_safe_message() (0.003s)
  [PASS] resetPassword_invalid_or_already_used_token_throws_bad_request() (0.004s)
  [PASS] resetPassword_expired_token_throws_bad_request() (0.004s)
  [PASS] login_with_correct_password_returns_token() (0.005s)
  [PASS] login_wrong_password_and_unknown_email_give_same_401() (0.013s)
  [PASS] forgotPassword_nonexistent_email_returns_same_safe_message_as_existing_email() (0.003s)
  [PASS] forgotPassword_no_email_service_existing_email_saves_token_returns_safe_message_no_token_in_response() (0.012s)
  [PASS] forgotPassword_with_email_service_admin_no_token_in_response() (0.005s)
  [PASS] forgotPassword_smtp_failure_returns_safe_message_no_exception_propagated() (0.012s)
  [PASS] register_duplicate_email_is_conflict_and_saves_nothing() (0.005s)

=== com.quickstay.RealHttpPermissionTest (tests=7, failures=0, time=1.397s) ===
  [PASS] customer_cannot_reach_admin_api_through_path_variants() (0.182s)
  [PASS] admin_status_change_rejects_missing_or_unknown_status() (0.172s)
  [PASS] public_get_does_not_open_write_methods_on_hotels() (0.146s)
  [PASS] public_apis_need_no_login_and_ignore_roles() (0.236s)
  [PASS] admin_apis_need_admin_role() (0.286s)
  [PASS] account_apis_need_login_and_allow_both_roles() (0.217s)
  [PASS] booking_is_for_customers_only() (0.156s)

=== com.quickstay.CorsTest (tests=14, failures=0, time=0.212s) ===
  [PASS] CORS_01a..CORS_07 (14/14 PASSED)

=== com.quickstay.ErrorHandlingTest (tests=23, failures=0, time=1.928s) ===
  [PASS] TC_EH001..TC_EH023 (23/23 PASSED)

=== com.quickstay.UnexpectedErrorTest (tests=1, failures=0, time=0.086s) ===
  [PASS] unexpected_exception_is_500_with_generic_message_only() (0.086s)
```

### 14.4. Bằng chứng đối chiếu `origin/main` và `minh/assigned-tasks` (`BUG-SEC-01`)
```diff
--- a/backend/src/main/resources/application.properties (origin/main)
+++ b/backend/src/main/resources/application.properties (minh/assigned-tasks)
-server.error.include-message=always
+server.error.include-message=never

--- /dev/null (origin/main)
+++ b/backend/src/main/resources/application-prod.properties (minh/assigned-tasks)
+app.jwt.secret=${JWT_SECRET}
+app.admin.password=${ADMIN_PASSWORD}
+app.seed.sample-data=false
```

---

## 15. Kết luận và Giới hạn kiểm thử

### 15.1. Phân loại kết luận rõ ràng
- **PASS (9/12 test cases):**
  - `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04`, `SEC-05`, `SEC-06`, `SEC-07`, `SEC-09`, `SEC-11`.
  - Xác nhận bằng bằng chứng thực tế: **Không có bất kỳ secret thật nào (`0 Confirmed secrets`)** bị lộ trong working tree hoặc trong 145 commits lịch sử Git. `.env` và `backups/` được `.gitignore` bảo vệ chặt chẽ.
- **FAIL (3/12 test cases – cần xử lý trước khi đóng T211 / gắn tag `v1.0`):**
  - `SEC-08` & `SEC-10`: Bản sửa `application-prod.properties`, `SPRING_PROFILES_ACTIVE=prod` và `server.error.include-message=never` đã hoàn thành và pass 339/339 tests trên nhánh `minh/assigned-tasks`, nhưng **chưa được merge vào `origin/main`** (`BUG-SEC-01`).
  - `SEC-12`: Endpoint `/api/auth/forgot-password` đã được vá an toàn (không trả token trong JSON response), nhưng `EmailService` vẫn lưu HTML chứa reset token vào bảng `email_logs` và hiển thị qua `GET /api/admin/emails` (`BUG-SEC-02`).
- **FALSE POSITIVE (98 raw regex matches):**
  - Toàn bộ 51 matches trên working tree và 47 unique matches trong lịch sử Git đã được xác minh là biến tham chiếu môi trường (`${...}`, `${{ secrets.* }}`), giá trị mẫu dev (`Admin@123`, `quickstay_pw`, `test-secret-...`), hoặc BCrypt hash thử nghiệm trong file local untracked (`backups/*.sql`).
- **NOT TESTED:**
  - Nội dung thực tế của file `/opt/quickstay/.env` trên máy chủ VPS và cấu hình GitHub Secret Scanning / Dependabot UI trên GitHub (do giới hạn quyền truy cập và quy tắc bảo mật không đọc/in secret thật trên production).

### 15.2. Đánh giá tổng thể T211
1. **Về tiêu chí "Không lộ Secret trong Git":** **ĐẠT (PASS)** trong toàn bộ phạm vi source code và 145 commits lịch sử Git đã kiểm tra.
2. **Về tiêu chí "Sẵn sàng đóng nhiệm vụ bảo mật cuối trước khi release `v1.0`":** **CHƯA ĐẠT HOÀN TOÀN (CONDITIONAL / CẦN XỬ LÝ `BUG-SEC-01` & `BUG-SEC-02`)** cho đến khi nhánh `minh/assigned-tasks` được đồng bộ workflow và merge vào `origin/main`, đồng thời che token khôi phục mật khẩu trong `email_logs`.
