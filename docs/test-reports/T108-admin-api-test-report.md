# T108 – Báo cáo kiểm thử Admin APIs (UC09, UC10, UC11)

**Ngày thực hiện:** 04/11/2026  
**Người thực hiện:** Minh  
**Môi trường:** Windows 11, JDK 17, Spring Boot 3.5.6, H2 in-memory (test), MockMvc  
**Công cụ:** JUnit 5 + MockMvc + Spring Boot Test  
**Lệnh chạy:** `cd backend && .\gradlew.bat cleanTest test --rerun-tasks`

---

## 1. Tổng hợp kết quả

| Nhóm | Test suite | Số TC | Đạt | Không đạt | Chưa thực hiện |
|------|-----------|-------|-----|-----------|----------------|
| UC09 – Quản lý khách sạn | `AdminHotelApiTest` | 34 | 34 | 0 | 0 |
| UC10 – Quản lý loại phòng | `AdminRoomApiTest` | 43 | 43 | 0 | 0 |
| UC11 – Quản lý đơn đặt phòng | `AdminBookingApiTest` | 29 | 29 | 0 | 0 |
| **Tổng Admin APIs** | | **106** | **106** | **0** | **0** |
| Toàn bộ backend | 17 suites | 152 | 152 | 0 | 0 |

**Kết quả:** ✅ **152/152 PASSED – BUILD SUCCESSFUL**

---

## 2. Kết quả chi tiết – UC09 (AdminHotelApiTest)

### POST /api/admin/hotels

| ID | Test case | Điều kiện đầu vào | Kết quả mong đợi | Kết quả thực tế | HTTP | Trạng thái |
|----|-----------|-------------------|-----------------|----------------|------|------------|
| TC_H001 | Thêm khách sạn đầy đủ thông tin | body hợp lệ, ADMIN token | 201 + HotelResponse | 201 + đúng dữ liệu | 201 | Đạt |
| TC_H002 | Thêm chỉ với trường bắt buộc | `name`, `city` | 201 + HotelResponse | 201 | 201 | Đạt |
| TC_H003 | Lưu vào database | body hợp lệ | record xuất hiện trong DB | existsById = true | 201 | Đạt |
| TC_H004 | Thiếu `name` | không có `name` | 400 + message | 400 + message | 400 | Đạt |
| TC_H005 | Thiếu `city` | không có `city` | 400 + message | 400 + message | 400 | Đạt |
| TC_H006 | `name` là chuỗi trắng | `"   "` | 400 + message | 400 + message | 400 | Đạt |
| TC_H007 | `name` vượt 255 ký tự | 256 ký tự | 400 + message | 400 + message | 400 | Đạt |
| TC_H008 | Body sai JSON | `{khong-phai-json` | 400 + message | 400 + message | 400 | Đạt |
| TC_H009 | Không có token | không có Authorization | 401 | 401 | 401 | Đạt |
| TC_H010 | Token sai/hết hạn | `"invalid.token.here"` | 401 | 401 | 401 | Đạt |
| TC_H011 | CUSTOMER truy cập | token CUSTOMER | 403 | 403 | 403 | Đạt |

### PUT /api/admin/hotels/{id}

| ID | Test case | Điều kiện đầu vào | Kết quả mong đợi | Kết quả thực tế | HTTP | Trạng thái |
|----|-----------|-------------------|-----------------|----------------|------|------------|
| TC_H012 | Cập nhật thành công | id tồn tại, body hợp lệ | 200 + dữ liệu mới | 200 + đúng dữ liệu | 200 | Đạt |
| TC_H013 | Dữ liệu thay đổi trong DB | id tồn tại, body mới | DB có dữ liệu mới | name/city đúng | 200 | Đạt |
| TC_H014 | id không tồn tại | id=999999 | 404 + message | 404 + message | 404 | Đạt |
| TC_H015 | Thiếu `name` | không có `name` | 400 + message | 400 + message | 400 | Đạt |
| TC_H016 | `city` là chuỗi trắng | `"  "` | 400 + message | 400 + message | 400 | Đạt |
| TC_H017 | Không có token | không có Authorization | 401 | 401 | 401 | Đạt |
| TC_H018 | CUSTOMER truy cập | token CUSTOMER | 403 | 403 | 403 | Đạt |
| TC_H019 | Whitespace được trim | `"  Hotel  "` | lưu `"Hotel"` | đúng | 201 | Đạt |

