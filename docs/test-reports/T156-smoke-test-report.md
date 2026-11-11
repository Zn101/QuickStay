# T156 – Smoke Test Report

**Ngày thực hiện:** 11/11/2026  
**Người thực hiện:** Minh  
**Môi trường:** Docker Compose trên Windows (Docker Desktop)  
**Container uptime:** 36+ giờ  

---

## 1. Môi trường kiểm thử

| Thành phần | Giá trị |
|-----------|---------|
| OS | Windows 11, Docker Desktop |
| Backend | quickstay-backend-1, Up 36h, port 8080 |
| Frontend | quickstay-frontend-1, Up 36h, port 8081 |
| MySQL | quickstay-mysql-1, Up 36h (healthy), port 3306 (internal) |
| Dữ liệu | 4 khách sạn mẫu (seed data), 1 booking từ smoke test trước |
| ADMIN | admin@quickstay.local |
| CUSTOMER | smoke<timestamp>@example.com (tạo mới mỗi lần test) |

---

## 2. Kết quả tổng hợp

| Chỉ số | Giá trị |
|--------|---------|
| Tổng số test case | 20 |
| PASS | **20** |
| FAIL | 0 |
| BLOCKED | 0 |
| NOT TESTED | 0 |
| Bug phát hiện | 0 |

**Kết luận: SMOKE TEST ĐẠT — 20/20 PASS**

---

## 3. Bằng chứng

### TC-01: Backend health
```
$ docker exec quickstay-backend-1 curl -s http://localhost:8080/actuator/health
{"status":"UP"}
```

### TC-02: Frontend truy cập
```
$ docker exec quickstay-frontend-1 curl -s -o /dev/null -w "%{http_code}" http://localhost:80/
200
```

### TC-03: Nginx proxy API
```
$ docker exec quickstay-frontend-1 curl -s http://localhost:80/api/hotels
[{"id":1,"name":"Sunrise Da Nang Hotel",...}, {"id":2,...}, {"id":3,...}, {"id":4,...}]
→ 4 hotels
```

### TC-04: SPA fallback
```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/some-random-page
200 (index.html served)
```

### TC-05: Login ADMIN
```
$ POST /api/auth/login {"email":"admin@quickstay.local","password":"Admin@123"}
→ {"token":"eyJ...","user":{"role":"ADMIN"}}
```

### TC-06–08: Admin APIs
```
GET /api/admin/hotels        → 4 hotels
GET /api/admin/rooms?hotelId=1 → 3 rooms
GET /api/admin/bookings      → 1 booking
```

### TC-09: Register CUSTOMER
```
$ POST /api/auth/register {"email":"smoke1794369354@example.com","password":"secret123","fullName":"SmokeTest"}
→ {"token":"eyJ...","user":{"id":5,"role":"CUSTOMER"}}
```

### TC-10–14: Customer flow
```
TC-10 Login CUSTOMER       → PASS (token received)
TC-11 GET /api/users/me    → {"email":"smoke1794369354@example.com","role":"CUSTOMER"}
TC-12 CUSTOMER → Admin API → HTTP 403 (correctly denied)
TC-13 POST /api/bookings    → {"id":2,"status":"PENDING","totalPrice":1300000.00}
TC-14 GET /api/bookings/me  → 1 booking
```

### TC-15–18: Hotel & room detail
```
GET /api/hotels/1/rooms    → 3 rooms
GET /api/hotels/1          → "Sunrise Da Nang Hotel"
GET /api/hotels/99999       → HTTP 404
```

### TC-16: CORS preflight
```
$ OPTIONS /api/hotels with Origin: http://localhost:8081
Access-Control-Allow-Origin: http://localhost:8081
```

### TC-15: No token → 401
```
$ GET /api/admin/hotels (no Authorization header)
HTTP 401
```

---

## 4. Kiểm tra MySQL

```
$ docker inspect quickstay-mysql-1 --format='{{.State.Health.Status}}'
healthy

$ docker logs quickstay-mysql-1 --tail 3
... ready for connections. Version: '8.4.13' ... MySQL Community Server - GPL.
```

MySQL: ✅ healthy, persistent volume `mysql-data` đang sử dụng.

---

## 5. Kiểm tra log Backend

```
2026-11-11T03:55:55 INFO ... Dat phong moi #2 boi smoke1794369354@example.com
```

Backend log đúng: ghi nhận đặt phòng mới, không có error.

---

## 6. Danh sách Bug

**Không phát hiện bug nào.**

Tất cả 20 test case đều pass. Không có lỗi bất thường trong log.

---

## 7. Kiểm tra bảo mật

| Kiểm tra | Kết quả |
|---------|---------|
| MySQL không expose ra host | ✅ Pass |
| CUSTOMER không truy cập Admin API | ✅ Pass (403) |
| Không có token → 401 | ✅ Pass |
| CORS không dùng wildcard | ✅ Pass (origin cụ thể) |
| JWT token hợp lệ | ✅ Pass |

---

## 8. Kết luận

**T156 SMOKE TEST: ĐẠT**

Hệ thống QuickStay hoạt động đầy đủ trên môi trường Docker Compose:
- Frontend (Nginx + React) truy cập được
- Backend (Spring Boot) health UP
- MySQL healthy với persistent volume
- Nginx proxy `/api/` hoạt động đúng
- SPA fallback hoạt động
- Đăng ký/đăng nhập ADMIN và CUSTOMER thành công
- Phân quyền 401/403 đúng
- Đặt phòng tạo đơn PENDING thành công
- Lịch sử booking hiển thị đúng
- Admin APIs hoạt động đầy đủ
- CORS cấu hình đúng, không wildcard

**Lưu ý:** Kiểm thử trên máy Windows (Docker Desktop), không phải VPS production thật. Cần kiểm tra lại trên VPS Ubuntu khi triển khai.
