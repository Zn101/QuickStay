# T120 – Test HTTP Error Handling (400, 404, 409)

**Ngày thực hiện:** 05/11/2026  
**Người thực hiện:** Minh  
**Môi trường:** Windows 11, JDK 17, Spring Boot 3.5.6, H2 in-memory, MockMvc  
**Lệnh chạy:** `cd backend && .\gradlew.bat cleanTest test --rerun-tasks`  
**Phụ thuộc:** T119 – `ApiExceptionHandler` (`@RestControllerAdvice`)

---

## 1. Tổng hợp kết quả

| Nhóm | Số TC | Đạt | Không đạt | Chưa thực hiện |
|------|-------|-----|-----------|----------------|
| Format JSON `{"message"}` | 4 | 4 | 0 | 0 |
| HTTP 400 – Bad Request | 6 | 6 | 0 | 0 |
| HTTP 404 – Not Found | 5 | 5 | 0 | 0 |
| HTTP 409 – Conflict | 5 | 5 | 0 | 0 |
| Không lộ thông tin nội bộ | 3 | 3 | 0 | 0 |
| **Tổng T120** | **23** | **23** | **0** | **0** |
| Toàn bộ backend | 175 | 175 | 0 | 0 |

**Kết quả:** ✅ **175/175 PASSED – BUILD SUCCESSFUL (44s)**

---

## 2. Trạng thái T119 – GlobalExceptionHandler

`ApiExceptionHandler.java` đã triển khai đầy đủ, xử lý:

| Exception | HTTP | Mô tả |
|-----------|------|-------|
| `ApiException` | theo status | Lỗi nghiệp vụ từ Service layer |
| `MethodArgumentNotValidException` | 400 | Jakarta Validation thất bại |
| `HttpMessageNotReadableException` | 400 | Body không parse được / sai JSON |
| `MethodArgumentTypeMismatchException` | 400 | Path/query param sai kiểu |
| `DataIntegrityViolationException` | 409 | Vi phạm FK/unique constraint DB |
| `ResponseStatusException` | theo status | Spring MVC chuẩn |
| `Exception` (catch-all) | 500 | Lỗi không mong đợi |

Format response thống nhất: `{"message": "..."}` — **một trường duy nhất, không có thêm trường nào khác**.

---

## 3. Chi tiết test cases

### Nhóm 1: Kiểm tra FORMAT JSON `{"message"}` xuyên suốt

| ID | Mã lỗi | Test case | Điều kiện đầu vào | Expected | HTTP | Trạng thái |
|----|--------|-----------|------------------|----------|------|------------|
| TC_EH001 | 400 | Validation error có trường `message` | POST /admin/hotels thiếu `name` | 400 + `{"message":"..."}` + Content-Type: JSON | 400 | Đạt |
| TC_EH002 | 400 | Malformed JSON có trường `message` | POST /admin/hotels body `{not valid` | 400 + `{"message":"..."}` | 400 | Đạt |
| TC_EH003 | 404 | Not Found có trường `message` | PUT /admin/hotels/999999 | 404 + `{"message":"..."}` | 404 | Đạt |
| TC_EH004 | 409 | Conflict có trường `message` | DELETE /admin/rooms/{id} có booking | 409 + `{"message":"..."}` | 409 | Đạt |

### Nhóm 2: HTTP 400 – Bad Request

| ID | Mã lỗi | Test case | Điều kiện đầu vào | Expected | HTTP | Trạng thái |
|----|--------|-----------|------------------|----------|------|------------|
| TC_EH005 | 400 | Đăng ký email sai định dạng | `email: "khong-phai-email"` | 400 + message | 400 | Đạt |
| TC_EH006 | 400 | Đăng ký mật khẩu quá ngắn | `password: "123"` | 400 + message | 400 | Đạt |
| TC_EH007 | 400 | Giá phòng âm | `pricePerNight: -100` | 400 + message | 400 | Đạt |
| TC_EH008 | 400 | Capacity = 0 | `capacity: 0` | 400 + message | 400 | Đạt |
| TC_EH009 | 400 | Enum BookingStatus không hợp lệ | `status: "INVALID_STATUS"` | 400 + message | 400 | Đạt |
| TC_EH010 | 400/401 | Login thiếu password | body chỉ có `email` | 400 hoặc 401 + message | 400/401 | Đạt |

### Nhóm 3: HTTP 404 – Not Found

| ID | Mã lỗi | Test case | Điều kiện đầu vào | Expected | HTTP | Trạng thái |
|----|--------|-----------|------------------|----------|------|------------|
| TC_EH011 | 404 | GET hotel không tồn tại | GET /api/hotels/999999 | 404 + message | 404 | Đạt |
| TC_EH012 | 404 | PUT room không tồn tại | PUT /admin/rooms/999999 | 404 + message | 404 | Đạt |
| TC_EH013 | 404 | PATCH booking status không tồn tại | PATCH /admin/bookings/999999/status | 404 + message | 404 | Đạt |
| TC_EH014 | 404 | DELETE hotel không tồn tại | DELETE /admin/hotels/999999 | 404 + message | 404 | Đạt |
| TC_EH015 | 404 | DELETE room không tồn tại | DELETE /admin/rooms/999999 | 404 + message | 404 | Đạt |