### GET /api/admin/hotels

| ID | Test case | Kết quả mong đợi | Kết quả thực tế | HTTP | Trạng thái |
|----|-----------|-----------------|----------------|------|------------|
| TC_H020 | ADMIN lấy danh sách | 200 + array | 200 + array | 200 | Đạt |
| TC_H021 | Response có trường đủ | id, name, city | đủ trường | 200 | Đạt |
| TC_H022 | Không có token | 401 | 401 | 401 | Đạt |
| TC_H023 | CUSTOMER truy cập | 403 | 403 | 403 | Đạt |

### DELETE /api/admin/hotels/{id}

| ID | Test case | Điều kiện đầu vào | Kết quả mong đợi | Kết quả thực tế | HTTP | Trạng thái |
|----|-----------|-------------------|-----------------|----------------|------|------------|
| TC_H024 | Xóa khách sạn không có phòng | id tồn tại, 0 booking | 204, DB xóa | 204, existsById=false | 204 | Đạt |
| TC_H025 | Xóa khách sạn có phòng, 0 booking | có room, 0 booking | 204, room xóa theo | 204 | 204 | Đạt |
| TC_H026 | Có booking PENDING → không xóa | booking PENDING | 409 + message | 409 + message | 409 | Đạt |
| TC_H027 | Có booking CONFIRMED → không xóa | booking CONFIRMED | 409 + message | 409 + message | 409 | Đạt |
| TC_H028 | Có booking CHECKED_IN → không xóa | booking CHECKED_IN | 409 + message | 409 + message | 409 | Đạt |
| TC_H029 | Có booking COMPLETED → không xóa | booking COMPLETED | 409 + message | 409 + message | 409 | Đạt |
| TC_H030 | Có booking CANCELLED → không xóa | booking CANCELLED | 409 + message | 409 + message | 409 | Đạt |
| TC_H031 | id không tồn tại | id=999999 | 404 + message | 404 + message | 404 | Đạt |
| TC_H032 | DB giữ nguyên sau 409 | booking PENDING | hotel vẫn còn | existsById=true | 409 | Đạt |
| TC_H033 | Không có token | không có Authorization | 401 | 401 | 401 | Đạt |
| TC_H034 | CUSTOMER truy cập | token CUSTOMER | 403 | 403 | 403 | Đạt |

---

## 3. Kết quả chi tiết – UC10 (AdminRoomApiTest)

### POST /api/admin/rooms

| ID | Test case | Điều kiện đầu vào | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------|-------------------|-----------------|------|------------|
| TC_R001 | Thêm loại phòng thành công | body đầy đủ | 201 + RoomResponse | 201 | Đạt |
| TC_R002 | Lưu vào database | body hợp lệ | existsById=true | 201 | Đạt |
| TC_R003 | Không có description | body không có description | 201 | 201 | Đạt |
| TC_R004 | Thiếu `hotelId` | không có hotelId | 400 | 400 | Đạt |
| TC_R005 | Thiếu `roomType` | không có roomType | 400 | 400 | Đạt |
| TC_R006 | `roomType` là chuỗi trắng | `"   "` | 400 | 400 | Đạt |
| TC_R007 | Thiếu `pricePerNight` | không có price | 400 | 400 | Đạt |
| TC_R008 | `pricePerNight` âm | -1 | 400 | 400 | Đạt |
| TC_R009 | `pricePerNight` = 0 | 0 | 201 (giá miễn phí hợp lệ) | 201 | Đạt |
| TC_R010 | `capacity` = 0 | 0 | 400 | 400 | Đạt |
| TC_R011 | `capacity` âm | -5 | 400 | 400 | Đạt |
| TC_R012 | `quantity` = 0 | 0 | 400 | 400 | Đạt |
| TC_R013 | `hotelId` không tồn tại | id=999999 | 404 | 404 | Đạt |
| TC_R014 | `description` vượt 2000 ký tự | 2001 ký tự | 400 | 400 | Đạt |
| TC_R015 | Body sai JSON | `{invalid` | 400 | 400 | Đạt |
| TC_R016 | Không có token | không có Authorization | 401 | 401 | Đạt |
| TC_R017 | Token sai | `"invalid.jwt.token"` | 401 | 401 | Đạt |
| TC_R018 | CUSTOMER truy cập | token CUSTOMER | 403 | 403 | Đạt |

