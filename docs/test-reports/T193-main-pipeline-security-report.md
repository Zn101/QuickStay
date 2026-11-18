# T193 – Báo cáo Audit GitHub Actions trên main và Cảnh báo Bảo mật

**Ngày thực hiện:** 13/11/2026  
**Dự án:** QuickStay (`D:\OJT_QuickStay_Project\QuickStay`)  
**Người thực hiện:** QA/Security Audit Agent  
**Nhánh cục bộ hiện tại:** `minh/assigned-tasks` (Commit `fe8b174`)  
**Trạng thái Working Tree:** Clean (Không có thay đổi chưa commit, không đổi nhánh, không viết lại lịch sử Git)  

---

## 1. Thông tin Commit trên nhánh `main`

### 1.1 Chi tiết commit mới nhất của `origin/main`

- **Commit SHA đầy đủ:** `bbba34ad8856787cc2573610939bef500c4aca7a`
- **Short SHA:** `bbba34a`
- **Tác giả (Author):** Zn101 (`hungthac066@gmail.com`)
- **Thời gian commit:** `2026-11-13 09:59:51 +0800` (UTC: `2026-11-13T01:59:51Z`)
- **Tiêu đề commit:** `feat: enlarge chat button 2x, add professional enterprise footer, expand sample hotels and photos`
- **Commit cha:** `fec8baf69377489bfbc80542dbd6c7847f70e45b`

### 1.2 Đối chiếu phiên bản code đang triển khai với `origin/main`

- **Trạng thái đối chiếu:** **PASS**
- **Bằng chứng:**
  - Workflow CD Run ID: `43354102537`
  - Trigger: `push` vào nhánh `main` với commit SHA `bbba34ad8856787cc2573610939bef500c4aca7a`.
  - Kết quả triển khai: Bước `Deploy to VPS` đã hoàn thành thành công (`conclusion: success`) vào lúc `2026-11-13T02:45:26Z`.
  - Hình ảnh triển khai trên máy chủ production:
    - `ghcr.io/zn101/quickstay-backend:sha-bbba34a` (và tag `latest`)
    - `ghcr.io/zn101/quickstay-frontend:sha-bbba34a` (và tag `latest`)
  - Code đang chạy trên VPS chính là commit mới nhất `bbba34a` của `origin/main`.

---

## 2. Danh sách Workflow trong `.github/workflows/`

Khi kiểm tra cấu hình workflow, có sự khác biệt quan trọng giữa nhánh `origin/main` và workspace cục bộ:

| File Workflow | Tồn tại trên `origin/main` | Tồn tại trên nhánh hiện tại (`minh/assigned-tasks`) | Chức năng chính |
|---|:---:|:---:|---|
| `.github/workflows/cd-docker.yml` | **CÓ** | **CÓ** | Build Docker Backend & Frontend, Push GHCR, Deploy VPS |
| `.github/workflows/ci.yml` | **KHÔNG** | **CÓ** | Chạy Backend test (Java 17) & Frontend test/build (Node 20) |
| `.github/workflows/.gitkeep` | **CÓ** | **CÓ** | Giữ cấu trúc thư mục |

> [!CRITICAL]
> **Phát hiện nghiêm trọng:** Trên nhánh `origin/main`, file `ci.yml` **hoàn toàn chưa được đưa lên**. Trên nhánh cục bộ `minh/assigned-tasks`, file `ci.yml` có tồn tại nhưng cấu hình trigger chỉ bắt nhánh `recovery/clean-dev`. Do đó, trên nhánh `main`, **không có bất kỳ bài test tự động nào được chạy** trước hoặc sau khi merge/push.

---

## 3. Kết quả từng Job CI/CD

### 3.1 Workflow CD: `CD – Build & Push to GHCR` (`.github/workflows/cd-docker.yml`)

- **Kích hoạt:** Push vào nhánh `main`
- **Run ID mới nhất:** `43354102537` (Commit `bbba34a`)
- **Trạng thái:** `completed` / **`success`** (Thời gian thực thi: 2 phút 21 giây)

