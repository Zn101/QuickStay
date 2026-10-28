# QuickStay – Kế hoạch làm việc hằng ngày

Cập nhật 27/10/2026. Nguồn: sheet Master Plan trong `QuickStay-Quan-Tri-Du-An.xlsx`. Mã T… khớp với thẻ trên bảng công việc. Mỗi thành viên có công việc mỗi ngày (khoảng 6 giờ/ngày) trong 15 ngày làm việc, từ 26/10 đến 13/11/2026; tuần 4 (16/11–20/11) là tuần dự phòng.

**Cách dùng:** đầu mỗi ngày mở đúng mục của ngày đó, làm theo thứ tự các mục của mình, tick hoàn thành và chuyển thẻ trên bảng công việc. Việc chưa xong phải báo lại trong buổi daily, không để dồn sang ngày sau.

## Tổng quan

| | Hưng | Vượng | Đức | Minh | Tổng |
|---|---|---|---|---|---|
| Tuần 1 | 21 việc, 30 giờ | 15 việc, 30 giờ | 18 việc, 30.5 giờ | 18 việc, 30 giờ | 72 việc |
| Tuần 2 | 17 việc, 30 giờ | 16 việc, 30 giờ | 16 việc, 30 giờ | 14 việc, 30 giờ | 63 việc |
| Tuần 3 | 18 việc, 30 giờ | 15 việc, 30 giờ | 12 việc, 30 giờ | 16 việc, 30 giờ | 61 việc |
| Tuần 4 (dự phòng) | 10 việc, 28 giờ | 8 việc, 26 giờ | 9 việc, 26 giờ | 9 việc, 26 giờ | 36 việc |
| **Cộng** | 66 việc | 54 việc | 55 việc | 57 việc | 232 việc |

# Tuần 1

## Thứ Hai 26/10/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T001 Họp khởi động: chốt phạm vi, API contract, quy ước Git, Definition of Done (1.5 giờ) → Biên bản họp
- [ ] T002 Tạo nhánh main/dev, bật bắt buộc PR + review, mời thành viên và giảng viên (1 giờ) → Repo có nhánh main, dev
- [ ] T003 Dựng bảng công việc: cột, nhãn, nhập task, gán người và hạn (1.5 giờ) → Bảng công việc lọc được theo người, hạn, trạng thái
- [ ] T004 Hoàn thiện Proposal (MSV, liên kết) và nộp đề cương (1 giờ) → Proposal đã nộp
- [ ] T005 Viết SRS mục 1: mục đích, phạm vi, tổng quan, thuật ngữ (1 giờ) → SRS phần 1

**Phùng Văn Vượng** (6 giờ)

- [ ] T006 Phân tích thực thể và quan hệ: users, hotels, rooms, bookings (2 giờ) → Sơ đồ ERD
- [ ] T007 Viết từ điển dữ liệu 4 bảng (kiểu, ràng buộc, mô tả) (2 giờ) → QuickStay-ERD.md
- [ ] T008 Khởi tạo Spring Boot, cấu hình MySQL/JWT/CORS qua biến môi trường (2 giờ) → Backend chạy với MySQL

**Lê Tiến Đức** (6 giờ)

- [ ] T009 Phác thảo wireframe Trang chủ và Chi tiết khách sạn (2.5 giờ) → Ảnh wireframe
- [ ] T010 Phác thảo wireframe Đăng nhập, Đăng ký, Hồ sơ (1.5 giờ) → Ảnh wireframe
- [ ] T011 Phác thảo wireframe Đặt phòng và Lịch sử đặt phòng (1.5 giờ) → Ảnh wireframe
- [ ] T012 Quy ước giao diện: màu sắc, font, component dùng chung (0.5 giờ) → Quy ước UI

**Lê Duy Minh** (6 giờ)

- [ ] T013 Thiết kế sơ đồ kiến trúc và sơ đồ triển khai (Nginx, backend, MySQL) (2 giờ) → Sơ đồ kiến trúc
- [ ] T014 Viết Dockerfile backend (Gradle + JDK) (2 giờ) → Image backend build được
- [ ] T015 Viết Dockerfile frontend (Node build + Nginx) và nginx.conf (2 giờ) → Image frontend build được

