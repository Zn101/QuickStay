# T132 – CORS Test Report

**Ngày thực hiện:** 06/11/2026  
**Người thực hiện:** Minh  
**Môi trường:** Windows 11, JDK 17, Spring Boot 3.5.6, H2 in-memory, MockMvc  
**Lệnh chạy:** `cd backend && .\gradlew.bat cleanTest test --rerun-tasks`

---

## 1. Mục tiêu kiểm thử

- Xác nhận Frontend origin được cấu hình nhận đúng `Access-Control-Allow-Origin`
- Xác nhận origin không hợp lệ không được cấp quyền CORS
- Kiểm tra preflight OPTIONS hoạt động đúng
- Kiểm tra các CORS response headers đầy đủ
- Đảm bảo CORS không làm ảnh hưởng JWT authentication

---

## 2. Cấu hình CORS đã khảo sát

### application.properties
```properties
app.cors.allowed-origins=${CORS_ORIGINS:http://localhost:5173,http://localhost:8081}
```

### SecurityConfig.java – CorsConfigurationSource
```java
config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:8081"));
config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
config.setAllowedHeaders(List.of("Authorization","Content-Type"));
// allowCredentials: KHÔNG bật
// Pattern: /api/**
```

### docker-compose.yml
```yaml
CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:8081}
```

### Tổng hợp

| Thuộc tính | Giá trị |
|-----------|---------|
| Allowed Origins | `http://localhost:5173`, `http://localhost:8081` |
| Allowed Methods | `GET, POST, PUT, PATCH, DELETE, OPTIONS` |
| Allowed Headers | `Authorization, Content-Type` |
| Allow Credentials | Không bật |
| Pattern | `/api/**` |

---

## 3. Môi trường kiểm thử

| Thành phần | Giá trị |
|-----------|---------|
| Backend test | Spring Boot @SpringBootTest + MockMvc (H2 in-memory) |
| Frontend origin hợp lệ 1 | `http://localhost:5173` (Vite dev server) |
| Frontend origin hợp lệ 2 | `http://localhost:8081` (Docker frontend) |
| Origin không hợp lệ | `http://evil.com`, `http://attacker.example.com`, `http://localhost:5173.evil.com` |
| Endpoint kiểm thử | `GET /api/hotels` (public), `GET /api/admin/hotels` (ADMIN) |

---

## 4. Kết quả test cases

| Test ID | Nội dung | Expected | Actual | Status | Evidence |
|---------|---------|----------|--------|--------|---------|
| CORS-01a | GET từ `localhost:5173` | `ACAO: http://localhost:5173` | Header đúng | ✅ Pass | `CORS_01a_valid_origin_vite_gets_acao_header` |
| CORS-01b | GET từ `localhost:8081` | `ACAO: http://localhost:8081` | Header đúng | ✅ Pass | `CORS_01b_valid_origin_docker_gets_acao_header` |
| CORS-02a | Preflight OPTIONS từ `localhost:5173` | ACAO + ACAM + ACAH | Đủ 3 headers | ✅ Pass | `CORS_02a_preflight_valid_origin_returns_cors_headers` |
| CORS-02b | Preflight POST từ `localhost:8081` | `ACAO: http://localhost:8081` | Header đúng | ✅ Pass | `CORS_02b_preflight_docker_origin_returns_acao` |
| CORS-02c | ACAM chứa đủ 6 methods | GET/POST/PUT/PATCH/DELETE/OPTIONS | Đủ 6 methods | ✅ Pass | `CORS_02c_preflight_allow_methods_contains_configured_methods` |
| CORS-03a | GET từ `evil.com` | Không có ACAO hoặc 403 | 403 (Spring reject) | ✅ Pass | `CORS_03a_invalid_origin_evil_does_not_get_acao_header` |
| CORS-03b | GET từ `attacker.example.com` | Không có ACAO | ACAO null | ✅ Pass | `CORS_03b_invalid_origin_attacker_does_not_get_acao_header` |
| CORS-03c | GET từ `localhost:5173.evil.com` | ACAO không match origin giả | Không cấp quyền | ✅ Pass | `CORS_03c_fake_subdomain_of_valid_origin_is_rejected` |
| CORS-04 | Preflight từ `evil.com` | Không có ACAO | Không có ACAO | ✅ Pass | `CORS_04_preflight_invalid_origin_no_cors_headers` |
| CORS-05 | GET có Authorization từ `localhost:5173` | `ACAO: http://localhost:5173` | Header đúng | ✅ Pass | `CORS_05_request_with_authorization_header_from_valid_origin` |
| CORS-05b | Preflight yêu cầu Authorization header | ACAH chứa Authorization | Chứa Authorization | ✅ Pass | `CORS_05b_preflight_for_authorization_header_is_allowed` |
| CORS-06a | GET không có Origin | Không có ACAO (không phải CORS) | Không có ACAO | ✅ Pass | `CORS_06a_request_without_origin_header_is_not_cors` |
| CORS-06b | Request không có Origin vẫn được phản hồi | 200 OK | 200 OK | ✅ Pass | `CORS_06b_request_without_origin_still_gets_response` |
| CORS-07 | ACAO không bao giờ là wildcard | ACAO ≠ `*` | ACAO = origin cụ thể | ✅ Pass | `CORS_07_acao_is_never_wildcard` |

**Tổng: 14/14 Pass**

---

## 5. Ghi chú về behavior Spring Security + CORS

Khi origin không hợp lệ gửi CORS request, Spring Security trả **403 Forbidden** (không phải 200 thiếu header). Đây là behavior **đúng và an toàn** — Spring reject preflight/request của origin lạ ở tầng CORS filter trước khi đến endpoint handler.

Điều này có nghĩa:
- Browser sẽ không cho JavaScript đọc response từ origin lạ
- Server trả 403 rõ ràng, không "im lặng" bỏ qua

---

## 6. Kết quả curl thực tế

**Trạng thái: ⚠️ Not Run** — Backend chưa chạy ở port 8080 trên môi trường hiện tại (chỉ chạy H2 in-memory cho test). Để kiểm tra thực tế cần:

```bash
# Khởi động backend (cần Docker MySQL hoặc H2 standalone)
cd backend && .\gradlew.bat bootRun

# Preflight hợp lệ
curl.exe -i -X OPTIONS "http://localhost:8080/api/hotels" `
  -H "Origin: http://localhost:8081" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: authorization,content-type"

# Preflight không hợp lệ
curl.exe -i -X OPTIONS "http://localhost:8080/api/hotels" `
  -H "Origin: https://example-invalid.com" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: authorization,content-type"
```

---

## 7. Bug phát hiện

**Không phát hiện bug.**

Cấu hình CORS hoạt động đúng với mọi trường hợp kiểm thử.

---

## 8. Tổng kết

```
Gradle test: 14/14 CorsTest PASSED
Tổng backend: 256/256 PASSED
BUILD SUCCESSFUL (26s)
curl thực tế: Not Run (backend chưa chạy)
```

**T132: ĐẠT** — Tất cả 14 test case CORS đều pass. Cấu hình CORS đúng theo thiết kế:
- Origin hợp lệ nhận đúng header
- Origin không hợp lệ bị từ chối (403)
- Không dùng wildcard
- Authorization header được phép
- Preflight OPTIONS hoạt động đúng