| Thứ tự | Tên bước (Step) | Trạng thái | Thời lượng | Đánh giá |
|:---:|---|:---:|:---:|---|
| 1 | `Set up job` | Success | 2s | Khởi tạo môi trường runner Ubuntu |
| 2 | `Checkout repository` | Success | 2s | `actions/checkout@v4` |
| 3 | `Set up Docker Buildx` | Success | 5s | `docker/setup-buildx-action@v3` |
| 4 | `Log in to GitHub Container Registry` | Success | 0s | Đăng nhập GHCR bằng `secrets.GITHUB_TOKEN` |
| 5 | `Extract metadata for backend` | Success | 1s | Tag `sha-bbba34a` và `latest` |
| 6 | `Build and push backend image` | Success | 44s | Build từ `./backend/Dockerfile` và push GHCR |
| 7 | `Extract metadata for frontend` | Success | 0s | Tag `sha-bbba34a` và `latest` |
| 8 | `Build and push frontend image` | Success | 15s | Build từ `./frontend/Dockerfile` và push GHCR |
| 9 | `Summary` | Success | 0s | Xuất thông tin tag ra GitHub Step Summary |
| 10 | `Deploy to VPS` | Success | 64s | SSH vào VPS, pull image mới, restart container, healthcheck UP |

### 3.2 Workflow CI: `CI` (`.github/workflows/ci.yml`)

- **Trạng thái trên `origin/main`:** **FAIL / NOT CONFIGURED**
- **Bằng chứng:**
  - Remote `origin/main` không có file `ci.yml`.
  - Lịch sử GitHub Actions cho thấy các commit trên `main` (`bbba34a`, `fec8baf`, `870c985`, `5ed7084`, `51e5214`, `75e7999`) chỉ kích hoạt workflow CD `cd-docker.yml`, không có CI run nào.
  - File `ci.yml` ở local chỉ trigger trên `push`/`pull_request` của nhánh `recovery/clean-dev`.

### 3.3 Phân tích Điều kiện Phụ thuộc và Quality Gate

- **Điều kiện phụ thuộc giữa các job:** **KHÔNG CÓ**. Job `build-and-push` trong `cd-docker.yml` chạy độc lập, không phụ thuộc vào kết quả của bất kỳ CI job nào.
- **Quality Gate:** **KHÔNG CÓ**. Quá trình CD đóng gói và deploy thẳng lên VPS mà không kiểm tra xem test suite có pass hay không.

---

## 4. Kết quả Backend Test

### 4.1 Cấu hình trong Workflow (`ci.yml`)
- **Java version:** Java 17 (`distribution: temurin`) – **PASS**
- **Gradle wrapper:** `./gradlew test --no-daemon` – **PASS**
- **Cờ bỏ qua test:** Không sử dụng `-x test`, không dùng `continue-on-error` – **PASS**

### 4.2 Cấu hình trong Dockerfile (`backend/Dockerfile`)
- **Lệnh build:** `RUN ./gradlew bootJar --no-daemon -x test` (Dòng 25)
- **Đánh giá:** Dockerfile chủ động bỏ qua test (`-x test`). Vì CI không chạy trên `main`, các bài test không được thực thi ở bất kỳ giai đoạn nào trong pipeline trên `main`.

### 4.3 Kết quả Thực thi Kiểm thử Cục bộ (Local Verification)
- **Môi trường:** JDK 17 (`Oracle JDK 17.0.12 LTS`), Gradle 9.0.0
- **Lệnh thực thi:** `.\gradlew.bat test --offline`
- **Kết quả:**
  - **Tổng số test:** 326 tests
  - **Thất bại (Failures):** 0
  - **Bỏ qua (Ignored):** 0
  - **Thời gian thực thi:** 35.823 giây
  - **Trạng thái:** **PASS** (Toàn bộ 326 test suite của Backend đều pass khi chạy thực tế).

---

## 5. Kết quả Frontend Test và Build

### 5.1 Cấu hình trong Workflow (`ci.yml`)
- **Node.js version:** Node.js 20 (`actions/setup-node@v4`) – **PASS**
- **Dependency installation:** `npm ci` với cache package-lock.json – **PASS**
- **Vitest & Build:** `npm test` (`vitest run`) và `npm run build` (`vite build`) – **PASS**
- **Cờ bỏ qua:** Không dùng `continue-on-error` – **PASS**

### 5.2 Kết quả Thực thi Kiểm thử Cục bộ (Local Verification)
- **Frontend Test (`npm test`):**
  - Runner: Vitest v2.1.9
  - Test files: 2 files (`src/lib/format.test.js`, `src/App.test.jsx`)
  - **Tổng số test:** 18 tests
  - **Thất bại:** 0
  - **Thời gian thực thi:** 6.61 giây
  - **Trạng thái:** **PASS**