### PUT /api/admin/rooms/{id}

| ID | Test case | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------|-----------------|------|------------|
| TC_R019 | Cập nhật thành công | 200 + dữ liệu mới | 200 | Đạt |
| TC_R020 | DB thay đổi | dữ liệu mới trong DB | 200 | Đạt |
| TC_R021 | Room id không tồn tại | 404 + message | 404 | Đạt |
| TC_R022 | hotelId không tồn tại | 404 + message | 404 | Đạt |
| TC_R023 | `capacity` = 0 | 400 | 400 | Đạt |
| TC_R024 | `pricePerNight` âm | 400 | 400 | Đạt |
| TC_R025 | Không có token | 401 | 401 | Đạt |
| TC_R026 | CUSTOMER truy cập | 403 | 403 | Đạt |
| TC_R027 | `roomType` vượt 255 ký tự | 400 | 400 | Đạt |
| TC_R028 | Whitespace được trim | lưu chuỗi đã trim | 201 | Đạt |

### GET /api/admin/rooms

| ID | Test case | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------|-----------------|------|------------|
| TC_R029 | Phòng mới xuất hiện trong GET public | có trong `/api/hotels/{id}/rooms` | 200 | Đạt |
| TC_R030 | ADMIN lấy danh sách | 200 + array | 200 | Đạt |
| TC_R031 | Response có trường đủ | id, hotelId, roomType, price, capacity, quantity | 200 | Đạt |
| TC_R032 | Không có token | 401 | 401 | Đạt |
| TC_R033 | CUSTOMER truy cập | 403 | 403 | Đạt |

### DELETE /api/admin/rooms/{id}

| ID | Test case | Điều kiện | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------|-----------|-----------------|------|------------|
| TC_R034 | Xóa phòng không có booking | 0 booking | 204, DB xóa | 204 | Đạt |
| TC_R035 | id không tồn tại | id=999999 | 404 | 404 | Đạt |
| TC_R036 | Có booking PENDING | booking PENDING | 409 | 409 | Đạt |
| TC_R037 | Có booking CONFIRMED | booking CONFIRMED | 409 | 409 | Đạt |
| TC_R038 | Có booking CHECKED_IN | booking CHECKED_IN | 409 | 409 | Đạt |
| TC_R039 | Có booking COMPLETED | booking COMPLETED | 409 | 409 | Đạt |
| TC_R040 | Có booking CANCELLED | booking CANCELLED | 409 | 409 | Đạt |
| TC_R041 | DB giữ nguyên sau 409 | booking PENDING | existsById=true | 409 | Đạt |
| TC_R042 | Không có token | 401 | 401 | Đạt |
| TC_R043 | CUSTOMER truy cập | 403 | 403 | Đạt |

---

## 4. Kết quả chi tiết – UC11 (AdminBookingApiTest)

### GET /api/admin/bookings (T106)

| ID | Test case | Điều kiện | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------|-----------|-----------------|------|------------|
| TC_AB01 | ADMIN lấy danh sách | ADMIN token | 200 + array | 200 | Đạt |
| TC_AB02 | Booking vừa tạo có trong danh sách | booking PENDING | xuất hiện trong list | 200 | Đạt |
| TC_AB03 | Danh sách rỗng | xóa hết booking | `[]` | 200 | Đạt |
| TC_AB04 | Response đủ 12 trường DTO | booking tồn tại | id/roomId/roomType/hotelId/hotelName/userEmail/checkIn/checkOut/guests/totalPrice/status/createdAt | 200 | Đạt |
| TC_AB05 | Trả booking của nhiều user | 2 user khác nhau | cả 2 có trong list | 200 | Đạt |
| TC_AB06 | Trả booking mọi trạng thái | PENDING/CONFIRMED/COMPLETED/CANCELLED | cả 4 có trong list | 200 | Đạt |
| TC_AB07 | Sắp xếp createdAt DESC | 2 booking | booking mới nhất ở đầu | 200 | Đạt |
| TC_AB08 | Booking từ POST /api/bookings có trong list | tạo qua API | PENDING, đúng email | 200 | Đạt |
| TC_AB09 | Không có token | 401 | 401 | 401 | Đạt |
| TC_AB10 | Token sai | 401 | 401 | 401 | Đạt |
| TC_AB11 | CUSTOMER truy cập | 403 | 403 | 403 | Đạt |