### Nhóm 4: HTTP 409 – Conflict + DB Integrity

| ID | Mã lỗi | Test case | Điều kiện đầu vào | Expected | DB sau 409 | HTTP | Trạng thái |
|----|--------|-----------|------------------|----------|------------|------|------------|
| TC_EH016 | 409 | Đăng ký email trùng | email đã tồn tại | 409 + message | Không thay đổi | 409 | Đạt |
| TC_EH017 | 409 | Xóa hotel có booking CONFIRMED | hotel có booking | 409 + message, hotel còn trong DB | existsById=true | 409 | Đạt |
| TC_EH018 | 409 | Xóa room có booking CONFIRMED | room có booking | 409 + message, room còn trong DB | existsById=true | 409 | Đạt |
| TC_EH019 | 409 | Chuyển PENDING→COMPLETED (bỏ bước) | booking PENDING | 409 + message, status vẫn PENDING | PENDING giữ nguyên | 409 | Đạt |
| TC_EH020 | 409 | Chuyển từ trạng thái kết thúc COMPLETED | booking COMPLETED | 409 + message | COMPLETED giữ nguyên | 409 | Đạt |

### Nhóm 5: Không lộ thông tin nội bộ

| ID | Mã lỗi | Test case | Điều kiện kiểm tra | Expected | Trạng thái |
|----|--------|-----------|-------------------|----------|------------|
| TC_EH021 | 400 | Response 400 không có stack trace | Kiểm tra body không chứa `at com.` | Body chỉ có 1 trường `message` | Đạt |
| TC_EH022 | 404 | Response 404 chỉ có `message` | Kiểm tra `node.size() == 1` | `{"message":"..."}` và không có trường thừa | Đạt |
| TC_EH023 | 409 | Response 409 chỉ có `message` | Kiểm tra `node.size() == 1` | `{"message":"..."}` và không có trường thừa | Đạt |

---

## 4. Kiểm tra GlobalExceptionHandler tổng hợp

| Tiêu chí | Kết quả |
|---------|---------|
| HTTP status chính xác | ✅ |
| Content-Type: application/json | ✅ |
| JSON có trường `message` | ✅ |
| `message` không null/rỗng | ✅ |
| Không có stack trace | ✅ |
| Không lộ secret/credentials | ✅ |
| Response chỉ có đúng 1 trường `message` | ✅ |
| DB không thay đổi khi request thất bại | ✅ |

---

## 5. Log minh chứng

```
Lệnh: .\gradlew.bat cleanTest test --rerun-tasks
Thời gian: 44s
Kết quả: BUILD SUCCESSFUL

com.quickstay.ErrorHandlingTest [tests=23 fail=0 err=0]
  PASSED TC_EH001_400_validation_error_has_message_field
  PASSED TC_EH002_400_malformed_json_has_message_field
  PASSED TC_EH003_404_not_found_has_message_field
  PASSED TC_EH004_409_conflict_has_message_field
  PASSED TC_EH005_400_register_invalid_email
  PASSED TC_EH006_400_register_short_password
  PASSED TC_EH007_400_room_negative_price
  PASSED TC_EH008_400_room_zero_capacity
  PASSED TC_EH009_400_invalid_booking_status_enum
  PASSED TC_EH010_400_login_missing_password
  PASSED TC_EH011_404_hotel_not_found
  PASSED TC_EH012_404_room_not_found_on_update
  PASSED TC_EH013_404_booking_not_found_on_status_change
  PASSED TC_EH014_404_hotel_not_found_on_delete
  PASSED TC_EH015_404_room_not_found_on_delete
  PASSED TC_EH016_409_duplicate_email_on_register
  PASSED TC_EH017_409_delete_hotel_with_booking_db_intact
  PASSED TC_EH018_409_delete_room_with_confirmed_booking_db_intact
  PASSED TC_EH019_409_invalid_status_transition_db_intact
  PASSED TC_EH020_409_terminal_state_cannot_transition
  PASSED TC_EH021_error_response_no_stack_trace_in_400
  PASSED TC_EH022_404_response_has_only_message_field
  PASSED TC_EH023_409_response_has_only_message_field

Tong toan bo backend: 175/175 PASSED
```

---

## 6. Bug phát hiện

**Không phát hiện bug nào.**

`ApiExceptionHandler` hoạt động đúng với tất cả trường hợp kiểm thử. Format `{"message":"..."}` nhất quán xuyên suốt 400, 404, 409.

---

## 7. Kết luận

**T120: ĐẠT** — GlobalExceptionHandler (T119) hoạt động đúng. 23/23 test cases mới đều pass. Toàn bộ 175/175 test backend không bị ảnh hưởng.