- **Frontend Build (`npm run build`):**
  - Tool: Vite v5.4.21
  - Output: `dist/index.html` (0.66 kB), `dist/assets/index-*.css` (80.99 kB), `dist/assets/index-*.js` (449.70 kB)
  - **Thời gian build:** 2.63 giây
  - **Trạng thái:** **PASS**

---

## 6. Kết quả Docker Build và GHCR

### 6.1 Dockerfile Backend
- **Multi-stage:** Có (Stage 1: `eclipse-temurin:17-jdk-alpine`, Stage 2: `eclipse-temurin:17-jre-alpine`).
- **Bảo mật người dùng:** Sử dụng user không có quyền root (`appuser:appgroup`).
- **Port:** Expose 8080.
- **Entrypoint:** `java -jar app.jar`.

### 6.2 Dockerfile Frontend
- **Multi-stage:** Có (Stage 1: `node:22-alpine` build `dist`, Stage 2: `nginx:1.27-alpine`).
- **Nginx configuration:** Sử dụng `nginx.conf` với gzip, caching assets, try_files SPA, proxy pass sang backend `/api/` với các header `X-Forwarded-For`, `X-Forwarded-Proto`, `Host`.
- **Port:** Expose 80.

### 6.3 GHCR & VPS Deploy
- **Đăng nhập GHCR:** Sử dụng `secrets.GITHUB_TOKEN` với quyền `packages: write`.
- **Image Tags:** Tag theo short commit SHA (`sha-bbba34a`) và `latest`.
- **Triển khai VPS:**
  - Sử dụng khóa SSH Ed25519 từ secret `VPS_SSH_KEY`.
  - Có bước kiểm tra fingerprint host key an toàn: `SHA256:fC0vLYUEKoEyoQsLPjKfSwCm1N9fN5g08MRUyKgAgQM`.
  - Khởi động service bằng `docker compose up -d --no-build --no-deps backend frontend`.
  - Chờ Actuator health check đạt trạng thái `"status":"UP"`.

---

## 7. Kết quả Kiểm tra Cảnh báo Bảo mật

### 7.1 Dependabot

- **GitHub Dependabot API:** **NOT AVAILABLE**  
  *Lý do:* Gọi endpoint `GET /repos/Zn101/QuickStay/dependabot/alerts` trả về mã lỗi `HTTP Error 401: Unauthorized` do thiếu authentication token có scope bảo mật.
- **Kiểm tra Dependency Backend (Gradle / Java):**
  - Framework: Spring Boot `3.5.6`, Spring Security, JJWT `0.12.6`, Flyway MySQL, MySQL Connector/J.
  - Đánh giá: Các thư viện Spring Boot cốt lõi ở phiên bản cập nhật, không có CVE công khai mức Critical trực tiếp trong danh sách khai báo.
- **Kiểm tra Dependency Frontend (npm audit):**
  - **Trạng thái:** **FAIL** (Phát hiện 8 lỗ hổng bảo mật: 2 Critical, 1 High, 5 Moderate).
  - Chi tiết các package bị ảnh hưởng:
    1. **`tinypool <= 2.1.1`** (Mức độ: **CRITICAL**):
       - Cảnh báo: Prototype Pollution gadget trong worker options dẫn đến Remote Code Execution (RCE) – [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr).
       - Bị phụ thuộc thông qua: `vitest` (devDependency).
       - Phiên bản vá: `vitest@5.1.0` (có breaking change).
    2. **`react-router` / `react-router-dom 6.0.0 - 7.17.0`** (Mức độ: **MODERATE**):
       - Cảnh báo: Open redirect qua ký tự backslash trong `<Link>` và `useNavigate` – [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), Arbitrary Constructor Injection qua `deserializeErrors()` – [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg).
       - Bản vá: `react-router-dom@7.18.5`.
    3. **`esbuild <= 0.24.2`** (Mức độ: **MODERATE**):
       - Cảnh báo: Dev server có thể cho phép website khác gửi request và đọc response trong quá trình dev – [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).
       - Bị phụ thuộc qua: `vite`.
    4. **`@vitest/mocker <= 4.1.11`** (Mức độ: **MODERATE**):
       - Cảnh báo: Path Traversal / Arbitrary File Read và Code injection – [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8).

### 7.2 Code Scanning