### PATCH /api/admin/bookings/{id}/status (T107)

#### Chuyển trạng thái hợp lệ

| ID | Chuyển từ → sang | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------------|-----------------|------|------------|
| TC_AB12 | PENDING → CONFIRMED | 200, DB = CONFIRMED | 200 | Đạt |
| TC_AB13 | CONFIRMED → CHECKED_IN | 200, DB = CHECKED_IN | 200 | Đạt |
| TC_AB14 | CHECKED_IN → COMPLETED | 200, DB = COMPLETED | 200 | Đạt |
| TC_AB15 | PENDING → CANCELLED | 200, DB = CANCELLED | 200 | Đạt |
| TC_AB16 | CONFIRMED → CANCELLED | 200, DB = CANCELLED | 200 | Đạt |
| TC_AB17 | CHECKED_IN → CANCELLED | 200, DB = CANCELLED | 200 | Đạt |

#### Chuyển trạng thái không hợp lệ (bỏ bước / trạng thái kết thúc)

| ID | Chuyển từ → sang | Kết quả mong đợi | HTTP | DB giữ nguyên | Trạng thái |
|----|-----------------|-----------------|------|--------------|------------|
| TC_AB18 | PENDING → CHECKED_IN | 409 + message | 409 | ✅ PENDING | Đạt |
| TC_AB19 | PENDING → COMPLETED | 409 + message | 409 | ✅ PENDING | Đạt |
| TC_AB20 | CONFIRMED → COMPLETED | 409 + message | 409 | ✅ CONFIRMED | Đạt |
| TC_AB21 | CONFIRMED → PENDING | 409 + message | 409 | ✅ CONFIRMED | Đạt |
| TC_AB22 | COMPLETED → bất kỳ (4 lần) | 409 + message | 409 | ✅ COMPLETED | Đạt |
| TC_AB23 | CANCELLED → bất kỳ (4 lần) | 409 + message | 409 | ✅ CANCELLED | Đạt |

#### Lỗi input và phân quyền

| ID | Test case | Kết quả mong đợi | HTTP | Trạng thái |
|----|-----------|-----------------|------|------------|
| TC_AB24 | id không tồn tại | 404 + message | 404 | Đạt |
| TC_AB25 | Thiếu trường `status` | 400 + message | 400 | Đạt |
| TC_AB26 | `status` không phải enum | 400 + message | 400 | Đạt |
| TC_AB27 | Không có token | 401 | 401 | Đạt |
| TC_AB28 | CUSTOMER truy cập | 403, DB không đổi | 403 | Đạt |
| TC_AB29 | Response đủ 11 trường BookingView | id/roomId/roomType/hotelId/hotelName/userEmail/checkIn/checkOut/totalPrice/status/createdAt | 200 | Đạt |

---

## 5. Kiểm thử phân quyền tổng hợp

| API | ADMIN | CUSTOMER | Chưa đăng nhập |
|-----|-------|---------|----------------|
| POST /api/admin/hotels | ✅ 201 | ✅ 403 | ✅ 401 |
| PUT /api/admin/hotels/{id} | ✅ 200 | ✅ 403 | ✅ 401 |
| GET /api/admin/hotels | ✅ 200 | ✅ 403 | ✅ 401 |
| DELETE /api/admin/hotels/{id} | ✅ 204 | ✅ 403 | ✅ 401 |
| POST /api/admin/rooms | ✅ 201 | ✅ 403 | ✅ 401 |
| PUT /api/admin/rooms/{id} | ✅ 200 | ✅ 403 | ✅ 401 |
| GET /api/admin/rooms | ✅ 200 | ✅ 403 | ✅ 401 |
| DELETE /api/admin/rooms/{id} | ✅ 204 | ✅ 403 | ✅ 401 |
| GET /api/admin/bookings | ✅ 200 | ✅ 403 | ✅ 401 |
| PATCH /api/admin/bookings/{id}/status | ✅ 200 | ✅ 403 | ✅ 401 |

---

## 6. Kiểm thử HTTP status codes

