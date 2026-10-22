# Danh sách task Trello – QuickStay (nhóm 4 người, hoàn thiện trong 3 ngày: 21–23/10/2026)

Board: https://trello.com/b/7RbgJrxa/my-trello-board
Repo: https://github.com/Zn101/QuickStay-Project

Cách nhập nhanh: tạo các list theo tên bên dưới. Trong mỗi list bấm "Add a card", dán nguyên khối dòng của list đó, Trello sẽ hỏi tạo nhiều thẻ (mỗi dòng một thẻ).

Quy ước: `[Hưng]` Team Lead/AI/QA, `[Vượng]` Backend/Database, `[Đức]` Frontend, `[Minh]` DevOps/Backend hỗ trợ, `[All]` cả nhóm. Số trong ngoặc là ngày hạn (tháng 10).

Nhãn gợi ý: Backend (xanh dương), Frontend (xanh lá), Database (vàng), DevOps (tím), QA (cam), AI (hồng), Docs (xám).

Nguyên tắc 3 ngày: cuối mỗi ngày phải có một bản chạy được trên nhánh dev. Làm theo thứ tự ưu tiên: luồng đặt phòng và admin trước, AI sau cùng. Nếu thiếu thời gian, cắt phần ghi chú "(cắt nếu thiếu giờ)".

## List: Ngày 1 – 21/10 (nền tảng, đăng nhập, xem khách sạn)

```
[All] (21) Họp nhóm 30 phút: chốt API contract, quy ước nhánh feature/* và PR vào dev
[Hưng] (21) Mời 3 thành viên vào repo, tạo nhánh main và dev, mở quyền xem Trello cho giảng viên
[Minh] (21) docker-compose.yml: mysql + backend + frontend chạy được một lệnh
[Minh] (21) Dockerfile backend (Gradle + JDK) và frontend (multi-stage Node + Nginx)
[Minh] (21) GitHub Actions: build backend + frontend khi push, chạy test cơ bản
[Vượng] (21) Khởi tạo Spring Boot, kết nối MySQL qua biến môi trường
[Vượng] (21) Tạo bảng users, hotels, rooms, bookings và dữ liệu mẫu
[Vượng] (21) Auth: đăng ký, đăng nhập, BCrypt, JWT có hạn
[Minh] (21) Spring Security: phân quyền CUSTOMER/ADMIN, cấu hình CORS
[Vượng] (21) API danh sách, chi tiết, tìm kiếm khách sạn (tên, thành phố)
[Đức] (21) Khởi tạo React + Vite + Tailwind + Zustand + React Router, layout chung
[Đức] (21) Trang đăng nhập, đăng ký nối API Auth
[Đức] (21) Trang danh sách khách sạn dạng lưới + thanh tìm kiếm
[Hưng] (21) Viết test case cho Auth, tìm kiếm, đặt phòng, admin (bảng: mã, bước, kết quả mong đợi)
[Hưng] (21) Điền link Repo và Trello vào Proposal, kiểm tra lại file
```

## List: Ngày 2 – 22/10 (đặt phòng, admin, AI)

```
[Vượng] (22) API phòng trống theo checkIn/checkOut
[Vượng] (22) API đặt phòng: kiểm tra trùng lịch trong transaction, trạng thái PENDING
[Vượng] (22) API lịch sử đặt phòng, hủy đặt phòng, xem/cập nhật hồ sơ cá nhân
[Vượng] (22) API admin: CRUD khách sạn và phòng
[Minh] (22) API admin: danh sách đặt phòng, đổi trạng thái PENDING → CONFIRMED → CHECKED_IN → COMPLETED/CANCELLED
[Minh] (22) Logging SLF4J/Logback cho Exception quan trọng
[Đức] (22) Trang chi tiết khách sạn, chọn ngày, hiển thị phòng trống
[Đức] (22) Trang đặt phòng (họ tên, số điện thoại, ghi chú, tổng tiền)
[Đức] (22) Trang lịch sử đặt phòng và hồ sơ cá nhân
[Đức] (22) Dashboard admin: quản lý khách sạn/phòng và đặt phòng
[Hưng] (22) Tích hợp Spring AI: API sinh mô tả khách sạn/phòng
[Hưng] (22) Chatbot hỏi đáp về khách sạn, phòng, giá (cắt nếu thiếu giờ)
[Đức] (22) Nút "Tạo mô tả bằng AI" ở form admin, cửa sổ chatbot (cắt nếu thiếu giờ)
[Hưng] (22) Kiểm thử thủ công các API và màn hình đã xong, ghi lỗi vào list Bug
[Minh] (22) Workflow đẩy Docker image lên registry khi push main
```

## List: Ngày 3 – 23/10 (kiểm thử, sửa lỗi, nộp bài)

```
[All] (23) Sáng: sửa lỗi QA đã ghi nhận, khóa tính năng mới lúc 12h
[Vượng] (23) Unit test và integration test backend (đủ cho tỉ lệ test đạt từ 80%)
[Đức] (23) Responsive mobile/tablet/desktop, kiểm tra Chrome và Edge
[Hưng] (23) Kiểm thử E2E toàn luồng: đăng ký → tìm → đặt phòng → admin xác nhận
[Hưng] (23) Kiểm thử tải 50 request đồng thời và đo Lighthouse (FCP dưới 2 giây)
[Hưng] (23) Báo cáo kết quả kiểm thử (tỉ lệ đạt từ 80% trở lên)
[Minh] (23) Merge dev vào main, pipeline xanh, chạy docker compose up toàn hệ thống
[Minh] (23) Chụp ảnh minh chứng: Actions xanh, website chạy, docker compose ps
[Hưng] (23) Rà soát lịch sử commit của cả 4 người và cập nhật Trello
[Hưng] (23) NỘP BÀI: Proposal + link GitHub + link Trello (hạn 23/10/2026)
```

## List: Bug / In Progress / Review & Testing / Done

Tạo 4 list trống: Bug, In Progress, Review & Testing, Done.

Quy tắc: kéo thẻ sang In Progress khi bắt đầu, sang Review & Testing khi đã tạo pull request vào dev, sang Done khi đã merge và Hưng (QA) xác nhận. Lỗi QA phát hiện được tạo thẻ trong list Bug và gán cho người phụ trách.
