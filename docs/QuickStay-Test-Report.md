# QuickStay – Test case và báo cáo kiểm thử

Ngày chạy: 22/10/2026 · Môi trường: Windows 11, JDK 17, Node 24, backend chạy H2 (MySQL ở Docker), trình duyệt tích hợp.

## 1. Tổng hợp

| Nhóm | Công cụ | Số test | Đạt | Lệnh chạy |
|---|---|---|---|---|
| Backend API (unit + integration) | JUnit 5, MockMvc, TestRestTemplate | 46 | 46 | `cd backend && ./gradlew test` |
| Frontend (hàm tiện ích, trang, phân quyền) | Vitest, React Testing Library | 8 | 8 | `cd frontend && npm test` |
| E2E toàn luồng qua API | `qa/e2e.mjs` | 13 | 13 | `node qa/e2e.mjs` (backend đang chạy) |
| **Tổng tự động** | | **67** | **67 (100%)** | |

Tiêu chí 80% trở lên: **đạt**. Khi viết tài liệu API (26/10/2026) phát hiện lỗi: gọi API admin bằng tài khoản khách trả 401 thay vì 403 khi chạy thật (test MockMvc không bắt được). Đã sửa trong `SecurityConfig` và thêm 3 test `TC_SEC_*` chạy qua cổng HTTP thật. Các mục kiểm thử thủ công cần người chạy được liệt kê ở mục 4.

## 2. Test case backend (mã = tên phương thức test)

| Mã | Nội dung | Kết quả mong đợi |
|---|---|---|
| TC_AUTH_01 | Đăng ký email mới | 201, có JWT, role CUSTOMER |
| TC_AUTH_02 | Mật khẩu lưu trong DB | Là hash BCrypt, khác mật khẩu gốc (NFR-04) |
| TC_AUTH_03 | Đăng ký email trùng | 409 |
| TC_AUTH_04 | Email sai định dạng, mật khẩu ngắn, tên rỗng | 400 |
| TC_AUTH_05 | Đăng nhập đúng / sai mật khẩu | 200 + token / 401 |
| TC_AUTH_06 | Gọi API cần đăng nhập không có token hoặc token sai | 401 (NFR-05) |
| TC_AUTH_07 | Xem và cập nhật hồ sơ | 200, dữ liệu được cập nhật |
| TC_AUTH_08 | Đổi mật khẩu | Đăng nhập được bằng mật khẩu mới, không được bằng mật khẩu cũ |
| TC_AUTH_09 | Tài khoản admin mặc định | Đăng nhập được, role ADMIN |
| TC_HOTEL_01 | Danh sách khách sạn không cần đăng nhập | 200, có dữ liệu mẫu và giá thấp nhất |
| TC_HOTEL_02 | Tìm theo thành phố | Chỉ trả khách sạn ở thành phố đó |
| TC_HOTEL_03 | Tìm theo tên, không phân biệt hoa thường | Có kết quả đúng |
| TC_HOTEL_04 | Tìm không có kết quả | 200, danh sách rỗng |
| TC_HOTEL_05 | Lọc loại phòng + khoảng giá | Chỉ khách sạn có phòng phù hợp |
| TC_HOTEL_06 | Chi tiết khách sạn và danh sách phòng | 200, đúng số phòng |
| TC_HOTEL_07 | Khách sạn không tồn tại | 404 |
| TC_HOTEL_08 | Phòng trống theo ngày | Số phòng trống giảm đúng khi có đặt phòng, và không giảm với ngày không chồng lấn |
| TC_HOTEL_09 | Khoảng ngày sai (trả trước nhận, thiếu một ngày) | 400 |
| TC_BOOK_01 | Đặt phòng hợp lệ | 201, PENDING, tổng tiền = giá × số đêm |
| TC_BOOK_02 | Đặt phòng khi chưa đăng nhập | 401 |
| TC_BOOK_03 | Admin đặt phòng | 403 |
| TC_BOOK_04 | Đặt trùng ngày khi phòng đã hết | 409 |
| TC_BOOK_05 | Hai kỳ nghỉ liền nhau (trả phòng = nhận phòng) | Cả hai 201 |
| TC_BOOK_06 | Loại phòng có 2 phòng | Đặt được 2 lần, lần 3 bị 409 |
| TC_BOOK_07 | Ngày trả ≤ ngày nhận, ngày nhận ở quá khứ, vượt số khách | 400 |
| TC_BOOK_08 | Phòng không tồn tại | 404 |
| TC_BOOK_09 | Lịch sử đặt phòng | Chỉ thấy đặt phòng của chính mình |
| TC_BOOK_10 | Hủy đặt phòng PENDING | CANCELLED, người khác đặt lại được |
| TC_BOOK_11 | Hủy đặt phòng của người khác / đã CONFIRMED | 403 / 409 |
| TC_BOOK_12 | 8 yêu cầu đặt cùng lúc cho phòng cuối cùng | Đúng 1 yêu cầu 201, 7 yêu cầu 409 (không đặt trùng) |
| TC_ADMIN_01 | Khách / ẩn danh gọi API admin | 403 / 401 |
| TC_ADMIN_02 | CRUD khách sạn | Tạo, sửa, xóa đúng |
| TC_ADMIN_03 | Tạo khách sạn thiếu tên, thành phố | 400 |
| TC_ADMIN_04 | CRUD phòng | Tạo, sửa, xóa đúng; xóa lần hai 404 |
| TC_ADMIN_05 | Xóa phòng đã có đặt phòng | 409 |
| TC_ADMIN_06 | Luồng PENDING → CONFIRMED → CHECKED_IN → COMPLETED | Từng bước 200 |
| TC_ADMIN_07 | Chuyển trạng thái sai (PENDING → COMPLETED, CANCELLED → CONFIRMED) | 409 |
| TC_ADMIN_08 | Admin xem toàn bộ đặt phòng | Có tên khách sạn và email khách |
| TC_AI_01 | `/api/ai/describe` không phải admin | 401 / 403 |
| TC_AI_02 | Sinh mô tả | Có tên khách sạn và tiện nghi trong nội dung |
| TC_AI_03 | Sinh mô tả thiếu tên | 400 |
| TC_AI_04 | Chatbot hỏi về khách sạn ở Đà Nẵng | 200, trả lời từ dữ liệu trong DB |
| TC_AI_05 | Chatbot nhận tin nhắn rỗng | 400 |
| TC_SEC_01 | Khách gọi API admin qua HTTP thật | 403 kèm `{"message": ...}` (không bị đổi thành 401) |
| TC_SEC_02 | Ẩn danh gọi API cần đăng nhập | 401 |
| TC_SEC_03 | Admin đặt phòng qua HTTP thật | 403 |