## Thứ Ba 27/10/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T016 Viết SRS 2.1–2.2: sơ đồ quan hệ đối tượng và sơ đồ Use Case (2 giờ) → SRS 2.1, 2.2
- [ ] T017 Viết SRS 2.3–2.4: sơ đồ luồng và sơ đồ chuyển trạng thái đơn (2 giờ) → SRS 2.3, 2.4
- [ ] T018 Viết SRS 2.5–2.6: phân quyền chức năng, dữ liệu và site map (1.5 giờ) → SRS 2.5, 2.6
- [ ] T019 Họp daily, cập nhật bảng công việc (0.5 giờ) → Trạng thái cập nhật

**Phùng Văn Vượng** (6 giờ)

- [ ] T020 Viết entity User, UserRepository và tài khoản admin mặc định (2 giờ) → Admin tự tạo khi DB trống
- [ ] T021 API đăng ký: validate dữ liệu, chuẩn hóa email, mã hóa BCrypt (2.5 giờ) → POST /auth/register
- [ ] T022 API đăng nhập và sinh JWT có hạn (JwtService) (1.5 giờ) → POST /auth/login

**Lê Tiến Đức** (6.5 giờ)

- [ ] T023 Wireframe dashboard admin: 3 tab Đặt phòng, Khách sạn, Phòng (2 giờ) → Ảnh wireframe
- [ ] T024 Wireframe chatbot và bản mobile (1.5 giờ) → Ảnh wireframe
- [ ] T025 Khởi tạo React + Vite + Tailwind + Zustand + React Router (2 giờ) → npm run dev chạy được
- [ ] T026 Dựng layout chung và khung Navbar (1 giờ) → Layout, Navbar khung

**Lê Duy Minh** (6 giờ)

- [ ] T027 docker-compose: dịch vụ mysql có healthcheck và volume (2 giờ) → MySQL lên bằng compose
- [ ] T028 docker-compose: backend, frontend, biến môi trường, .env.example (2 giờ) → docker compose up chạy cả hệ thống
- [ ] T029 Viết README hướng dẫn chạy dự án (1 giờ) → README
- [ ] T030 Tạo PR template và quy ước commit (1 giờ) → PR template

## Thứ Tư 28/10/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T031 Đặc tả use case UC06 (đặt phòng) trong SRS (1.5 giờ) → SRS 3.6
- [ ] T032 Đặc tả use case UC12 (sinh mô tả AI) trong SRS (1.5 giờ) → SRS 3.12
- [ ] T033 Đặc tả use case UC13 (chatbot) trong SRS (1 giờ) → SRS 3.13
- [ ] T034 Viết test case UC01–UC03 (mã, bước, kết quả mong đợi) (2 giờ) → Test case UC01–03

**Phùng Văn Vượng** (6 giờ)

- [ ] T035 Unit test API đăng ký (thành công, trùng email, dữ liệu sai) (2 giờ) → Test xanh
- [ ] T036 Viết entity Hotel, Room và repository (2 giờ) → Entity, repository
- [ ] T037 Viết seed dữ liệu mẫu 4 khách sạn và các loại phòng (2 giờ) → Dữ liệu mẫu tự tạo

**Lê Tiến Đức** (6 giờ)

- [ ] T038 Giao diện trang Đăng nhập (2 giờ) → Màn hình Đăng nhập
- [ ] T039 Giao diện trang Đăng ký (2 giờ) → Màn hình Đăng ký
- [ ] T040 Viết authStore (Zustand) và hàm gọi API tự gắn JWT (2 giờ) → authStore, api client

**Lê Duy Minh** (6 giờ)

- [ ] T041 GitHub Actions: build và test backend khi push/PR (2 giờ) → Job backend xanh
- [ ] T042 GitHub Actions: build và test frontend (1.5 giờ) → Job frontend xanh
- [ ] T043 Spring Security: JwtAuthFilter và cấu hình phân quyền CUSTOMER/ADMIN (2.5 giờ) → Phân quyền theo vai trò

## Thứ Năm 29/10/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T044 Viết test case UC04–UC05 (tìm kiếm, phòng trống) (1.5 giờ) → Test case UC04–05
- [ ] T045 Viết test case UC06–UC08 (đặt phòng, lịch sử, hủy) (2 giờ) → Test case UC06–08
- [ ] T046 Viết test case UC09–UC13 (admin, AI) (2 giờ) → Test case UC09–13
- [ ] T047 Họp daily, cập nhật bảng công việc (0.5 giờ) → Trạng thái cập nhật

**Phùng Văn Vượng** (6 giờ)

