# T153 – Hiệu năng truy vấn phòng trống và chỉ mục CSDL

Ngày đo: 10/11/2026 · Người thực hiện: Phùng Văn Vượng · Yêu cầu: NFR-01 (API danh sách, chi tiết, phòng trống dưới 500 ms)

Chạy lại:

```bash
cd backend && ./gradlew test --tests '*QueryPerformanceTest'
```

Kết quả in ra trong log test với tiền tố `[PERF]` và `[EXPLAIN]`.

## 1. Dữ liệu đo

Test tự tạo dữ liệu rồi xóa sau khi đo: **500 khách sạn, 1.502 loại phòng, 20.000 đơn đặt phòng** (cùng một khách, trên 5 loại phòng của một khách sạn, trải 2 năm, 1/6 số đơn đã hủy). Mỗi API được chạy 3 lần khởi động rồi đo 10 lần.

## 2. Kết quả (H2 trong bộ nhớ)

| API | Trung vị | Lớn nhất | Dưới 500 ms |
|---|---|---|---|
| `GET /hotels/{id}/rooms?checkIn&checkOut` (khách sạn có 20.000 đơn) | 20 ms | 26 ms | ✅ |
| `GET /hotels/{id}` | 10 ms | 13 ms | ✅ |
| `GET /hotels` (khoảng 504 khách sạn, không phân trang) | 46 ms | 59 ms | ✅ |
| `GET /hotels?city=&maxPrice=` | 19 ms | 37 ms | ✅ |
| `GET /hotels?page=0&size=10` | 33 ms | 39 ms | ✅ |
| `GET /bookings/me?page=0&size=10` (20.000 đơn) | 22 ms | 33 ms | ✅ |
| `GET /bookings/me` **không phân trang** (20.000 đơn) | **700 ms** | 726 ms | ❌ |

## 3. Kế hoạch truy vấn (EXPLAIN)

| Truy vấn | Chỉ mục được dùng | Đánh giá |
|---|---|---|
| Đếm đơn chồng lấn của một loại phòng (đặt phòng) | `idx_bookings_room_dates` (room_id, check_in, check_out) | ✅ Đúng như thiết kế |
| Đếm đơn theo khách sạn (`GET /hotels/{id}/rooms`) | Khóa ngoại `rooms.hotel_id`, rồi `idx_bookings_room_dates` | ✅ |
| Lịch sử đặt phòng của một khách | Khóa ngoại `bookings.user_id` | ✅ Tìm theo user qua chỉ mục. H2 chọn chỉ mục khóa ngoại thay vì `idx_bookings_user_created`, rồi sắp xếp. Vẫn nhanh khi có phân trang |
| Tìm khách sạn theo thành phố `lower(city) LIKE '%...%'` | Không có, quét cả bảng | ⚠️ Xem mục 4 |

## 4. Kết luận

- **Đạt NFR-01** cho mọi API có phân trang hoặc có giới hạn tự nhiên. **Không cần thêm chỉ mục mới**: chỉ mục cho truy vấn phòng trống đã có từ migration V1 và được dùng đúng.
- **Danh sách không phân trang tăng theo số đơn.** `GET /bookings/me` và `GET /admin/bookings` khi không gửi `page`, `size` sẽ trả toàn bộ đơn: 700 ms với 20.000 đơn. Frontend nên luôn dùng phân trang cho hai màn hình này (T236).
- **`idx_hotels_city` không được dùng**, vì tìm kiếm khớp một phần (`%...%`) và có `lower()`. Với vài trăm khách sạn, quét cả bảng vẫn chỉ khoảng 20 ms nên chưa cần tối ưu. Khi dữ liệu lớn có thể dùng cột tìm kiếm chuẩn hóa hoặc full-text index.

## 5. Giới hạn

- Số liệu đo trên **H2 trong bộ nhớ** và trên máy phát triển. MySQL thật (đọc đĩa, mạng tới Docker) sẽ chậm hơn, và kế hoạch truy vấn có thể khác. Nên chạy lại phép đo trên môi trường triển khai.
- Đây là đo tuần tự từng request, không phải kiểm thử tải nhiều người dùng đồng thời.
