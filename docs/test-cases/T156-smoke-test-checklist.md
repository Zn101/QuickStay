# T156 – Smoke Test Checklist

**Dự án:** QuickStay · **Người thực hiện:** Minh · **Ngày:** 11/11/2026

## Môi trường kiểm thử

| Thành phần | Giá trị |
|-----------|---------|
| Môi trường | Docker Compose trên máy Windows (Docker Desktop) |
| Backend | Spring Boot 3.5.6, port 8080 (container) |
| Frontend | Nginx + React, port 8081 (container) |
| MySQL | 8.4, port 3306 (container, không expose) |
| Container uptime | 36+ giờ |
| Dữ liệu | 4 khách sạn mẫu (seed data) |
| Tài khoản ADMIN | admin@quickstay.local / Admin@123 |
| Tài khoản CUSTOMER | smoke<timestamp>@example.com (tạo mới) |

---

## Danh sách test case

### Nhóm 1 – Truy cập hệ thống

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-01 | Backend health | Container chạy | `curl /actuator/health` | `{"status":"UP"}` | `{"status":"UP"}` | ✅ PASS |
| TC-02 | Frontend truy cập | Container chạy | `curl -I http://localhost:8081` | HTTP 200 | HTTP 200 | ✅ PASS |
| TC-03 | Nginx proxy API | Backend + Frontend chạy | `curl /api/hotels` qua Nginx | JSON array | 4 hotels | ✅ PASS |
| TC-04 | SPA fallback | Frontend chạy | `curl /some-random-page` | HTTP 200 (index.html) | HTTP 200 | ✅ PASS |

### Nhóm 2 – Đăng nhập và phân quyền

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-05 | Login ADMIN | Admin account tồn tại | `POST /api/auth/login` | 200 + token | token received | ✅ PASS |
| TC-09 | Register CUSTOMER | Email mới | `POST /api/auth/register` | 201 + token + role CUSTOMER | token + role CUSTOMER | ✅ PASS |
| TC-10 | Login CUSTOMER | Tài khoản vừa đăng ký | `POST /api/auth/login` | 200 + token | token received | ✅ PASS |
| TC-12 | CUSTOMER bị chặn Admin API | CUSTOMER token | `GET /api/admin/hotels` | 403 | 403 | ✅ PASS |
| TC-15 | Không token bị chặn | Không có Authorization | `GET /api/admin/hotels` | 401 | 401 | ✅ PASS |

### Nhóm 3 – Khách sạn và phòng

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-03 | Danh sách khách sạn | Có seed data | `GET /api/hotels` | JSON array ≥1 | 4 hotels | ✅ PASS |
| TC-17 | Chi tiết khách sạn | id=1 tồn tại | `GET /api/hotels/1` | JSON với name | "Sunrise Da Nang Hotel" | ✅ PASS |
| TC-18 | Hotel không tồn tại | id=99999 | `GET /api/hotels/99999` | 404 | 404 | ✅ PASS |
| TC-15 | Danh sách phòng | hotelId=1 có phòng | `GET /api/hotels/1/rooms` | JSON array ≥1 | 3 rooms | ✅ PASS |

### Nhóm 4 – Đặt phòng và lịch sử

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-13 | Đặt phòng | CUSTOMER token, phòng trống | `POST /api/bookings` | 201 + booking PENDING | booking #2, PENDING | ✅ PASS |
| TC-14 | Lịch sử booking | CUSTOMER có booking | `GET /api/bookings/me` | JSON array ≥1 | 1 booking | ✅ PASS |

### Nhóm 5 – Chức năng Admin

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-06 | Admin danh sách khách sạn | ADMIN token | `GET /api/admin/hotels` | 200 + array | 4 hotels | ✅ PASS |
| TC-07 | Admin danh sách phòng (filter) | ADMIN token, hotelId=1 | `GET /api/admin/rooms?hotelId=1` | 200 + array | 3 rooms | ✅ PASS |
| TC-08 | Admin danh sách booking | ADMIN token | `GET /api/admin/bookings` | 200 + array | 1 booking | ✅ PASS |

### Nhóm 6 – Hồ sơ người dùng

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-11 | Xem hồ sơ | CUSTOMER token | `GET /api/users/me` | JSON với email đúng | email khớp | ✅ PASS |

### Nhóm 7 – CORS

| ID | Tên | Tiền điều kiện | Bước thực hiện | Expected | Actual | Status |
|----|-----|---------------|--------------|----------|--------|--------|
| TC-16 | CORS preflight hợp lệ | Origin localhost:8081 | `OPTIONS /api/hotels` | ACAO = origin | http://localhost:8081 | ✅ PASS |

---

## Tổng kết

| Nhóm | Số TC | PASS | FAIL | BLOCKED |
|------|-------|------|------|---------|
| Truy cập hệ thống | 4 | 4 | 0 | 0 |
| Đăng nhập & phân quyền | 5 | 5 | 0 | 0 |
| Khách sạn & phòng | 4 | 4 | 0 | 0 |
| Đặt phòng & lịch sử | 2 | 2 | 0 | 0 |
| Chức năng Admin | 3 | 3 | 0 | 0 |
| Hồ sơ người dùng | 1 | 1 | 0 | 0 |
| CORS | 1 | 1 | 0 | 0 |
| **Tổng** | **20** | **20** | **0** | **0** |

**Kết quả: 20/20 PASS — Smoke Test ĐẠT**