- [ ] T048 API danh sách khách sạn kèm giá thấp nhất mỗi đêm (2 giờ) → GET /hotels
- [ ] T049 Tìm kiếm theo tên hoặc thành phố (khớp một phần) (2 giờ) → Tham số q, city
- [ ] T050 Lọc theo loại phòng và khoảng giá (2 giờ) → Tham số roomType, minPrice, maxPrice

**Lê Tiến Đức** (6 giờ)

- [ ] T051 Nối API đăng nhập, đăng ký và hiển thị lỗi từ backend (2 giờ) → Đăng nhập thật
- [ ] T052 Navbar theo vai trò và route guard (CUSTOMER/ADMIN) (2 giờ) → Vào sai quyền bị chuyển hướng
- [ ] T053 Trang chủ: lưới thẻ khách sạn (ảnh, tên, thành phố, giá từ) (2 giờ) → Lưới khách sạn

**Lê Duy Minh** (6 giờ)

- [ ] T054 Cấu hình CORS chỉ cho nguồn Frontend (1.5 giờ) → CORS đúng
- [ ] T055 Xử lý 401 và 403 trả JSON (accessDeniedHandler) (1.5 giờ) → Khách gọi API admin nhận 403
- [ ] T056 Viết test phân quyền qua HTTP thật (TestRestTemplate) (2 giờ) → RealHttpSecurityTest
- [ ] T057 Đặc tả use case UC09–UC11 (quản trị) trong SRS (1 giờ) → SRS 3.9–3.11

## Thứ Sáu 30/10/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T058 Viết SRS phần 4: component, thông báo, cảnh báo (2 giờ) → SRS phần 4
- [ ] T059 Kiểm thử thủ công đăng ký, đăng nhập; ghi lỗi vào cột Bug (1.5 giờ) → Danh sách lỗi
- [ ] T060 Review PR tuần 1 (1.5 giờ) → PR đã review
- [ ] T061 Sprint Review và Retro tuần 1 (1 giờ) → Biên bản review

**Phùng Văn Vượng** (6 giờ)

- [ ] T062 API chi tiết một khách sạn (GET /hotels/{id}) (1.5 giờ) → Trả 404 khi không có
- [ ] T063 Unit test tìm kiếm và lọc khách sạn (2.5 giờ) → Test xanh
- [ ] T064 API xem và cập nhật hồ sơ (GET/PUT /users/me) (2 giờ) → Hồ sơ, đổi mật khẩu

**Lê Tiến Đức** (6 giờ)

- [ ] T065 Trang chủ: ô tìm kiếm theo tên/thành phố và nối API (1.5 giờ) → Tìm kiếm chạy được
- [ ] T066 Trang chủ: bộ lọc loại phòng và khoảng giá (1.5 giờ) → Bộ lọc chạy được
- [ ] T067 Trang chủ: trạng thái đang tải, rỗng, lỗi (1.5 giờ) → Hiển thị đúng 3 trạng thái
- [ ] T068 Sprint Review và Retro tuần 1 (1.5 giờ) → Biên bản review

**Lê Duy Minh** (6 giờ)

- [ ] T069 Rà soát bảo mật cấu hình: secret, biến môi trường, .gitignore (1.5 giờ) → Không có bí mật trong Git
- [ ] T070 Chạy thử toàn hệ thống bằng docker compose và ghi lỗi (2 giờ) → Hệ thống chạy từ đầu
- [ ] T071 Logging SLF4J/Logback cho exception quan trọng (2 giờ) → Log có ngữ cảnh
- [ ] T072 Sprint Review và Retro tuần 1 (0.5 giờ) → Biên bản review

# Tuần 2

## Thứ Hai 02/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T073 API sinh mô tả AI: dựng prompt và gọi Messages API (3 giờ) → POST /ai/describe
- [ ] T074 Mô tả dự phòng khi chưa có khóa API hoặc AI lỗi (2 giờ) → Luôn trả kết quả
- [ ] T075 Test API sinh mô tả (quyền ADMIN, dữ liệu sai) (1 giờ) → Test xanh

**Phùng Văn Vượng** (6 giờ)

- [ ] T076 API danh sách loại phòng của khách sạn (GET /hotels/{id}/rooms) (2 giờ) → Sắp theo giá tăng dần
- [ ] T077 Tính phòng trống: truy vấn đếm đơn chồng lấn khoảng ngày (3 giờ) → Trường available đúng
- [ ] T078 Test phòng trống: liền kề, chồng lấn, nhiều phòng cùng loại (1 giờ) → Test xanh

**Lê Tiến Đức** (6 giờ)