- **GitHub Code Scanning API:** **NOT AVAILABLE** (`HTTP Error 401: Unauthorized`).
- **Phân tích Mã nguồn Cục bộ (Static Code Analysis):**
  - **SQL Injection:** **PASS**. Toàn bộ 17 repository và service đều sử dụng JPA Query method hoặc Spring Data `@Query` với parameter binding chuẩn (`:param`, `?1`). Không có chuỗi SQL nối chuỗi động hoặc `createNativeQuery` thô nối chuỗi.
  - **XSS (Cross-Site Scripting):** **PASS**. Không phát hiện việc sử dụng `dangerouslySetInnerHTML` hay gán trực tiếp `.innerHTML` trong mã nguồn React của Frontend.
  - **Xác thực và Phân quyền:** **PASS**. Sử dụng JWT stateless filter, mã hóa mật khẩu bằng `BCryptPasswordEncoder`. Endpoint `/api/admin/**` bắt buộc quyền `ROLE_ADMIN`, endpoint đặt phòng bắt buộc `ROLE_CUSTOMER`.
  - **Actuator Endpoints:** **PASS**. File cấu hình chỉ bật `health,info`, không mở các endpoint nhạy cảm như `env`, `heapdump`, `beans`. Endpoint `/actuator/health` mở công khai cho container healthcheck, các endpoint khác yêu cầu xác thực.
  - **Lộ chi tiết lỗi (Information Disclosure):** **FAIL / LOW**. Cấu hình `server.error.include-message=always` trong `application.properties` có thể làm lộ thông báo ngoại lệ nội bộ của hệ thống khi gặp lỗi không lường trước.

### 7.3 Secret Scanning

- **GitHub Secret Scanning API:** **NOT AVAILABLE** (`HTTP Error 401: Unauthorized`).
- **Rà soát Workspace và Git History Cục bộ:**
  - **Trạng thái:** **PASS**.
  - Không tìm thấy Anthropic API key thật (`sk-ant-...`), GitHub PAT/Token (`ghp_...`), AWS Access Key, hay Private Key RSA/EC/OpenSSH nào trong mã nguồn hiện tại cũng như trong 300 commits gần nhất của lịch sử Git.
  - `.gitignore` cấu hình đầy đủ các mẫu loại trừ: `.env`, `*.secret`, `*.pem`, `*.key`, `*.jks`, `*.sql`, `db-backup/`.

---

## 8. Kiểm tra Cấu hình Dự án

| File cấu hình | Nội dung kiểm tra | Đánh giá | Ghi chú bảo mật |
|---|---|:---:|---|
| `.gitignore` | Chặn env, secret, key, db dumps, build dirs | **PASS** | Cấu hình rất chặt chẽ, đầy đủ |
| `.env.example` | Mẫu biến môi trường | **PASS** | Chỉ chứa placeholder và giá trị dev mẫu, không chứa secret thật |
| `docker-compose.yml` | Chạy môi trường local dev/test | **PASS** | Dùng giá trị mặc định cho local dev |
| `docker-compose.prod.yml` | Cấu hình production trên VPS | **FAIL (MEDIUM)** | 1. Có fallback mật khẩu mặc định: `ADMIN_PASSWORD: ${ADMIN_PASSWORD:-Admin@123}`.<br>2. Port `8080` của backend được bind trực tiếp ra host thay vì chỉ nằm trong mạng bridge nội bộ. |
| `backend/src/main/resources/application.properties` | Cấu hình mặc định backend Spring Boot | **FAIL (MEDIUM)** | Fallback `ADMIN_PASSWORD: Admin@123` và `JWT_SECRET: dev-only-...` vẫn tồn tại nếu môi trường không cung cấp biến. |
| `frontend/nginx.conf` | Cấu hình reverse proxy SPA | **PASS** | Có header proxy chuẩn, hỗ trợ gzip và caching hợp lý |

---

## 9. Danh sách Rủi ro (Risk Register)

