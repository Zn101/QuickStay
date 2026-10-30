# QuickStay SRS — Bổ sung mục 3.9–3.11 (UC09, UC10, UC11)

> Phiên bản 1.1 · Thêm mới · 30/10/2026 · Người thực hiện: Minh (T057)  
> Nguồn đối chiếu: `AdminController.java`, `BookingService.java`, `HotelService.java`, `QuickStay-API.md`, `QuickStay-ERD.md`

---

## 3.9 UC09 — Quản lý trạng thái đơn đặt phòng (Admin)

### Tổng quan

| Trường | Nội dung |
|---|---|
| **Mã use case** | UC09 |
| **Tên** | Quản lý trạng thái đơn đặt phòng |
| **Tác nhân chính** | Admin |
| **Mục tiêu** | Admin xem toàn bộ đơn đặt phòng trong hệ thống và cập nhật trạng thái đơn theo vòng đời hợp lệ |
| **Phạm vi** | Hệ thống QuickStay — Backend + Admin Dashboard |
| **Mức độ** | Sea level (chức năng cụ thể) |

### Tiền điều kiện

1. Admin đã đăng nhập và có JWT hợp lệ với `role = ADMIN`.
2. Có ít nhất một đơn đặt phòng tồn tại trong hệ thống.

### Luồng chính — Xem danh sách đơn

1. Admin gửi `GET /api/admin/bookings` với token ADMIN.
2. Hệ thống trả về danh sách tất cả đơn đặt phòng (không phân trang ở phiên bản hiện tại), mỗi đơn gồm: id, khách sạn, loại phòng, khách đặt, ngày check-in/out, số khách, tổng tiền và trạng thái.
3. Admin đọc thông tin và chọn đơn cần xử lý.

### Luồng chính — Cập nhật trạng thái

1. Admin gửi `PATCH /api/admin/bookings/{id}/status` với body `{"status": "<trạng thái mới>"}`.
2. Hệ thống kiểm tra đơn tồn tại.
3. Hệ thống xác nhận chuyển trạng thái hợp lệ theo vòng đời:

```
PENDING → CONFIRMED | CANCELLED
CONFIRMED → CHECKED_IN | CANCELLED
CHECKED_IN → COMPLETED | CANCELLED
COMPLETED → (kết thúc)
CANCELLED → (kết thúc)
```

4. Hệ thống lưu trạng thái mới và trả về bản ghi đơn đã cập nhật (200 OK).

### Luồng thay thế / Ngoại lệ

| Trường hợp | Phản hồi hệ thống |
|---|---|
| `id` không tồn tại | 404 `{"message":"Khong tim thay don dat phong"}` |
| Chuyển trạng thái không hợp lệ (ví dụ `COMPLETED → CONFIRMED`) | 409 `{"message":"Trang thai khong hop le..."}` |
| Token không phải ADMIN | 403 `{"message":"Ban khong co quyen truy cap"}` |
| Không có token | 401 `{"message":"Chua xac thuc hoac token khong hop le"}` |
| `status` truyền vào không nằm trong enum | 400 `{"message":"Du lieu gui len khong dung dinh dang"}` |

### Hậu điều kiện

- Trạng thái đơn được cập nhật trong cơ sở dữ liệu.
- Khách hàng có thể thấy trạng thái mới khi xem lịch sử đặt phòng (`GET /api/bookings/me`).

### Ghi chú

- Chỉ Admin mới thực hiện được. Khách hàng chỉ tự hủy đơn ở trạng thái `PENDING` qua `PATCH /api/bookings/{id}/cancel`.
- `COMPLETED` và `CANCELLED` là trạng thái cuối, không thể chuyển tiếp.

---

## 3.10 UC10 — Quản lý khách sạn và phòng (Admin)

### Tổng quan

| Trường | Nội dung |
|---|---|
| **Mã use case** | UC10 |
| **Tên** | Quản lý khách sạn và loại phòng |
| **Tác nhân chính** | Admin |
| **Mục tiêu** | Admin tạo, cập nhật và xóa thông tin khách sạn và các loại phòng để khách hàng có thể tìm kiếm và đặt phòng |
| **Phạm vi** | Hệ thống QuickStay — Backend + Admin Dashboard |
| **Mức độ** | Sea level |

### Tiền điều kiện

1. Admin đã đăng nhập với JWT hợp lệ (`role = ADMIN`).
2. (Với thao tác cập nhật/xóa) Khách sạn hoặc loại phòng đã tồn tại.

### Luồng chính — Tạo khách sạn

1. Admin gửi `POST /api/admin/hotels` với body gồm `name` (bắt buộc) và `city` (bắt buộc), tùy chọn `address`, `description`, `imageUrl`, `amenities`.
2. Hệ thống tạo bản ghi khách sạn mới và trả về thông tin khách sạn (201 Created).

### Luồng chính — Cập nhật khách sạn

1. Admin gửi `PUT /api/admin/hotels/{id}` với toàn bộ thông tin khách sạn cần cập nhật.
2. Hệ thống tìm khách sạn theo `id`, cập nhật và trả về thông tin mới (200 OK).

### Luồng chính — Xóa khách sạn

1. Admin gửi `DELETE /api/admin/hotels/{id}`.
2. Hệ thống kiểm tra không có loại phòng nào của khách sạn đang có đơn đặt phòng.
3. Hệ thống xóa khách sạn cùng tất cả loại phòng thuộc nó (204 No Content).

### Luồng chính — Tạo / cập nhật / xóa loại phòng

| Thao tác | Endpoint | Ghi chú |
|---|---|---|
| Tạo | `POST /api/admin/rooms` | Cần `hotelId`, `roomType`, `pricePerNight`, `capacity`, `quantity` |
| Cập nhật | `PUT /api/admin/rooms/{id}` | Toàn bộ thông tin loại phòng |
| Xóa | `DELETE /api/admin/rooms/{id}` | Bị từ chối nếu đã có đơn đặt |