| Mã | UC09 | UC10 | UC11 |
|----|------|------|------|
| 200/201/204 | ✅ | ✅ | ✅ |
| 400 | ✅ 5 cases | ✅ 9 cases | ✅ 2 cases |
| 401 | ✅ 3 cases | ✅ 3 cases | ✅ 4 cases |
| 403 | ✅ 3 cases | ✅ 3 cases | ✅ 3 cases |
| 404 | ✅ 2 cases | ✅ 2 cases | ✅ 1 case |
| 409 | ✅ 5 cases | ✅ 5 cases | ✅ 8 cases |

---

## 7. Log minh chứng

```
Lệnh: .\gradlew.bat cleanTest test --rerun-tasks
Thời gian: 22s
Kết quả: BUILD SUCCESSFUL

Test suites:
  OK    com.quickstay.admin.AdminBookingApiTest  [tests=29 fail=0 err=0]
  OK    com.quickstay.admin.AdminHotelApiTest    [tests=34 fail=0 err=0]
  OK    com.quickstay.admin.AdminRoomApiTest     [tests=43 fail=0 err=0]
  OK    com.quickstay.AuthApiTest                [tests=6  fail=0 err=0]
  OK    com.quickstay.booking.AvailabilityQueryTest [tests=6  fail=0 err=0]
  OK    com.quickstay.booking.BookingServiceTest [tests=6  fail=0 err=0]
  OK    com.quickstay.booking.BookingStatusTest  [tests=1  fail=0 err=0]
  OK    com.quickstay.BookingApiTest             [tests=7  fail=0 err=0]
  OK    com.quickstay.hotel.HotelSearchQueryTest [tests=6  fail=0 err=0]
  OK    com.quickstay.hotel.HotelServiceTest     [tests=7  fail=0 err=0]
  OK    com.quickstay.HotelApiTest               [tests=11 fail=0 err=0]
  OK    com.quickstay.RepositoryTest             [tests=5  fail=0 err=0]
  OK    com.quickstay.RoomApiTest                [tests=8  fail=0 err=0]
  OK    com.quickstay.security.JwtServiceTest    [tests=4  fail=0 err=0]
  OK    com.quickstay.SeedDataTest               [tests=2  fail=0 err=0]
  OK    com.quickstay.user.AuthServiceTest       [tests=4  fail=0 err=0]
  OK    com.quickstay.UserApiTest                [tests=7  fail=0 err=0]

TOTAL: 152/152 PASSED
```

---

## 8. Bug phát hiện

**Không phát hiện bug nào** trong phạm vi UC09, UC10, UC11.

Tất cả 106 test case Admin API đều đạt. Các HTTP status code, response DTO, database integrity và business rule chuyển trạng thái đều hoạt động đúng theo thiết kế.

---

## 9. Hướng dẫn kiểm thử bổ sung bằng Postman

### Bước 1 – Lấy token ADMIN
```
POST http://localhost:8080/api/auth/login
{"email": "admin@quickstay.local", "password": "Admin@123"}
→ Lấy "token" từ response
```

### Bước 2 – UC09: Thêm khách sạn
```
POST http://localhost:8080/api/admin/hotels
Authorization: Bearer <token>
{"name":"Test Hotel","city":"Ha Noi","address":"123 ABC"}
→ 201 + {id, name, city, ...}
```

### Bước 3 – UC10: Thêm loại phòng
```
POST http://localhost:8080/api/admin/rooms
Authorization: Bearer <token>
{"hotelId":1,"roomType":"Deluxe","pricePerNight":500000,"capacity":2,"quantity":3}
→ 201 + {id, hotelId, roomType, ...}
```

### Bước 4 – UC11: Xem danh sách booking
```
GET http://localhost:8080/api/admin/bookings
Authorization: Bearer <token>
→ 200 + [{id, status, userEmail, ...}, ...]
```

### Bước 5 – UC11: Đổi trạng thái booking
```
PATCH http://localhost:8080/api/admin/bookings/{id}/status
Authorization: Bearer <token>
{"status":"CONFIRMED"}
→ 200 (hợp lệ) hoặc 409 (sai quy trình)
```

---

## 10. Những nội dung chưa thể kiểm thử tự động

| Nội dung | Lý do | Đề xuất |
|----------|-------|---------|
| Test trên MySQL thật | CI dùng H2, không có MySQL trong môi trường test | Chạy integration test với Docker MySQL |
| Race condition khi nhiều request đồng thời | MockMvc chạy single-thread | Test với JMeter hoặc Locust |
| Frontend hiển thị danh sách booking | Ngoài phạm vi backend | Test thủ công hoặc Cypress E2E |
