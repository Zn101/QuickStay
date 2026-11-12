# T133 – Admin Bug Fix Report

**Ngày thực hiện:** 06/11/2026  
**Người thực hiện:** Minh  
**Môi trường:** Windows 11, JDK 17, Spring Boot 3.5.6, H2 in-memory, MockMvc  
**Lệnh chạy:** `cd backend && .\gradlew.bat cleanTest test --rerun-tasks`

---

## 1. Tổng hợp

| Bug ID | Tên | Mức độ | Trạng thái |
|--------|-----|--------|-----------|
| BUG-01 | `GET /admin/rooms` không hỗ trợ filter `?hotelId=` | Medium | ✅ Đã sửa |
| BUG-02 | DELETE hotel 409 message sai với API contract | Low | ✅ Đã sửa |

**Kết quả test: 260/260 PASSED – BUILD SUCCESSFUL**

---

## 2. Chi tiết từng Bug

### BUG-01 – GET /admin/rooms thiếu filter hotelId

**Nguyên nhân gốc:**  
API contract (`QuickStay-API.md`) quy định `GET /admin/rooms?hotelId=1` lọc theo khách sạn. Controller không nhận `hotelId` query parameter, service chỉ có `list()` trả tất cả phòng.

**Cách sửa:**

`RoomAdminController.java`:
```java
// Trước
public List<RoomResponse> list() { ... }

// Sau
public List<RoomResponse> list(@RequestParam(required = false) Long hotelId) { ... }
```

`RoomAdminService.java`:
```java
// Trước
public List<RoomResponse> list() { return roomRepository.findAll()... }

// Sau
public List<RoomResponse> list(Long hotelId) {
    if (hotelId != null) {
        return roomRepository.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId)...
    }
    return roomRepository.findAll()...
}
```

Tái sử dụng `findByHotelIdOrderByPricePerNightAscIdAsc()` đã có trong `RoomRepository` — không tạo method mới.

---

### BUG-02 – DELETE hotel 409 message sai

**Nguyên nhân gốc:**  
Message trong `HotelAdminService.delete()` là `"Khong the xoa khach san dang co or da tung co don dat phong"` — không khớp với API contract quy định `"Khach san da co dat phong, khong the xoa"`.

**Cách sửa:**

`HotelAdminService.java`:
```java
// Trước
throw ApiException.conflict("Khong the xoa khach san dang co or da tung co don dat phong");

// Sau
throw ApiException.conflict("Khach san da co dat phong, khong the xoa");
```

---

## 3. Files đã thay đổi

| File | Thay đổi |
|------|---------|
| `admin/RoomAdminController.java` | Thêm `@RequestParam(required=false) Long hotelId` vào `list()` |
| `admin/RoomAdminService.java` | Thêm overload `list(Long hotelId)` với filter |
| `admin/HotelAdminService.java` | Sửa message 409 thành `"Khach san da co dat phong, khong the xoa"` |
| `test/admin/AdminRoomApiTest.java` | Thêm TC_R044, TC_R045, TC_R046, TC_R047 |
| `test/admin/AdminHotelApiTest.java` | Thêm TC_H035 |

---

## 4. Test cases đã bổ sung

| Test ID | Nội dung | Expected | HTTP | Kết quả |
|---------|---------|----------|------|---------|
| TC_R044 | GET /admin/rooms?hotelId={id} – lọc đúng hotel | Chỉ phòng của hotel đó, không có phòng hotel khác | 200 | ✅ Pass |
| TC_R045 | GET /admin/rooms?hotelId=999999 – hotel không tồn tại | 200 + `[]` | 200 | ✅ Pass |
| TC_R046 | GET /admin/rooms (không có hotelId) – trả tất cả | ≥ 1 phòng | 200 | ✅ Pass |
| TC_R047 | GET /admin/rooms?hotelId=x + CUSTOMER token | 403 | 403 | ✅ Pass |
| TC_H035 | DELETE hotel có booking – 409 message đúng contract | `{"message":"Khach san da co dat phong, khong the xoa"}` | 409 | ✅ Pass |

---

## 5. Kết quả chạy test

```
AdminHotelApiTest:  35/35 PASSED  (+1 test case mới)
AdminRoomApiTest:   47/47 PASSED  (+4 test cases mới)
Tất cả suites khác: 178/178 PASSED (không regression)
TỔNG: 260/260 PASSED
BUILD SUCCESSFUL (26s)
```

---

## 6. Hướng dẫn kiểm tra lại

**BUG-01:**
```bash
# Lay token ADMIN
POST http://localhost:8080/api/auth/login
{"email":"admin@quickstay.local","password":"Admin@123"}

# Loc phong theo hotel
GET http://localhost:8080/api/admin/rooms?hotelId=1
Authorization: Bearer <token>
→ 200 OK + chỉ phòng của hotel 1

# Hotel không tồn tại
GET http://localhost:8080/api/admin/rooms?hotelId=999999
→ 200 OK + []

# Không filter
GET http://localhost:8080/api/admin/rooms
→ 200 OK + tất cả phòng
```

**BUG-02:**
```bash
DELETE http://localhost:8080/api/admin/hotels/{id-co-booking}
Authorization: Bearer <token>
→ 409 + {"message":"Khach san da co dat phong, khong the xoa"}
```