| Mã vấn đề | File / Package liên quan | Mức độ | Bằng chứng | Tác động | Hướng khắc phục | Phối hợp Trưởng nhóm |
|---|---|:---:|---|---|---|:---:|
| **R-01** | `.github/workflows/ci.yml`, `cd-docker.yml` | **HIGH** | `ci.yml` không tồn tại trên `origin/main`. CD deploy trực tiếp khi push vào `main` mà không chạy test. | Code lỗi hoặc hỏng nghiệp vụ có thể được đưa thẳng lên VPS mà không được phát hiện tự động. | Đưa `ci.yml` lên nhánh `main`, cấu hình trigger `push` & `pull_request` vào `main`, hoặc tích hợp job kiểm thử làm điều kiện tiên quyết (gate) trong `cd-docker.yml`. | **CÓ** |
| **R-02** | `docker-compose.prod.yml`, `application.properties` | **HIGH** | Fallback `ADMIN_PASSWORD: ${ADMIN_PASSWORD:-Admin@123}` và `JWT_SECRET` mẫu. | Nếu biến môi trường VPS bị cấu hình thiếu, tài khoản admin sẽ mang mật khẩu yếu mặc định `Admin@123`. | Bỏ giá trị fallback mặc định trong `docker-compose.prod.yml`. Cấu hình fail-fast: Backend không khởi động nếu không có `JWT_SECRET` và `ADMIN_PASSWORD` mạnh trên production. | **CÓ** |
| **R-03** | `frontend/package.json` (`tinypool <= 2.1.1`) | **HIGH** | `npm audit` báo 2 lỗ hổng Critical (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) trong `tinypool` (qua `vitest`). | Rủi ro RCE trong môi trường thực thi test runner của dev/CI nếu xử lý input độc hại. | Lập kế hoạch nâng cấp `vitest` lên phiên bản không chứa lỗ hổng (cần kiểm tra tương thích suite test). | **CÓ** |
| **R-04** | `backend/Dockerfile` | **MEDIUM** | Dòng 25: `RUN ./gradlew bootJar --no-daemon -x test`. | Quá trình build Docker image bỏ qua test hoàn toàn. | Khi CI đã được cấu hình chặt chẽ làm gate trước khi build image, `-x test` trong Dockerfile có thể chấp nhận được; tuy nhiên hiện tại thiếu gate CI nên đây là rủi ro. | **KHÔNG** |
| **R-05** | `docker-compose.prod.yml` | **MEDIUM** | Dòng 52: `ports: - "${BACKEND_PORT:-8080}:8080"`. | Mở cổng backend 8080 trực tiếp ra ngoài Internet thay vì đi qua Nginx reverse proxy. | Đổi sang `expose: - 8080` trong docker-compose.prod.yml, chỉ để Nginx giao tiếp với backend qua network `internal`. | **CÓ** |
| **R-06** | `frontend/package.json` (`react-router-dom`) | **MEDIUM** | Lỗ hổng Open Redirect và Prototype/Constructor Injection trong `react-router 6.26.2`. | Người dùng có thể bị điều hướng đến URL giả mạo nếu tham số link chứa ký tự backslash. | Nâng cấp `react-router-dom` lên bản vá an toàn (>= 6.28.x hoặc 7.x). | **CÓ** |
| **R-07** | `backend/src/main/resources/application.properties` | **LOW** | Dòng 35: `server.error.include-message=always`. | Có thể làm lộ thông điệp lỗi nội bộ cho client khi xảy ra ngoại lệ chưa xử lý. | Đổi thành `server.error.include-message=never` trên môi trường production. | **KHÔNG** |
| **R-08** | GitHub API Security Endpoints | **MEDIUM** | Các API Dependabot, Code Scanning, Secret Scanning trả về `401 Unauthorized`. | Không kiểm tra được cảnh báo native từ GitHub Security Dashboard. | Cung cấp token GitHub có quyền xem security events hoặc phân quyền phù hợp cho nhóm audit. | **CÓ** |

---

## 10. Đề xuất Khắc phục

### 10.1 Nhóm việc cần ưu tiên cao (P1 – Trước đợt release tiếp theo)
1. **Thiết lập CI Quality Gate cho nhánh `main`:**
   - Đưa workflow `ci.yml` lên nhánh `main`.
   - Cấu hình trigger:
     ```yaml
     on:
       push:
         branches: [main, recovery/clean-dev]
       pull_request:
         branches: [main, recovery/clean-dev]
     ```
   - Trong `cd-docker.yml`, bổ sung job test chạy trước hoặc dùng workflow dependency/Branch Protection Rule: Bắt buộc CI pass mới cho phép merge vào `main` và chạy CD.
2. **Loại bỏ Fallback Credential nguy hiểm trên Production:**
   - Trong `docker-compose.prod.yml`, sửa:
     - `ADMIN_PASSWORD: ${ADMIN_PASSWORD}` (bỏ fallback `:-Admin@123`).
     - Đảm bảo file `.env` trên VPS có mật khẩu ngẫu nhiên tối thiểu 20 ký tự.