## 3. Kiểm thử phi chức năng (đo ngày 22/10/2026)

| Mã | Yêu cầu | Kết quả đo | Đạt |
|---|---|---|---|
| NFR-01 | API danh sách, chi tiết, phòng trống < 500 ms | Qua Docker (Nginx + MySQL), 50 request đồng thời: p95 = 203 ms (danh sách), 105 ms (chi tiết), 110 ms (phòng trống) | Đạt |
| NFR-02 | First Contentful Paint < 2 s | Lighthouse trên http://localhost:8081 (Docker): FCP 1,4 s, điểm hiệu năng 0,97 | Đạt |
| NFR-03 | Chịu ≥ 50 request đồng thời | 3 × 50 request: 150/150 thành công, không lỗi | Đạt (qua Docker; backend dùng ~690 MiB RAM, không tràn bộ nhớ) |
| NFR-04 | BCrypt | TC_AUTH_02 | Đạt |
| NFR-05 | JWT có hạn cho API đặt phòng và admin | TC_AUTH_06, TC_BOOK_02, TC_ADMIN_01 | Đạt |
| NFR-06 | CORS chỉ cho phép Frontend | Cấu hình `app.cors.allowed-origins` | Đã cấu hình, chưa có test riêng |

Chạy lại: `node qa/load-test.mjs [BASE_URL] [SỐ_REQUEST]` và `npx lighthouse http://localhost:8081 --only-categories=performance`.

## 4. Chưa kiểm thử, cần người chạy

- Docker đã chạy thành công (mysql healthy, backend, frontend); E2E 13/13 đạt qua Nginx cổng 8081. Nếu cổng 8080 bị chiếm, đặt `BACKEND_PORT` / `FRONTEND_PORT` trong `.env`.
- Pipeline GitHub Actions (`.github/workflows/ci.yml`) chưa chạy trên GitHub. Cần đẩy lên repo và kiểm tra tab Actions.
- Trình duyệt: mới xem trên trình duyệt tích hợp của ứng dụng. Cần thử Chrome, Edge, Safari, Firefox (NFR-11) và màn hình mobile/tablet (NFR-10).
- AI thật: chưa có `ANTHROPIC_API_KEY` nên chỉ kiểm thử được chế độ dự phòng. Khi có khóa, đặt biến môi trường rồi thử nút "Tạo mô tả bằng AI" và chatbot.
