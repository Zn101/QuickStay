# T187 – Review mã backend của nhóm

Ngày review: 13/11/2026 (hoàn thiện 15/11/2026) · Người review: Phùng Văn Vượng · Nhánh: `recovery/clean-dev` (`d53b758`)

## 1. Phạm vi

| Phần | Người viết chính | File |
|---|---|---|
| API admin khách sạn, loại phòng | Minh (T082, T083, T094, T095, T133) | `admin/HotelAdmin*`, `admin/RoomAdmin*` |
| API admin đơn đặt phòng | Đức (PR #16), Vượng (phân trang T165) | `admin/BookingAdminController.java` |
| Xác thực JWT, phân quyền | Minh (T043, T055), Vượng (T128) | `security/JwtAuthFilter.java`, `security/SecurityConfig.java` |
| Docker, CI/CD | Minh, Hưng (T014, T041, T121, T171) | `backend/Dockerfile`, `.github/workflows/cd-docker.yml` |

Không review lại phần của Vượng (khách sạn, đặt phòng, hồ sơ), vì phần đó đã có test và báo cáo riêng (T142, T153, T175, T176).

## 2. Kết quả

| # | Mức độ | Vị trí | Vấn đề | Đề xuất | Trạng thái |
|---|---|---|---|---|---|
| 1 | 🔴 Cao | `backend/Dockerfile:22`, `.github/workflows/cd-docker.yml` | Image được build bằng `gradlew bootJar -x test`, quy trình CD tự động triển khai lên VPS, và repo **không có workflow nào chạy test backend**. Code không compile hoặc làm hỏng nghiệp vụ (như lần build hỏng ngày 04/11) vẫn có thể lên máy chủ | Thêm `ci-backend.yml` chạy `./gradlew test` cho PR và push vào `recovery/clean-dev`, `main`; để CD chỉ chạy khi CI xanh (`needs:` hoặc `workflow_run`) | ⏳ Giao Minh (T193) |
| 2 | 🟡 Trung bình | `admin/HotelAdminService.list()` | `GET /admin/hotels` không trả `minPrice`, trong khi tài liệu API ghi "trả mảng như `/hotels`" | Dùng chung truy vấn với `/hotels` | ✅ Đã sửa ở T186 (`f919506`) |
| 3 | 🟡 Trung bình | `admin/RoomAdminService.update()` | Sửa loại phòng đã có đơn sang khách sạn khác (đổi `hotelId`) làm các đơn cũ âm thầm đổi khách sạn | Trả 409 khi loại phòng đã có đơn mà đổi khách sạn | ✅ Đã sửa ở T186 (`f919506`) |
| 4 | 🟢 Thấp | `admin/RoomAdminService.java:141-142` | Admin giảm `quantity` hoặc `capacity` xuống dưới mức các đơn hiện có. Phòng trống không âm nhờ `Room.remaining()`, nhưng đơn cũ có thể vượt sức chứa mới | Giữ như ERD mục 6 ("không chặn"), hoặc cảnh báo cho admin (T207, tùy chọn) | Ghi nhận |
| 5 | 🟢 Thấp | `admin/HotelAdminService.java:110` | `existsByRoomHotelIdAndStatusIn(id, mọi trạng thái)` thực chất chỉ là "có đơn nào không", tham số trạng thái thừa | Đổi thành `existsByRoomHotelId(id)` | Ghi nhận, không ảnh hưởng chức năng |
| 6 | 🟢 Thấp | `admin/BookingAdminController.java:39-45` | Body đổi trạng thái đọc bằng `Map<String, String>` và tự `valueOf` | Dùng record `StatusRequest(@NotBlank String status)` để validate thống nhất với các API khác | Ghi nhận, đã có test cho status thiếu, rỗng, sai (T152) |
| 7 | 🟢 Chấp nhận được | `security/JwtAuthFilter.java:31-32` | Quyền lấy từ token, không đọc lại từ CSDL: tài khoản bị đổi quyền vẫn dùng token cũ tới khi hết hạn (24 giờ) | Đặc điểm chung của JWT không trạng thái. Nếu cần, rút ngắn `JWT_EXPIRATION` | Ghi nhận |

## 3. Điểm tốt

- Phân quyền tập trung trong `SecurityConfig`. Bảng phân quyền qua HTTP thật (T152) xác nhận mọi API admin trả 401 khi chưa đăng nhập, 403 với khách.
- Lỗi trả JSON `{"message"}` thống nhất ở mọi lớp, kể cả 401/403 từ tầng bảo mật (T128).
- API admin có validate đầu vào đầy đủ với thông báo tiếng Việt (`HotelAdminDtos`, `RoomAdminDtos`), và có 108 test MockMvc (T108).
- Xóa khách sạn hoặc loại phòng đã có đơn bị chặn bằng 409, đúng ERD.

## 4. Kiểm chứng

- `./gradlew test`: 326/326 test xanh, gồm `AdminReviewFixTest` cho vấn đề 2 và 3 (4 test đỏ trước khi sửa).
- Vấn đề 1 kiểm tra bằng cách đọc `cd-docker.yml` và `Dockerfile`; khớp với ghi chú TEST-14 trong báo cáo T158-G3.2.