3. **Đóng cổng Backend 8080 trên Production:**
   - Trong `docker-compose.prod.yml`, xóa mapping port `8080:8080` ra host interface; chỉ để Nginx làm gateway duy nhất tại port 80/443.

### 10.2 Nhóm việc trung hạn (P2 – Giai đoạn củng cố)
1. **Khắc phục lỗ hổng npm:**
   - Thử nghiệm nâng cấp `react-router-dom` lên phiên bản vá lỗi mà không gây xung đột định tuyến.
   - Kiểm tra khả năng nâng cấp `vitest` để loại bỏ lỗ hổng Critical của `tinypool`.
2. **Tắt thông báo lỗi chi tiết trên Production:**
   - Chuyển `server.error.include-message=never` hoặc override biến môi trường trên VPS.
3. **Kích hoạt GitHub Security scanning:**
   - Cấu hình GitHub Advanced Security / Secret scanning và Dependabot version updates tự động.

---

## 11. Bảng Đánh giá Tiêu chuẩn (Standard Evaluation Matrix)

| Hạng mục kiểm tra | Trạng thái | Bằng chứng tóm tắt |
|---|:---:|---|
| **Git Status & Working Tree** | **PASS** | Working tree clean, nhánh `minh/assigned-tasks`, không sửa đổi code |
| **Origin/main Head Commit** | **PASS** | Commit `bbba34ad8856787cc2573610939bef500c4aca7a` được xác định chính xác |
| **Code Triển khai vs Main Commit** | **PASS** | CD run `43354102537` đã deploy đúng commit `bbba34a` lên VPS |
| **Trạng thái Job CD trên GitHub Actions** | **PASS** | Build & Push Docker, Deploy VPS hoàn thành `success` |
| **Trạng thái Job CI trên nhánh main** | **FAIL** | Hoàn toàn chưa cấu hình workflow CI trên nhánh `main` |
| **Quality Gate trước khi Deploy** | **FAIL** | Không có bước kiểm tra bắt buộc test pass trước khi build/push/deploy |
| **Chạy Backend Test cục bộ** | **PASS** | 326/326 tests pass (0 failures, 35.8s) |
| **Chạy Frontend Test cục bộ** | **PASS** | 18/18 tests pass (0 failures, 6.6s) |
| **Chạy Frontend Build cục bộ** | **PASS** | Vite build thành công trong 2.63s |
| **Secret Scanning trong Code & History** | **PASS** | Không phát hiện secret thật hay key nào bị lộ trong 300 commits |
| **Static Code Scanning (SQLi, XSS, Auth)** | **PASS** | Không phát hiện SQLi hay XSS; Auth role-based hoạt động đúng |
| **Bảo mật Cấu hình Production (Compose/Env)** | **FAIL** | Tồn tại fallback `ADMIN_PASSWORD: Admin@123` và mở port 8080 ra host |
| **Cảnh báo Dependency (npm audit)** | **FAIL** | 8 lỗ hổng (2 Critical trong tinypool/vitest, 1 Moderate trong react-router) |
| **Nguồn dữ liệu GitHub Security API** | **NOT AVAILABLE** | API trả về 401 Unauthorized do thiếu auth token |

---

## 12. Kết luận Tổng thể

### **Trạng thái: NOT READY (Chưa sẵn sàng cho chu kỳ vận hành bảo mật)**

**Lý do:**
1. **Thiếu Quality Gate:** Pipeline trên nhánh `main` hiện chỉ có CD (Build, Push GHCR và Deploy VPS) mà **thiếu hoàn toàn CI pipeline** để tự động kiểm thử. Dù bộ test cục bộ đang vượt qua 100% (326 backend tests và 18 frontend tests), hệ thống không có rào chắn ngăn chặn việc một commit lỗi trong tương lai được merge và deploy thẳng lên VPS.
2. **Rủi ro cấu hình Credential:** Tồn tại giá trị mật khẩu quản trị fallback mặc định (`Admin@123`) trong cấu hình production `docker-compose.prod.yml` và mở port 8080 ra bên ngoài.
3. **Cảnh báo Dependency:** Phát hiện lỗ hổng mức Critical trong dependency npm runner.

**Khuyến nghị:**
Nhóm phát triển cần phối hợp với Trưởng nhóm thực hiện ngay các hành động thuộc nhóm P1 (đưa `ci.yml` lên `main`, cấu hình branch protection, xóa bỏ mật khẩu fallback) để đưa pipeline đạt trạng thái **READY**.