- [ ] T079 Trang chi tiết: hiển thị thông tin khách sạn, tiện nghi, ảnh (2 giờ) → Khối thông tin
- [ ] T080 Trang chi tiết: chọn ngày nhận/trả và kiểm tra hợp lệ (2 giờ) → Báo lỗi ngày sai
- [ ] T081 Trang chi tiết: danh sách phòng, giá một đêm, sức chứa (2 giờ) → Danh sách phòng

**Lê Duy Minh** (6 giờ)

- [ ] T082 API admin khách sạn: thêm (POST) và sửa (PUT) kèm validate (3 giờ) → POST/PUT /admin/hotels
- [ ] T083 API admin khách sạn: danh sách (GET) và xóa (DELETE), chặn khi có đơn (3 giờ) → Xóa có đơn trả 409

## Thứ Ba 03/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T084 Chatbot: dựng ngữ cảnh từ DB (khách sạn, tiện nghi, phòng, giá) (3 giờ) → Ngữ cảnh gửi cho AI
- [ ] T085 Chatbot: trả lời dự phòng theo từ khóa khi AI không dùng được (2 giờ) → POST /ai/chat luôn có kết quả
- [ ] T086 Test API chatbot (tin nhắn rỗng, quá dài, có/không khóa) (1 giờ) → Test xanh

**Phùng Văn Vượng** (6 giờ)

- [ ] T087 API đặt phòng: validate ngày (trả > nhận, nhận ≥ hôm nay) (2 giờ) → Trả 400 khi sai
- [ ] T088 API đặt phòng: tính tổng tiền theo số đêm, tạo đơn PENDING (2 giờ) → POST /bookings trả 201
- [ ] T089 API đặt phòng: kiểm tra sức chứa và thông báo lỗi (1 giờ) → Trả 400 khi vượt
- [ ] T090 Test validate đặt phòng (1 giờ) → Test xanh

**Lê Tiến Đức** (6 giờ)

- [ ] T091 Trang chi tiết: hiển thị số phòng trống, khóa nút khi hết (2 giờ) → Hết phòng khóa nút
- [ ] T092 Trang đặt phòng: form họ tên, SĐT, số khách, ghi chú (3 giờ) → Form đặt phòng
- [ ] T093 Trang đặt phòng: tóm tắt phòng và tổng tiền theo số đêm (1 giờ) → Tổng tiền đúng

**Lê Duy Minh** (6 giờ)

- [ ] T094 API admin loại phòng: thêm (POST) và sửa (PUT) kèm validate (3 giờ) → POST/PUT /admin/rooms
- [ ] T095 API admin loại phòng: danh sách, xóa, chặn khi có đơn (3 giờ) → Xóa có đơn trả 409

## Thứ Tư 04/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T096 Review chéo và chốt SRS bản 1.0 cùng cả nhóm (2 giờ) → SRS bản 1.0
- [ ] T097 Kiểm thử thủ công khách sạn, chi tiết, phòng trống (2 giờ) → Danh sách lỗi
- [ ] T098 Ghi và phân công lỗi trong cột Bug (1 giờ) → Bug có người nhận
- [ ] T099 Review PR (1 giờ) → PR đã review

**Phùng Văn Vượng** (6 giờ)

- [ ] T100 Chống đặt trùng: transaction và khóa bản ghi phòng (PESSIMISTIC_WRITE) (3 giờ) → Hết phòng trả 409
- [ ] T101 API lịch sử đặt phòng của người dùng (GET /bookings/me) (2 giờ) → Mới nhất trước
- [ ] T102 Test đặt phòng trùng ngày và kỳ nghỉ liền nhau (1 giờ) → Test xanh

**Lê Tiến Đức** (6 giờ)

- [ ] T103 Trang đặt phòng: gọi API và xử lý lỗi 400/409 (3 giờ) → Đặt phòng thật
- [ ] T104 Trang đặt phòng thành công: mã đơn, tổng tiền, nhắc thanh toán (1.5 giờ) → Màn hình thành công
- [ ] T105 Trang lịch sử: danh sách đơn và nhãn trạng thái (1.5 giờ) → Danh sách đơn

**Lê Duy Minh** (6 giờ)

- [ ] T106 API admin: danh sách toàn bộ đơn đặt phòng (2 giờ) → GET /admin/bookings
- [ ] T107 API admin: đổi trạng thái đơn theo luồng hợp lệ (3 giờ) → Bước sai trả 409
- [ ] T108 Test API admin: CRUD, luồng trạng thái, phân quyền (1 giờ) → Test xanh

