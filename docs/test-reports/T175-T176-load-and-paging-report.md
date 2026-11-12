# T176, T175 – Kiểm thử tải backend và kiểm thử phân trang

Ngày đo: 12/11/2026 · Người thực hiện: Phùng Văn Vượng · Yêu cầu: NFR-01 (danh sách, chi tiết, phòng trống dưới 500 ms), NFR-03 (chịu ít nhất 50 request đồng thời)

## 1. Cách đo

- Backend chạy bằng `java -jar app.jar` trên máy phát triển, CSDL H2 trong bộ nhớ với dữ liệu mẫu.
- Mỗi kịch bản gửi **50 request đồng thời**, lặp **3 vòng** (150 request mỗi kịch bản, 1.200 request tổng cộng).
- Kịch bản đặt phòng: 50 khách khác nhau cùng đặt **một loại phòng có 5 phòng**, cùng khoảng ngày.

## 2. Kết quả

| Kịch bản | Request | Trung vị (ms) | p95 (ms) | Lớn nhất (ms) | Lỗi | Mã trả về |
|---|---|---|---|---|---|---|
| `GET /api/hotels` | 150 | 53 | 249 | 291 | 0 | 200 × 150 |
| `GET /api/hotels?page=0&size=10` | 150 | 35 | 74 | 108 | 0 | 200 × 150 |
| `GET /api/hotels?city=&maxPrice=` | 150 | 32 | 70 | 85 | 0 | 200 × 150 |
| `GET /api/hotels/1` | 150 | 24 | 55 | 75 | 0 | 200 × 150 |
| `GET /api/hotels/1/rooms?checkIn&checkOut` | 150 | 32 | 81 | 131 | 0 | 200 × 150 |
| `GET /api/bookings/me` | 150 | 40 | 223 | 239 | 0 | 200 × 150 |
| `POST /api/bookings` (50 khách, 1 loại phòng 5 phòng) | 150 | 152 | 279 | 410 | 0 | **201 × 5**, 409 × 145 |
| `POST /api/auth/login` | 150 | 361 | 675 | 820 | 0 | 200 × 150 |

Không có lỗi 500 trong log backend.

## 3. Đánh giá

- **NFR-01 đạt:** p95 của mọi API danh sách, chi tiết, phòng trống đều dưới 500 ms khi có 50 request đồng thời.
- **NFR-03 đạt:** 1.200/1.200 request đều được trả lời, không có lỗi hệ thống.
- **Không đặt trùng dưới tải:** 5 phòng nhận đúng 5 đơn, các yêu cầu còn lại nhận 409 kèm thông báo.
- **Đăng nhập** có p95 là 675 ms, do BCrypt cố ý tốn CPU để chống dò mật khẩu. Đăng nhập không thuộc NFR-01. Không giảm độ mạnh BCrypt vì sẽ làm yếu bảo mật.
- **Không cần sửa lỗi backend** theo kết quả tải. Các tối ưu đã có trước đó: truy vấn một câu SQL cho danh sách và phòng trống (T048, T077), chỉ mục (T153), phân trang (T165). Nén gzip cho JSON do Nginx đảm nhận (`frontend/nginx.conf`).
- **Lighthouse (NFR-02)** đo phần giao diện, thuộc T161 của Hưng. Backend không ảnh hưởng tới First Contentful Paint.

## 4. T175 – Phân trang

| Phạm vi | Kết quả |
|---|---|
| API `GET /hotels`, `/bookings/me`, `/admin/bookings` với `page`, `size` | ✅ `PagingApiTest` (13 test), `HotelSearchEdgeCaseTest` (page quá lớn trả 400), kịch bản tải ở trên |
| API khi không gửi `page`, `size` | ✅ Vẫn trả mảng như cũ, frontend hiện tại không bị ảnh hưởng |
| **Giao diện** | ⚠️ **Frontend chưa gọi API có phân trang**, chưa có màn hình nào gửi `page`/`size` (T236). Chưa kiểm thử được đầu cuối phía giao diện |

Khi frontend có phân trang: `page` tính từ 0, phản hồi là `{ items, page, size, totalItems, totalPages }` (xem mục "Phân trang" trong `QuickStay-API.md`). Theo báo cáo T153, `GET /bookings/me` không phân trang với 20.000 đơn mất khoảng 700 ms, nên màn hình Lịch sử và Admin nên dùng phân trang.

## 5. Giới hạn

- Đo trên H2 và máy phát triển, chưa đo trên MySQL thật hay máy chủ triển khai.
- Đây là các đợt 50 request đồng thời ngắn, không phải kiểm thử tải kéo dài.
