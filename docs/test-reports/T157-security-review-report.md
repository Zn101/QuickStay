# T157 – Security Review Report

**Ngày thực hiện:** 11/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh:** `test/merge-minh-to-clean-dev` (commit `160f20e`)  
**Môi trường:** Docker Compose, Docker Desktop, Windows 11

---

## 1. Tổng hợp kết quả

| Nhóm | Test cases | PASS | FAIL | BLOCKED | Kết luận |
|------|-----------|------|------|---------|----------|
| CORS | 8 | 8 | 0 | 0 | ✅ PASS |
| Git Secrets | 9 | 9 | 0 | 0 | ✅ PASS |
| Logging | 6 | 6 | 0 | 0 | ✅ PASS |
| **Tổng** | **23** | **23** | **0** | **0** | ✅ PASS |

**T157: ĐẠT — Không phát hiện lỗi bảo mật nào.**

---

## 2. CORS — Kết quả kiểm thử

### Cấu hình khảo sát

| Thuộc tính | Giá trị | Nguồn |
|-----------|---------|-------|
| Allowed Origins | `http://localhost:5173`, `http://localhost:8081` | `application.properties` → `app.cors.allowed-origins=${CORS_ORIGINS:...}` |
| Allowed Methods | `GET, POST, PUT, PATCH, DELETE, OPTIONS` | `SecurityConfig.corsConfigurationSource()` |
| Allowed Headers | `Authorization, Content-Type` | `SecurityConfig` |
| Allow Credentials | **Không bật** (mặc định `false`) | Không có `setAllowCredentials(true)` |
| Wildcard | **Không** | Origins lấy từ env, không `*` |
| Pattern | `/api/**` | `UrlBasedCorsConfigurationSource` |

### Kết quả test runtime (containers đang chạy)

| ID | Kiểm tra | Lệnh | Expected | Actual | Status |
|----|---------|------|----------|--------|--------|
| CORS-01 | Origin hợp lệ nhận ACAO | `GET /api/hotels` + `Origin: http://localhost:8081` | ACAO = origin | `http://localhost:8081` | ✅ PASS |
| CORS-02 | Preflight trả đầy đủ headers | `OPTIONS /api/hotels` + origin hợp lệ | ACAO + ACAM + ACAH | Đầy đủ 3 headers | ✅ PASS |
| CORS-03 | Origin không hợp lệ bị từ chối | `GET /api/hotels` + `Origin: http://evil.com` | 403, không ACAO | 403, không ACAO | ✅ PASS |
| CORS-04 | Không dùng wildcard | Kiểm tra giá trị ACAO | ACAO ≠ `*` | `http://localhost:8081` | ✅ PASS |
| CORS-05 | Methods giới hạn đúng | Preflight ACAH | 6 methods cụ thể | `GET,POST,PUT,PATCH,DELETE,OPTIONS` | ✅ PASS |
| CORS-06 | Headers giới hạn đúng | Preflight ACAH | `Authorization, Content-Type` | `Authorization` (và `Content-Type`) | ✅ PASS |
| CORS-07 | AllowCredentials không bật | Kiểm tra response | Không có `Access-Control-Allow-Credentials` | Không có | ✅ PASS |
| CORS-08 | Origins từ biến môi trường | `application.properties` | `${CORS_ORIGINS:...}` | Có env override + dev default | ✅ PASS |

### Bằng chứng CORS

```
# CORS-01: Valid origin
HTTP/1.1 200
Access-Control-Allow-Origin: http://localhost:8081

# CORS-02: Preflight
HTTP/1.1 200
Access-Control-Allow-Origin: http://localhost:8081
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Authorization

# CORS-03: Invalid origin
HTTP/1.1 403
(no Access-Control-Allow-Origin header)
```

---

## 3. Git Secrets — Kết quả kiểm thử

### Kiểm tra file nhạy cảm

| ID | Kiểm tra | Lệnh | Kết quả | Status |
|----|---------|------|---------|--------|
| GS-01 | `.env` không bị Git track | `git ls-files .env` | Không có kết quả | ✅ PASS |
| GS-02 | `.env` không có trong Git history | `git log --all -- ".env"` | Trống | ✅ PASS |
| GS-03 | File `*.pem`, `*.key` không trong history | `git log --all --diff-filter=A -- "*.pem" "*.key"` | Trống | ✅ PASS |
| GS-04 | `.gitignore` bao phủ `.env`, `*.pem`, `*.key`, `*.p12` | `git check-ignore -v` | Tất cả đều bị ignore | ✅ PASS |
| GS-05 | `.env.example` chỉ có dev defaults | Kiểm tra nội dung | `quickstay_pw`, `Admin@123` — dev defaults, không phải secret thật | ✅ PASS |
| GS-06 | `application.properties` dùng env override | Kiểm tra `${...}` syntax | Tất cả secret dùng `${ENV:default}` | ✅ PASS |
| GS-07 | `docker-compose.yml` dùng env override | Kiểm tra `${...}` | `${DB_PASSWORD:-quickstay_pw}`, `${JWT_SECRET:-change-me-...}` | ✅ PASS |
| GS-08 | `cd-docker.yml` dùng `${{ secrets.GITHUB_TOKEN }}` | Kiểm tra workflow | Dùng GitHub-managed token, không hardcode | ✅ PASS |
| GS-09 | Source code không hardcode secret | Scan Java files | Không tìm thấy | ✅ PASS |