## Thứ Năm 05/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T109 Kiểm thử thủ công đặt phòng, lịch sử; ghi lỗi (2.5 giờ) → Danh sách lỗi
- [ ] T110 Viết kịch bản E2E: đăng ký → tìm → đặt phòng → admin xác nhận (3 giờ) → qa/e2e.mjs
- [ ] T111 Review PR (0.5 giờ) → PR đã review

**Phùng Văn Vượng** (6 giờ)

- [ ] T112 API hủy đơn PENDING: kiểm tra chủ đơn (403) và trạng thái (409) (2.5 giờ) → PATCH /bookings/{id}/cancel
- [ ] T113 Test hủy đơn: của mình, của người khác, đã xác nhận (2 giờ) → Test xanh
- [ ] T114 Test nhiều phòng cùng loại đặt song song (1.5 giờ) → Test xanh

**Lê Tiến Đức** (6 giờ)

- [ ] T115 Trang lịch sử: nút Hủy đặt phòng, hộp thoại xác nhận, tải lại (2 giờ) → Hủy đơn cập nhật ngay
- [ ] T116 Trang hồ sơ: hiển thị và sửa họ tên, email, SĐT (2 giờ) → Sửa hồ sơ
- [ ] T117 Trang hồ sơ: đổi mật khẩu và thông báo kết quả (1 giờ) → Đổi mật khẩu
- [ ] T118 Dashboard admin: khung 3 tab và điều hướng (1 giờ) → Khung admin

**Lê Duy Minh** (6 giờ)

- [ ] T119 Bộ xử lý lỗi chung: trả {"message"} thống nhất cho mọi lỗi (2.5 giờ) → ApiExceptionHandler
- [ ] T120 Test các mã lỗi 400, 404, 409 (1.5 giờ) → Test xanh
- [ ] T121 Workflow đẩy Docker image lên GHCR khi push main (2 giờ) → Workflow GHCR

## Thứ Sáu 06/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T122 Review và merge các PR tuần 2 (2 giờ) → PR đã merge
- [ ] T123 Kiểm thử thủ công màn hình admin (2 giờ) → Danh sách lỗi
- [ ] T124 Cập nhật SRS theo thay đổi thực tế (1 giờ) → SRS cập nhật
- [ ] T125 Sprint Review và Retro tuần 2 (1 giờ) → Biên bản review

**Phùng Văn Vượng** (6 giờ)

- [ ] T126 Test hồ sơ và lịch sử đặt phòng (2 giờ) → Test xanh
- [ ] T127 Test đồng thời cơ bản (2 yêu cầu cùng lúc cho phòng cuối) (2 giờ) → Test xanh
- [ ] T128 Sửa lỗi theo review và theo cột Bug (2 giờ) → Bug backend đã đóng

**Lê Tiến Đức** (6 giờ)

- [ ] T129 Admin tab Đặt phòng: bảng đơn và bộ lọc trạng thái (3 giờ) → Bảng đơn
- [ ] T130 Admin tab Đặt phòng: nút chuyển trạng thái kế tiếp và hủy (2 giờ) → Đổi trạng thái chạy được
- [ ] T131 Sprint Review và Retro tuần 2 (1 giờ) → Biên bản review

**Lê Duy Minh** (6 giờ)

- [ ] T132 Viết test CORS và xác nhận chỉ nguồn Frontend gọi được (1.5 giờ) → Test CORS
- [ ] T133 Sửa lỗi backend admin theo cột Bug (2 giờ) → Bug admin đã đóng
- [ ] T134 Chuẩn bị môi trường triển khai (VPS hoặc máy demo) (2 giờ) → Môi trường sẵn sàng
- [ ] T135 Sprint Review và Retro tuần 2 (0.5 giờ) → Biên bản review

# Tuần 3

## Thứ Hai 09/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T136 Nút "Tạo mô tả bằng AI" ở form khách sạn (2.5 giờ) → Bấm nút điền mô tả
- [ ] T137 Nút "Tạo mô tả bằng AI" ở form phòng (1.5 giờ) → Bấm nút điền mô tả
- [ ] T138 Kiểm thử thủ công sinh mô tả AI (1 giờ) → Danh sách lỗi
- [ ] T139 Thử AI thật với khóa API (nếu có) và ghi kết quả (1 giờ) → Kết quả thử

**Phùng Văn Vượng** (6 giờ)

