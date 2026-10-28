# QuickStay – Tài liệu API

Phiên bản 1.0 · 26/10/2026 · Nhóm 05. Các ví dụ phản hồi lấy từ backend đang chạy với dữ liệu mẫu.

## 1. Quy ước chung

- **Địa chỉ gốc:** `http://localhost:8081/api` khi chạy bằng Docker Compose (Nginx chuyển tiếp `/api` sang backend). Khi chạy riêng backend: `http://localhost:8080/api`.
- **Định dạng:** JSON, mã hóa UTF-8, `Content-Type: application/json` với request có body.
- **Xác thực:** gửi `Authorization: Bearer <token>`. Token lấy từ `/auth/register` hoặc `/auth/login`, ký HS384, chứa email (`sub`) và vai trò (`role`), hết hạn sau 1440 phút (đặt bằng `JWT_EXPIRATION_MINUTES`).
- **Ngày:** `yyyy-MM-dd`. **Thời điểm:** ISO-8601 UTC. **Tiền:** số thập phân, đơn vị VND.
- **Phân quyền:**

| Ký hiệu | Ý nghĩa |
|---|---|
| Công khai | Không cần token |
| Đăng nhập | Cần token hợp lệ (CUSTOMER hoặc ADMIN) |
| CUSTOMER | Chỉ tài khoản vai trò CUSTOMER |
| ADMIN | Chỉ tài khoản vai trò ADMIN |

## 2. Định dạng lỗi

Mọi lỗi do ứng dụng xử lý trả về:

```json
{ "message": "Email da duoc su dung" }
```

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu sai định dạng hoặc vi phạm ràng buộc (thiếu trường, ngày không hợp lệ, vượt số khách) |
| 401 | Thiếu, sai hoặc hết hạn token; đăng nhập sai |
| 403 | Đã đăng nhập nhưng không đủ quyền (ví dụ khách gọi API admin, admin đặt phòng, khách hủy đơn của người khác) |
| 404 | Không tìm thấy khách sạn, phòng hoặc đơn |
| 409 | Xung đột: email trùng, hết phòng, đổi trạng thái không hợp lệ, xóa dữ liệu đã có đơn đặt phòng |
| 500 | Lỗi hệ thống (chi tiết ghi trong log, không trả ra ngoài) |

Lưu ý: lỗi 400 do kiểm tra dữ liệu có dạng `"<trường>: <lý do>; ..."`, một số lý do là thông báo mặc định tiếng Anh. Thông báo tiếng Việt hiện không có dấu.

## 3. Tổng hợp endpoint

| Method | Đường dẫn | Quyền | Chức năng |
|---|---|---|---|
| POST | `/auth/register` | Công khai | Đăng ký tài khoản CUSTOMER |
| POST | `/auth/login` | Công khai | Đăng nhập |
| GET | `/users/me` | Đăng nhập | Xem hồ sơ |
| PUT | `/users/me` | Đăng nhập | Cập nhật hồ sơ |
| GET | `/hotels` | Công khai | Danh sách, tìm kiếm, lọc khách sạn |
| GET | `/hotels/{id}` | Công khai | Chi tiết khách sạn |
| GET | `/hotels/{id}/rooms` | Công khai | Phòng của khách sạn, kèm số phòng trống theo ngày |
| POST | `/bookings` | CUSTOMER | Đặt phòng |
| GET | `/bookings/me` | Đăng nhập | Lịch sử đặt phòng của tôi |
| PATCH | `/bookings/{id}/cancel` | Đăng nhập (chủ đơn) | Hủy đơn đang `PENDING` |
| GET | `/admin/hotels` | ADMIN | Danh sách khách sạn |
| POST | `/admin/hotels` | ADMIN | Tạo khách sạn |
| PUT | `/admin/hotels/{id}` | ADMIN | Sửa khách sạn |
| DELETE | `/admin/hotels/{id}` | ADMIN | Xóa khách sạn |
| GET | `/admin/rooms` | ADMIN | Danh sách loại phòng (lọc theo `hotelId`) |
| POST | `/admin/rooms` | ADMIN | Tạo loại phòng |
| PUT | `/admin/rooms/{id}` | ADMIN | Sửa loại phòng |
| DELETE | `/admin/rooms/{id}` | ADMIN | Xóa loại phòng |
| GET | `/admin/bookings` | ADMIN | Toàn bộ đơn đặt phòng |
| PATCH | `/admin/bookings/{id}/status` | ADMIN | Đổi trạng thái đơn |
| POST | `/ai/describe` | ADMIN | Sinh mô tả bằng AI |
| POST | `/ai/chat` | Công khai | Chatbot hỏi đáp |
| GET | `/actuator/health` | Công khai | Kiểm tra sức khỏe (nằm ngoài `/api`) |

## 4. Xác thực và hồ sơ

### POST `/auth/register`

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| email | string | có | Đúng định dạng email; không phân biệt hoa thường |
| password | string | có | Tối thiểu 6 ký tự |
| fullName | string | có | Không rỗng |
| phone | string | không | |