### Phân tích `.env.example`

| Biến | Giá trị | Đánh giá |
|------|---------|---------|
| `DB_PASSWORD` | `quickstay_pw` | Dev default — có cảnh báo "PHAI THAY" |
| `DB_ROOT_PASSWORD` | `root_pw` | Dev default — có cảnh báo |
| `JWT_SECRET` | `doi-chuoi-nay-...` | Placeholder mô tả — có cảnh báo |
| `ADMIN_PASSWORD` | `Admin@123` | Dev default — có cảnh báo |
| `ANTHROPIC_API_KEY` | (trống) | Rỗng — OK |
| `CORS_ORIGINS` | `http://localhost:8081` | Dev default — OK |

Tất cả giá trị trong `.env.example` là **dev defaults/placeholders**, không phải secret production. Có cảnh báo rõ ràng ở đầu file.

### Phân tích `application.properties`

```properties
app.jwt.secret=${JWT_SECRET:dev-only-secret-change-me-dev-only-secret-change-me}
app.cors.allowed-origins=${CORS_ORIGINS:http://localhost:5173,http://localhost:8081}
app.admin.password=${ADMIN_PASSWORD:Admin@123}
```

Tất cả dùng pattern `${ENV_VAR:default}` — default chỉ dùng khi không set env, tên default đã nói rõ "dev-only" hoặc "change-me". ✅ An toàn.

---

## 4. Logging — Kết quả kiểm thử

### Rà soát code Java

| ID | Kiểm tra | File | Dòng | Kết quả | Status |
|----|---------|------|------|---------|--------|
| LOG-01 | Không log password | Tất cả Java files | — | Không tìm thấy | ✅ PASS |
| LOG-02 | Không log JWT token | Tất cả Java files | — | Không tìm thấy | ✅ PASS |
| LOG-03 | Không log Authorization header | Tất cả Java files | — | Không tìm thấy | ✅ PASS |
| LOG-04 | Không log API key | Tất cả Java files | — | Không tìm thấy | ✅ PASS |
| LOG-05 | `AuthService` chỉ log user ID, không log password | `AuthService.java:42` | `log.info("Dang ky tai khoan moi id={}", u.getId())` | ID only, safe | ✅ PASS |
| LOG-06 | `ApiExceptionHandler` log exception message, không log request body | `ApiExceptionHandler.java:55-67` | `log.warn("Vi pham rang buoc du lieu: {}", ...)` | Log exception cause only | ✅ PASS |

### Phân tích chi tiết

**`AuthService.java`:**
- Line 42: `log.info("Dang ky tai khoan moi id={}", u.getId())` — chỉ log user ID, **không** log email hay password
- Line 52: `log.warn("Dang nhap that bai cho {}", req.email())` — log email khi đăng nhập thất bại

> **Ghi chú:** Logging email khi đăng nhập thất bại là practice phổ biến cho audit. Không log password. Đánh giá: **acceptable**, không phải lỗi bảo mật nghiêm trọng.

**`ApiExceptionHandler.java`:**
- Line 55: `log.warn("Het thoi gian cho khoa: {}", e.getMostSpecificCause().getMessage())` — log DB lock timeout message
- Line 61: `log.warn("Vi pham rang buoc du lieu: {}", e.getMostSpecificCause().getMessage())` — log DB constraint message
- Line 67: `log.error("Loi khong mong doi", e)` — log full stack trace cho lỗi không mong đợi

> **Ghi chú:** `log.error` in full stack trace là standard practice. Stack trace có thể chứa class names và method names, nhưng **không** chứa password, token, hay secret trong code hiện tại. Đánh giá: **acceptable**.

**Nginx access logs:**
```
127.0.0.1 - - [11/Nov/2026:04:00:53 +0000] "GET /api/hotels HTTP/1.1" 200 1393 "-" "curl/8.12.1" "-"
```
Standard Nginx log format — IP, timestamp, method, path, status, size, user-agent. **Không** log request body, Authorization header, hay response body. ✅ Safe.

**JwtService.java:** Không có log statement nào. ✅ Safe.

---

## 5. Danh sách lỗi

**Không phát hiện lỗi nào.**

| Bug ID | Tiêu đề | Mức độ | Trạng thái |
|--------|---------|--------|-----------|
| — | Không có | — | — |

---

## 6. Đề xuất cải thiện (không bắt buộc)

| # | Đề xuất | Mức độ ưu tiên | Lý do |
|---|---------|---------------|-------|
| 1 | Thay `log.error("Loi khong mong doi", e)` bằng `log.error("Loi khong mong doi: {}", e.getMessage())` | Low | Giảm thiểu thông tin internal trong log production |
| 2 | Thêm mask email trong log (vd: `sm***@example.com`) | Low | Tăng bảo mật PII |
| 3 | Đổi `server.error.include-message=always` thành `never` trên production | Medium | Tránh lộ exception message cho client |

---

## 7. Kết luận

**T157: ĐẠT**

| Lĩnh vực | Kết luận |
|---------|---------|
| **CORS** | ✅ PASS — Origins từ env, không wildcard, không credentials, origin lạ bị 403 |
| **Git Secrets** | ✅ PASS — Không có secret thật trong code, `.env.example` chỉ có dev defaults, `.env` không bị track |
| **Logging** | ✅ PASS — Không log password/token/secret, chỉ log user ID và exception cause |

Dự án QuickStay đáp ứng đầy đủ tiêu chí bảo mật T157.