- [ ] T140 Bổ sung test: đăng ký, đăng nhập, hồ sơ (nhánh lỗi) (2.5 giờ) → Test xanh
- [ ] T141 Bổ sung test: khách sạn, tìm kiếm, phòng trống (nhánh lỗi) (2.5 giờ) → Test xanh
- [ ] T142 Đo độ phủ test và liệt kê phần chưa phủ (1 giờ) → Báo cáo độ phủ

**Lê Tiến Đức** (6 giờ)

- [ ] T143 Admin tab Khách sạn: bảng danh sách và form thêm/sửa (4 giờ) → CRUD khách sạn
- [ ] T144 Admin tab Khách sạn: xóa, hộp thoại xác nhận, lỗi 409 (2 giờ) → Xóa an toàn

**Lê Duy Minh** (6 giờ)

- [ ] T145 Triển khai: cài Docker và docker compose trên máy chủ (2 giờ) → Máy chủ có Docker
- [ ] T146 Triển khai: Nginx reverse proxy và biến môi trường thật (3 giờ) → Hệ thống chạy trên máy chủ
- [ ] T147 Kiểm tra backup và khôi phục volume MySQL (1 giờ) → Quy trình backup

## Thứ Ba 10/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T148 Widget chatbot: nút tròn và khung chat (3 giờ) → Khung chat
- [ ] T149 Widget chatbot: nối API, hiển thị tin nhắn, xử lý lỗi (2 giờ) → Chat được trên mọi trang
- [ ] T150 Review PR (1 giờ) → PR đã review

**Phùng Văn Vượng** (6 giờ)

- [ ] T151 Bổ sung test: đặt phòng, lịch sử, hủy (nhánh lỗi) (3 giờ) → Test xanh
- [ ] T152 Bổ sung test: API admin và phân quyền (2 giờ) → Test xanh
- [ ] T153 Tối ưu truy vấn phòng trống và thêm chỉ mục CSDL (1 giờ) → Truy vấn dưới 500 ms

**Lê Tiến Đức** (6 giờ)

- [ ] T154 Admin tab Phòng: bảng danh sách và form thêm/sửa (4 giờ) → CRUD loại phòng
- [ ] T155 Admin tab Phòng: kiểm tra giá, sức chứa, số lượng và xóa (2 giờ) → Validate đúng

**Lê Duy Minh** (6 giờ)

- [ ] T156 Smoke test toàn bộ luồng trên môi trường triển khai (2 giờ) → Danh sách kiểm tra
- [ ] T157 Rà soát bảo mật: CORS, secret, log không lộ dữ liệu (2 giờ) → Không có bí mật trong Git
- [ ] T158 Chuẩn bị merge dev vào main, giải quyết xung đột (2 giờ) → dev sẵn sàng merge

## Thứ Tư 11/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T159 Chạy E2E toàn luồng trên bản docker compose (2 giờ) → E2E đạt 100%
- [ ] T160 Kiểm thử tải 50 request đồng thời (2 giờ) → Số liệu NFR-01, NFR-03
- [ ] T161 Đo Lighthouse (First Contentful Paint) (1 giờ) → Số liệu NFR-02
- [ ] T162 Khóa tính năng mới lúc 12h; từ đó chỉ sửa lỗi (0 giờ) → Không còn PR tính năng mới
- [ ] T163 Review PR (1 giờ) → PR đã review

**Phùng Văn Vượng** (6 giờ)

- [ ] T164 Test đồng thời chống đặt trùng: nhiều yêu cầu cho phòng cuối (3 giờ) → Chỉ 1 yêu cầu thành công
- [ ] T165 API phân trang danh sách khách sạn và đơn đặt phòng (2 giờ) → Trang, kích thước trang
- [ ] T166 Sửa lỗi QA phía backend (1 giờ) → Bug backend đã đóng

**Lê Tiến Đức** (6 giờ)

- [ ] T167 Responsive Trang chủ và Chi tiết khách sạn (mobile/tablet/desktop) (3 giờ) → Không tràn ngang ở 375 px
- [ ] T168 Responsive Đặt phòng, Lịch sử, Hồ sơ, Đăng nhập, Đăng ký (3 giờ) → Không tràn ngang ở 375 px

**Lê Duy Minh** (6 giờ)

- [ ] T169 Pipeline CI xanh trên nhánh dev (2 giờ) → Actions xanh trên dev
- [ ] T170 Merge dev vào main sau khi review (2 giờ) → main cập nhật
- [ ] T171 Đẩy Docker image lên GHCR từ main (2 giờ) → Image trên GHCR