### Luồng thay thế / Ngoại lệ

| Trường hợp | Phản hồi hệ thống |
|---|---|
| `name` hoặc `city` trống khi tạo khách sạn | 400 validation error |
| `id` khách sạn / phòng không tồn tại | 404 |
| Xóa khách sạn / phòng đang có đơn đặt | 409 `{"message":"Du lieu xung dot hoac dang duoc su dung"}` |
| `pricePerNight` âm hoặc `quantity` < 1 | 400 validation error |
| Token không phải ADMIN | 403 |

### Hậu điều kiện

- Thông tin khách sạn / phòng được phản ánh ngay trong kết quả tìm kiếm công khai (`GET /api/hotels`).
- Khi xóa khách sạn, tất cả loại phòng con bị xóa theo (cascade). Đơn đặt phòng hiện có không bị xóa.

### Ghi chú

- `rooms.quantity` là số phòng cùng loại. Giảm `quantity` không chặn đơn cũ đã đặt vượt số lượng; đây là hạn chế đã biết (xem ERD mục 6).
- Description và amenities có thể được Admin nhập thủ công hoặc sinh tự động qua AI (`UC11`).

---

## 3.11 UC11 — Sinh mô tả khách sạn bằng AI (Admin)

### Tổng quan

| Trường | Nội dung |
|---|---|
| **Mã use case** | UC11 |
| **Tên** | Sinh mô tả khách sạn bằng AI |
| **Tác nhân chính** | Admin |
| **Tác nhân phụ** | Anthropic Claude API (hệ thống ngoài, tùy chọn) |
| **Mục tiêu** | Admin yêu cầu hệ thống tự động tạo nội dung mô tả hấp dẫn cho khách sạn, giảm công sức soạn thảo thủ công |
| **Phạm vi** | QuickStay — AiService, AdminController |
| **Mức độ** | Sea level |

### Tiền điều kiện

1. Admin đã đăng nhập (`role = ADMIN`).
2. Khách sạn cần sinh mô tả đã tồn tại trong hệ thống.
3. (Tùy chọn) Biến môi trường `ANTHROPIC_API_KEY` đã được cấu hình.

### Luồng chính — Có API key

1. Admin gửi `POST /api/ai/describe` với body chứa thông tin khách sạn (`hotelId` hoặc thông tin trực tiếp).
2. Hệ thống gọi `AiService.generateDescription(hotel)`.
3. `AiService` kiểm tra `ANTHROPIC_API_KEY` có giá trị, gọi Anthropic Messages API (`POST /v1/messages`) với prompt dựng từ tên khách sạn, thành phố và tiện nghi.
4. Anthropic trả về mô tả. Hệ thống trả mô tả cho Admin (200 OK).
5. (Tùy chọn) Admin lưu mô tả vào trường `description` của khách sạn qua `PUT /api/admin/hotels/{id}`.

### Luồng thay thế A — Không có API key (chế độ dự phòng)

1. `AiService` phát hiện `ANTHROPIC_API_KEY` trống.
2. `AiService` tạo nội dung dự phòng từ dữ liệu trong DB (tên, thành phố, tiện nghi).
3. Hệ thống trả nội dung dự phòng (200 OK). **Tính năng vẫn hoạt động bình thường**, không báo lỗi.

### Luồng thay thế B — API key hợp lệ nhưng Anthropic lỗi

1. `AiService` gọi Anthropic và nhận lỗi mạng / 5xx.
2. `AiService` bắt ngoại lệ và chuyển sang chế độ dự phòng (giống Luồng A).
3. Hệ thống trả nội dung dự phòng (200 OK).

### Luồng thay thế C — Chatbot công khai

1. Người dùng (không cần đăng nhập) gửi `POST /api/ai/chat` với câu hỏi.
2. Hệ thống gọi `AiService` với prompt chatbot, áp dụng cùng cơ chế API key / dự phòng.
3. Hệ thống trả câu trả lời (200 OK).

### Luồng ngoại lệ

| Trường hợp | Phản hồi hệ thống |
|---|---|
| Admin gọi `/api/ai/describe` không có token | 403 (endpoint yêu cầu ADMIN theo SecurityConfig) |
| Dữ liệu đầu vào thiếu / sai định dạng | 400 validation error |

### Hậu điều kiện

- Nội dung mô tả (AI hoặc dự phòng) được trả về cho Admin.
- Nếu Admin chọn lưu vào DB, trường `hotels.description` được cập nhật.

### Ghi chú

- Endpoint `/api/ai/describe` yêu cầu `ADMIN`, endpoint `/api/ai/chat` là công khai (xem `SecurityConfig`).
- Model AI được cấu hình bằng biến `AI_MODEL` (mặc định `claude-haiku-5-5`). Thay đổi model không ảnh hưởng đến cơ chế dự phòng.
- Nội dung do AI sinh chưa được lọc hay kiểm duyệt tự động; Admin chịu trách nhiệm xem lại trước khi lưu.

---

## Cập nhật mục lục (tham chiếu)

| Mục | Nội dung |
|---|---|
| 3.9 | UC09 — Quản lý trạng thái đơn đặt phòng (Admin) |
| 3.10 | UC10 — Quản lý khách sạn và phòng (Admin) |
| 3.11 | UC11 — Sinh mô tả khách sạn bằng AI (Admin) |

---

*Đối chiếu: `AdminController.java` · `BookingService.java` · `HotelService.java` · `AiService.java` · `SecurityConfig.java` · `QuickStay-API.md` · `QuickStay-ERD.md`*