```json
{ "email": "mau@test.com", "password": "secret123", "fullName": "Nguyen Van A", "phone": "0912345678" }
```

**201 Created**

```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "user": { "id": 2, "email": "mau@test.com", "fullName": "Nguyen Van A", "phone": "0912345678", "role": "CUSTOMER" }
}
```

Lỗi: 400 dữ liệu không hợp lệ; 409 `Email da duoc su dung`.

### POST `/auth/login`

Body: `{ "email": "...", "password": "..." }`. **200 OK** trả về cùng dạng như đăng ký. Sai email hoặc mật khẩu: 401 `Sai email hoac mat khau`.

### GET `/users/me`

**200 OK**

```json
{ "id": 2, "email": "mau@test.com", "fullName": "Nguyen Van A", "phone": "0912345678", "role": "CUSTOMER" }
```

### PUT `/users/me`

Mọi trường đều tùy chọn. Trường không gửi thì giữ nguyên; riêng `phone` gửi chuỗi rỗng sẽ xóa số hiện có, còn `fullName`, `email`, `password` rỗng thì bị bỏ qua.

| Trường | Ràng buộc |
|---|---|
| fullName | Không rỗng thì cập nhật |
| phone | |
| email | Đúng định dạng; 409 nếu đã có người dùng |
| password | Tối thiểu 6 ký tự; được mã hóa BCrypt trước khi lưu |

**200 OK** trả về hồ sơ sau cập nhật. Lưu ý: nếu đổi email, token cũ vẫn mang email cũ, nên cần đăng nhập lại.

## 5. Khách sạn và phòng (công khai)

### GET `/hotels`

| Tham số | Mô tả |
|---|---|
| `q` | Từ khóa, khớp một phần với tên hoặc thành phố, không phân biệt hoa thường |
| `city` | Khớp một phần với thành phố |
| `roomType` | Loại phòng, khớp chính xác không phân biệt hoa thường |
| `minPrice`, `maxPrice` | Khoảng giá một đêm (VND) |

Khi có `roomType`, `minPrice` hoặc `maxPrice`, chỉ trả về khách sạn có ít nhất một loại phòng phù hợp; `minPrice` trong kết quả là giá thấp nhất trong các phòng phù hợp. Không phân trang.

`GET /hotels?q=sunrise` → **200 OK**

```json
[
  {
    "id": 1,
    "name": "Sunrise Da Nang Hotel",
    "city": "Da Nang",
    "address": "12 Vo Nguyen Giap, Son Tra",
    "description": "Khach san gan bien My Khe, phu hop nghi duong gia dinh va cong tac.",
    "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "amenities": "Ho boi, Wifi mien phi, An sang, Gan bien",
    "minPrice": 650000.00
  }
]
```

### GET `/hotels/{id}`

**200 OK**: một đối tượng như phần tử ở trên. 404 nếu không có.

### GET `/hotels/{id}/rooms`

| Tham số | Mô tả |
|---|---|
| `checkIn`, `checkOut` | Cùng có hoặc cùng không. Nếu có, mỗi phòng kèm `available` = số phòng còn trống trong `[checkIn, checkOut)`. `checkOut` phải sau `checkIn` |

`GET /hotels/1/rooms?checkIn=2026-12-01&checkOut=2026-12-03` → **200 OK**

```json
[
  { "id": 1, "hotelId": 1, "roomType": "Standard", "pricePerNight": 650000.00, "capacity": 2, "quantity": 5,
    "description": "Phong Standard tai Sunrise Da Nang Hotel", "available": 5 }
]
```

Không có ngày thì `available` là `null`. Lỗi: 400 nếu chỉ gửi một ngày hoặc `checkOut` ≤ `checkIn`; 404 nếu khách sạn không tồn tại. Kết quả sắp theo giá tăng dần.

## 6. Đặt phòng

### POST `/bookings` (CUSTOMER)

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| roomId | number | có | Phải tồn tại (404 nếu không) |
| checkIn | date | có | Không ở quá khứ |
| checkOut | date | có | Sau `checkIn` |
| guests | number | có | ≥ 1 và ≤ `capacity` của phòng |
| guestName | string | có | Không rỗng |
| guestPhone | string | có | Không rỗng |
| note | string | không | |

```json
{ "roomId": 1, "checkIn": "2026-12-01", "checkOut": "2026-12-03", "guests": 2,
  "guestName": "Nguyen Van A", "guestPhone": "0912345678", "note": "Tang cao" }
```

**201 Created**

```json
{
  "id": 1, "roomId": 1, "roomType": "Standard", "hotelId": 1, "hotelName": "Sunrise Da Nang Hotel",
  "userEmail": "mau@test.com", "checkIn": "2026-12-01", "checkOut": "2026-12-03", "guests": 2,
  "guestName": "Nguyen Van A", "guestPhone": "0912345678", "note": "Tang cao",
  "totalPrice": 1300000.00, "status": "PENDING", "createdAt": "2026-10-26T05:48:35.414385Z"
}
```

`totalPrice` = `pricePerNight` × số đêm. Việc kiểm tra phòng trống và ghi đơn nằm trong một transaction có khóa bản ghi phòng.