## Thứ Năm 12/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T172 Báo cáo kiểm thử: tổng hợp số liệu test và E2E (3 giờ) → Báo cáo phần số liệu
- [ ] T173 Đóng các lỗi còn lại trong cột Bug cùng người phụ trách (2 giờ) → Bug đã đóng
- [ ] T174 Rà soát lịch sử commit của 4 thành viên (1 giờ) → Mỗi người có commit

**Phùng Văn Vượng** (6 giờ)

- [ ] T175 Hỗ trợ Đức nối API phân trang ở giao diện (2 giờ) → Phân trang chạy đầu cuối
- [ ] T176 Sửa lỗi backend theo kết quả tải và Lighthouse (3 giờ) → NFR-01 đạt
- [ ] T177 Chốt tài liệu API và ERD theo thực tế (1 giờ) → API.md, ERD.md cập nhật

**Lê Tiến Đức** (6 giờ)

- [ ] T178 Responsive dashboard admin (3 tab) (3 giờ) → Bảng cuộn ngang được
- [ ] T179 Kiểm tra Chrome, Edge, Safari, Firefox và ghi bảng kết quả (3 giờ) → Bảng trình duyệt

**Lê Duy Minh** (6 giờ)

- [ ] T180 Hỗ trợ sửa lỗi backend và triển khai theo cột Bug (3 giờ) → Bug đã đóng
- [ ] T181 Chụp ảnh minh chứng: Actions xanh, docker compose ps, website chạy (1.5 giờ) → Ảnh minh chứng trong docs/
- [ ] T182 Viết hướng dẫn vận hành và xử lý sự cố thường gặp (1.5 giờ) → Hướng dẫn vận hành

## Thứ Sáu 13/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T183 Hoàn thiện báo cáo kiểm thử (tỉ lệ test đạt từ 80%) (3 giờ) → QuickStay-Test-Report.md
- [ ] T184 Cập nhật SRS bản cuối theo hệ thống thực tế (2 giờ) → SRS bản cuối
- [ ] T185 Sprint Review và Retro tuần 3 (1 giờ) → Biên bản review

**Phùng Văn Vượng** (6 giờ)

- [ ] T186 Sửa lỗi cuối phía backend và đóng cột Bug (3 giờ) → Bug backend đã đóng
- [ ] T187 Review mã backend của cả nhóm (2 giờ) → Review xong
- [ ] T188 Sprint Review và Retro tuần 3 (1 giờ) → Biên bản review

**Lê Tiến Đức** (6 giờ)

- [ ] T189 Viết test frontend (Vitest) cho Trang chủ và Đăng nhập (2 giờ) → npm test xanh
- [ ] T190 Viết test frontend cho Đặt phòng, Lịch sử và phân quyền route (2 giờ) → npm test xanh
- [ ] T191 Sửa lỗi giao diện còn lại (1 giờ) → Bug giao diện đã đóng
- [ ] T192 Sprint Review và Retro tuần 3 (1 giờ) → Biên bản review

**Lê Duy Minh** (6 giờ)

- [ ] T193 Kiểm tra pipeline trên main và cảnh báo bảo mật (2 giờ) → Actions xanh trên main
- [ ] T194 Gắn tag phiên bản v1.0-rc trên main (1 giờ) → Tag trên GitHub
- [ ] T195 Sửa lỗi triển khai còn lại (2 giờ) → Hệ thống ổn định
- [ ] T196 Sprint Review và Retro tuần 3 (1 giờ) → Biên bản review

# Tuần 4 (dự phòng)

## Thứ Hai 16/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T197 Xử lý việc tồn và lỗi trong cột Bug của cả nhóm (3 giờ) → Cột Bug trống
- [ ] T198 Chạy lại toàn bộ test case thủ công trên bản mới nhất (3 giờ) → Bảng kết quả

**Phùng Văn Vượng** (6 giờ)

- [ ] T199 Sửa lỗi backend còn tồn (3 giờ) → Bug đã đóng
- [ ] T200 Thông báo lỗi tiếng Việt có dấu cho backend (3 giờ) → Thông báo chuẩn hóa

**Lê Tiến Đức** (6 giờ)

- [ ] T201 Sửa lỗi giao diện còn tồn (3 giờ) → Bug đã đóng
- [ ] T202 Trạng thái rỗng, thông báo lỗi thống nhất (3 giờ) → UI thống nhất

**Lê Duy Minh** (6 giờ)

- [ ] T203 Chạy thử docker compose up từ đầu trên máy sạch (3 giờ) → Hệ thống lên chỉ bằng README
- [ ] T204 Sửa lỗi triển khai phát sinh (3 giờ) → Bug đã đóng

## Thứ Ba 17/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T205 Chạy lại E2E, tải 50 request và Lighthouse trên bản cuối (4 giờ) → Số liệu cập nhật
- [ ] T206 Cập nhật báo cáo kiểm thử (2 giờ) → Báo cáo cập nhật

**Phùng Văn Vượng** (6 giờ)

- [ ] T207 Đơn PENDING tự hết hạn hoặc cảnh báo khi giảm số phòng (tùy chọn) (6 giờ) → Bỏ nếu không kịp

**Lê Tiến Đức** (6 giờ)

- [ ] T208 Kiểm tra lại responsive và trình duyệt sau khi sửa (3 giờ) → Bảng trình duyệt đạt
- [ ] T209 README frontend: cách chạy, cấu trúc thư mục (3 giờ) → README frontend

**Lê Duy Minh** (6 giờ)

- [ ] T210 Hướng dẫn chạy dự án và README tổng (3 giờ) → README cập nhật
- [ ] T211 Rà soát lại bảo mật và secret lần cuối (3 giờ) → Không có bí mật

## Thứ Tư 18/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T212 Hoàn thiện SRS và tài liệu quản trị dự án theo bản cuối (4 giờ) → Tài liệu bản cuối
- [ ] T213 Cập nhật trạng thái thật trên bảng công việc (2 giờ) → Trạng thái đúng thực tế

**Phùng Văn Vượng** (6 giờ)

- [ ] T214 Rà soát và bổ sung test thiếu (3 giờ) → Test xanh
- [ ] T215 Tối ưu truy vấn nếu chưa đạt hiệu năng (3 giờ) → NFR-01 đạt

**Lê Tiến Đức** (6 giờ)

- [ ] T216 Sửa lỗi giao diện phát sinh khi kiểm tra cuối (3 giờ) → Bug đã đóng
- [ ] T217 Chụp ảnh giao diện cuối cho báo cáo (3 giờ) → Ảnh giao diện

**Lê Duy Minh** (6 giờ)

- [ ] T218 Pipeline xanh trên main và kiểm tra image GHCR (3 giờ) → Actions xanh
- [ ] T219 Chụp ảnh minh chứng cuối (3 giờ) → Ảnh minh chứng

## Thứ Năm 19/11/2026

**Nguyễn Thạc Hưng** (6 giờ)

- [ ] T220 Rà soát lịch sử commit và đóng góp của 4 thành viên (3 giờ) → Báo cáo đóng góp
- [ ] T221 Chuẩn bị nội dung demo và bài nộp (3 giờ) → Kịch bản demo

**Phùng Văn Vượng** (6 giờ)

- [ ] T222 Chuẩn bị phần trình bày backend, ERD, API (3 giờ) → Nội dung trình bày
- [ ] T223 Sửa lỗi phút chót phía backend (3 giờ) → Không còn lỗi mở

**Lê Tiến Đức** (6 giờ)

- [ ] T224 Chuẩn bị phần trình bày giao diện và luồng người dùng (3 giờ) → Nội dung trình bày
- [ ] T225 Sửa lỗi phút chót giao diện (3 giờ) → Không còn lỗi mở

**Lê Duy Minh** (6 giờ)

- [ ] T226 Chuẩn bị phần trình bày DevOps, CI/CD, triển khai (3 giờ) → Nội dung trình bày
- [ ] T227 Gắn tag v1.0 và kiểm tra bản phát hành (3 giờ) → Tag v1.0

## Thứ Sáu 20/11/2026

**Nguyễn Thạc Hưng** (4 giờ)

- [ ] T228 Họp nộp bài, kiểm tra checklist tiêu chí hoàn thành (2 giờ) → Checklist đủ
- [ ] T229 Nộp Proposal, SRS, liên kết GitHub và bảng công việc (2 giờ) → Đã nộp bài

**Phùng Văn Vượng** (2 giờ)

- [ ] T230 Demo phần backend cho giảng viên (2 giờ) → Demo xong

**Lê Tiến Đức** (2 giờ)

- [ ] T231 Demo phần giao diện cho giảng viên (2 giờ) → Demo xong

**Lê Duy Minh** (2 giờ)

- [ ] T232 Demo triển khai và CI/CD cho giảng viên (2 giờ) → Demo xong