Lỗi: 400 (ngày sai, ngày quá khứ, `Phong chi chua toi da 2 khach`); 403 nếu là admin; 404 phòng không tồn tại; 409 `Phong da het trong khoang ngay da chon`.

### GET `/bookings/me`

**200 OK**: mảng đơn của người đăng nhập, mới nhất trước, mỗi phần tử có dạng như trên.

### PATCH `/bookings/{id}/cancel`

Không có body. **200 OK** trả về đơn với `status: "CANCELLED"`. Lỗi: 403 nếu không phải đơn của mình; 404 nếu không có; 409 `Chi huy duoc dat phong dang cho xac nhan (PENDING)` nếu đơn không còn `PENDING`.

## 7. Quản trị (ADMIN)

### Khách sạn

`POST /admin/hotels` và `PUT /admin/hotels/{id}` nhận cùng một body:

| Trường | Bắt buộc |
|---|---|
| name | có |
| city | có |
| address, description, imageUrl, amenities | không |

`GET /admin/hotels` trả mảng khách sạn như `/hotels`. `POST` trả **201**, `PUT` trả **200**, `DELETE` trả **204 No Content**. `DELETE` trả 409 `Khach san da co dat phong, khong the xoa` nếu một phòng của khách sạn đã có đơn.

### Loại phòng

`POST /admin/rooms` và `PUT /admin/rooms/{id}` nhận cùng một body:

| Trường | Bắt buộc | Ràng buộc |
|---|---|---|
| hotelId | có | Khách sạn phải tồn tại (404) |
| roomType | có | Không rỗng |
| pricePerNight | có | ≥ 0 |
| capacity | có | ≥ 1 |
| quantity | có | ≥ 1 |
| description | không | |

`GET /admin/rooms?hotelId=1` trả mảng phòng (`available` luôn `null`); bỏ `hotelId` để lấy tất cả. `POST` trả **201**, `PUT` trả **200**, `DELETE` trả **204**; xóa phòng đã có đơn trả 409 `Phong da co dat phong, khong the xoa`.

### Đơn đặt phòng

`GET /admin/bookings` trả toàn bộ đơn, mới nhất trước.

`PATCH /admin/bookings/{id}/status`

```json
{ "status": "CONFIRMED" }
```

`status` nhận một trong `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, nhưng chỉ được các bước sau (xem sơ đồ ở `QuickStay-ERD.md`):

| Từ | Sang |
|---|---|
| PENDING | CONFIRMED, CANCELLED |
| CONFIRMED | CHECKED_IN, CANCELLED |
| CHECKED_IN | COMPLETED, CANCELLED |
| COMPLETED, CANCELLED | (không đi tiếp) |

**200 OK** trả về đơn sau cập nhật. Bước không hợp lệ: 409 `Khong the chuyen trang thai PENDING -> COMPLETED`.

## 8. AI

### POST `/ai/describe` (ADMIN)

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| type | không | `hotel` (mặc định) hoặc `room` |
| name | có | Tên khách sạn |
| city | không | Thành phố |
| amenities | không | Tiện nghi, cách nhau bằng dấu phẩy |
| roomType | không | Tên loại phòng, dùng khi `type` = `room` |

**200 OK**: `{ "description": "..." }`. Nếu cấu hình `ANTHROPIC_API_KEY`, nội dung do Chat Model sinh (60–90 từ, chuẩn SEO). Nếu không có khóa hoặc dịch vụ lỗi, hệ thống trả mô tả dự phòng dựng từ tên, thành phố và tiện nghi, nên API luôn có kết quả.

### POST `/ai/chat` (công khai)

Body: `{ "message": "Khach san o Hoi An?" }`. `message` không rỗng, tối đa 1000 ký tự.

**200 OK**

```json
{ "reply": "Hoi An Riverside Homestay (Hoi An) - tien nghi: Wifi mien phi, Cho thue xe dap, An sang, Ban cong view song. Phong: Standard 520.000 VND/dem; Family Suite 1.100.000 VND/dem." }
```

Chatbot chỉ trả lời dựa trên dữ liệu khách sạn và phòng trong cơ sở dữ liệu. Khi không có khóa API hoặc dịch vụ lỗi, hệ thống trả lời theo từ khóa tên khách sạn hoặc thành phố.

## 9. Tài khoản và dữ liệu mẫu

Lần chạy đầu với cơ sở dữ liệu trống, hệ thống tạo:

- Tài khoản admin: email `admin@quickstay.local`, mật khẩu `Admin@123` (đổi bằng biến môi trường `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- 4 khách sạn mẫu (Đà Nẵng, Hà Nội, TP. Hồ Chí Minh, Hội An) với 2–3 loại phòng mỗi nơi.

## 10. CORS

Chỉ các nguồn trong biến `CORS_ORIGINS` (mặc định `http://localhost:5173`, `http://localhost:8081`) được gọi `/api/**` từ trình duyệt. Phương thức cho phép: GET, POST, PUT, PATCH, DELETE, OPTIONS; header cho phép: `Authorization`, `Content-Type`.
