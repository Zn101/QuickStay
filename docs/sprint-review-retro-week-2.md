# Sprint Review & Retrospective — Tuần 2

**Dự án:** QuickStay · **Repository:** Zn101/QuickStay  
**Thời gian Sprint:** 02/11/2026 – 06/11/2026  
**Ngày lập biên bản:** 06/11/2026  
**Người lập:** Lê Duy Minh (T135)  
**Người tham dự:** *(cần bổ sung danh sách thành viên có mặt tại buổi họp)*

> **Nguyên tắc:** Chỉ ghi nhận task đã có bằng chứng trong repository (commit, báo cáo kiểm thử, file artifact). Các phần cần nhóm xác nhận được đánh dấu rõ ràng.

---

## 1. Sprint Review — Tổng kết kết quả tuần 2

### 1.1. Mục tiêu Sprint tuần 2

Dựa trên action items từ Sprint tuần 1 và kế hoạch dự án, Sprint tuần 2 tập trung vào:

1. Hoàn thiện các API Admin (UC09, UC10, UC11).
2. Kiểm thử tổng hợp và sửa bug Admin backend.
3. Tăng cường bảo mật (CORS, secret, .gitignore).
4. Chuẩn bị môi trường triển khai (Docker, GHCR, VPS).
5. Xây dựng API đặt phòng, hủy đơn, lịch sử booking (Vượng).
6. Hoàn thiện giao diện Admin và các trang Frontend (Đức).

---

### 1.2. Task của Minh – Có bằng chứng hoàn thành

| Task | Mô tả | Ngày | Bằng chứng |
|------|-------|------|-----------|
| **T082** | POST/PUT `/api/admin/hotels` (Thêm/Sửa khách sạn) | 02/11 | Commit `4d9fb39`; 19 test pass |
| **T083** | GET/DELETE `/api/admin/hotels` (Danh sách/Xóa khách sạn) | 02/11 | Commit `4d9fb39`; 34 test pass |
| **T094** | POST/PUT `/api/admin/rooms` (Thêm/Sửa loại phòng) | 04/11 | Commit `73f0658`; 29 test pass |
| **T095** | GET/DELETE `/api/admin/rooms` (Danh sách/Xóa loại phòng) | 04/11 | Commit `73f0658`; 43 test pass |
| **T106** | GET `/api/admin/bookings` (Danh sách tất cả đơn) | 04/11 | Commit `9427ed9`; 11 test pass |
| **T107** | PATCH `/api/admin/bookings/{id}/status` (Đổi trạng thái đơn) | 04/11 | Commit `9427ed9`; 18 test pass |
| **T108** | Kiểm thử tổng hợp UC09/UC10/UC11 (106 test cases) | 04/11 | Báo cáo `T108-admin-api-test-report.md`; 152/152 pass |
| **T069** | Security review: .gitignore, .env.example | 05/11 | Commit `ed5c820`; báo cáo `T069-security-review.md` |
| **T120** | Test HTTP 400/404/409 error handling (23 test cases) | 05/11 | Commit `ed5c820`; 175/175 pass |
| **T121** | GitHub Actions CD workflow push Docker image lên GHCR | 05/11 | Commit `ed5c820`; `.github/workflows/cd-docker.yml` |
| **T132** | Test CORS (14 test cases) | 06/11 | Báo cáo `T132-cors-test-report.md`; 256/256 pass |
| **T133** | Fix Bug Admin: BUG-01 (filter hotelId), BUG-02 (409 message) | 06/11 | Báo cáo `T133-admin-bug-fix-report.md`; 260/260 pass |
| **T134** | Chuẩn bị môi trường triển khai: Dockerfile, docker-compose.prod.yml | 06/11 | Báo cáo `T134-deployment-environment-report.md` |
| **T135** | Sprint Review & Retrospective tuần 2 | 06/11 | Tài liệu này |

**Tổng Minh: 14 task hoàn thành có bằng chứng**

---

### 1.3. Task của các thành viên khác – Có bằng chứng trong Git history

| Task | Mô tả | Người thực hiện | Commit / Bằng chứng |
|------|-------|----------------|---------------------|
| **T087, T088, T089** | API đặt phòng POST /bookings, tính tổng tiền, tạo đơn PENDING | Vượng | `3978c24` |
| **T090** | Test validate đặt phòng | Vượng | `76561ab` |
| **T100, T101** | Chống đặt trùng (khóa phòng PESSIMISTIC_WRITE, 409) + API lịch sử | Vượng | `b1a71b9` |
| **T102** | Test đặt phòng trùng ngày, kỳ nghỉ liền nhau | Vượng | `0401e58` |
| **T112** | API hủy đơn có khóa bản ghi | Vượng | `a9803ad` |
| **T113** | Test hủy đơn (của mình, của người khác, đã xác nhận) | Vượng | `dc59648` |
| **T114** | Test nhiều phòng cùng loại đặt song song | Vượng | `3036f79` |
| **T103, T104, T105** | Nâng cấp giao diện (Đức) | Đức | `b5798cd` |
| **T115, T116, T117, T118** | Update code (Đức) | Đức | `ffd06b4` |
| Frontend Admin | BookingAdminController GET + PATCH `/api/admin/bookings` | Đức | `fd8f072` |
| Frontend fix | @EntityGraph cho findByUserId, API xem và hủy đặt phòng | Đức | `c8c9b05`, `f6158dc` |

---

### 1.4. Task chưa xác nhận hoặc chưa có bằng chứng

| Task | Mô tả | Người phụ trách | Ghi chú |
|------|-------|----------------|---------|
| Action items từ tuần 1 (A01–A08) | Commit message, wireframe, E2E test, branch protection | Cả nhóm | Cần xác nhận trạng thái từng action item |
| T043 | JwtAuthFilter trên nhánh gốc | Minh | Đã implement trong T082, nhưng trên nhánh gốc ban đầu chưa có |
| Kiểm thử thủ công UC01–UC08 | Test case thủ công | Hưng | Không thấy file trong repo |
| SRS UC01–UC08 | Đặc tả các UC còn lại | Hưng | Không thấy file trong repo |

---

### 1.5. Sản phẩm đầu ra tuần 2

| Sản phẩm | Trạng thái | Ghi chú |
|----------|-----------|---------|
| **Admin Hotel API** (4 endpoint) | ✅ Hoàn thành + test | 34 test cases |
| **Admin Room API** (4 endpoint) | ✅ Hoàn thành + test | 47 test cases |
| **Admin Booking API** (2 endpoint) | ✅ Hoàn thành + test | 29 test cases |
| **Booking API** (đặt, hủy, lịch sử) | ✅ Hoàn thành + test | Vượng |
| **CORS configuration** | ✅ Verified | 14 test cases |
| **Error handling 400/404/409** | ✅ Verified | 23 test cases |
| **Security review** | ✅ Hoàn thành | Không phát hiện secret bị lộ |
| **CD GitHub Actions** | ✅ File tạo xong | Chờ merge vào `main` để chạy |
| **docker-compose.prod.yml** | ✅ Tạo mới | Dùng GHCR image, MySQL không expose |
| **backend/.dockerignore** | ✅ Tạo mới | Bảo vệ secret khỏi image |
| **README – VPS guide** | ✅ Cập nhật | Hướng dẫn đầy đủ từ máy sạch |
| **Bug fix Admin** | ✅ 2 bug đã sửa | BUG-01 filter hotelId, BUG-02 message 409 |
| **Tổng backend test** | ✅ **260/260 PASSED** | Tính đến cuối Sprint tuần 2 |

---

### 1.6. Số liệu Sprint tuần 2

| Chỉ số | Giá trị |
|--------|---------|
| Task Minh hoàn thành (có bằng chứng) | 14 task |
| Pull Request merge (tuần 2) | PR #13, #16, #17, #19, #21 |
| Backend test pass (cuối tuần 2) | 260 / 260 (100%) |
| Test case mới thêm tuần 2 | ~108 test cases |
| Bug phát hiện và sửa | 2 bug (BUG-01, BUG-02) |
| File báo cáo kiểm thử tạo mới | 7 file trong `docs/test-reports/` |
| Không có secret bị lộ | Xác nhận qua T069 |

---

## 2. Sprint Retrospective

### 2.1. What went well — Những điều đã làm tốt ✅

1. **Test coverage tăng mạnh:** Backend tăng từ 46 (tuần 1) lên 260 test cases (tuần 2) — tăng hơn 5 lần, tất cả 100% pass. Phát hiện và sửa 2 bug thực tế từ quá trình viết test.

2. **API Admin hoàn chỉnh:** Tất cả 10 endpoint Admin (Hotel, Room, Booking) đã có đầy đủ CRUD, phân quyền đúng (401/403/404/409) và test coverage tốt.

3. **Bảo mật được kiểm tra có hệ thống:** T069 (security review) và T132 (CORS test) xác nhận không có secret bị lộ và cấu hình CORS hoạt động đúng.

4. **Commit message cải thiện:** Các commit tuần 2 của Minh có mã task rõ ràng (`T082, T083`, `T094, T095`, `T069, T120, T121`).

5. **Chuẩn bị triển khai chủ động:** `docker-compose.prod.yml`, `backend/.dockerignore`, hướng dẫn VPS — môi trường triển khai sẵn sàng trước khi có VPS thật.

6. **Báo cáo kiểm thử đầy đủ:** 7 file báo cáo trong `docs/test-reports/` với bằng chứng cụ thể, không tự đánh dấu Pass khi chưa kiểm tra.

7. **Chống đặt trùng phòng:** Vượng hoàn thành T100 (PESSIMISTIC_WRITE lock) và T112 (hủy đơn có khóa bản ghi) — tính năng nghiệp vụ quan trọng.

### 2.2. What didn't go well — Những khó khăn và hạn chế ⚠️

1. **GHCR image chưa được publish:** Workflow `cd-docker.yml` chỉ trigger trên `main` — chưa có merge nên runtime test T134 phần lớn là Not Run.

2. **Action items tuần 1 chưa được xác nhận:** Chưa rõ A01 (E2E test), A03 (wireframe), A04 (biên bản họp), A05 (branch protection) từ tuần 1 đã xử lý chưa.

3. **Commit message của một số thành viên vẫn chưa nhất quán:** `update code Task ID T115 T116 T117 T118` gộp 4 task vào 1 commit, khó truy vết từng task.

4. **Chưa có SSL/HTTPS:** `docker-compose.prod.yml` chỉ hỗ trợ HTTP. Cần Nginx/Caddy bên ngoài cho production thật.

5. **Runtime kiểm thử Docker Compose chưa được xác nhận:** Do image GHCR chưa có, phần kiểm tra runtime trong T134 ghi Not Run.

6. **Thiếu thông tin về tiến độ các thành viên khác:** Hưng không có commit nào trong tuần 2 được ghi nhận trong Git history khảo sát được.

### 2.3. What to improve — Đề xuất cải thiện tuần 3 🔧

1. **Merge vào `main` để trigger CD workflow:** Tạo PR từ `recovery/clean-dev` → `main` để `cd-docker.yml` chạy và publish GHCR image.

2. **Runtime test Docker Compose:** Sau khi có GHCR image, chạy `docker compose -f docker-compose.prod.yml up -d` và kiểm tra health endpoint thực tế.

3. **Thêm HTTPS/SSL:** Tích hợp Certbot + Let's Encrypt hoặc Caddy vào cấu hình production.

4. **Giải quyết action items còn tồn đọng từ tuần 1:** A01 (E2E test), A03 (wireframe), A05 (branch protection).

5. **Mỗi task một commit:** Tránh gộp nhiều task vào 1 commit để dễ review và rollback.

6. **Cập nhật bảng công việc (Trello/Lark):** Đảm bảo trạng thái task trên board đồng bộ với Git history.

---

## 3. Action Items — Công việc cần xử lý

| STT | Công việc cần xử lý | Người phụ trách | Hạn xử lý | Trạng thái |
|-----|---------------------|----------------|-----------|------------|
| A09 | Merge `recovery/clean-dev` → `main` để trigger CD workflow | Hưng (repo admin) | Chưa thống nhất | ⏳ Chưa bắt đầu |
| A10 | Chạy runtime test Docker Compose sau khi có GHCR image | Minh | Sau A09 | ⏳ Chờ A09 |
| A11 | Cấu hình HTTPS/SSL cho production | Chưa phân công | Chưa thống nhất | ⏳ Chưa bắt đầu |
| A12 | Xác nhận trạng thái Action Items tuần 1 (A01–A08) | Cả nhóm | Chưa thống nhất | ⏳ Cần xác nhận |
| A13 | Push code T132, T133, T134 lên `minh/assigned-tasks` + tạo PR | Minh | Chưa thống nhất | ⏳ Chờ xác nhận |
| A14 | Kiểm thử E2E thủ công toàn luồng (đăng ký → đặt phòng → admin xác nhận) | Cả nhóm | Chưa thống nhất | ⏳ Chưa bắt đầu |
| A15 | Hoàn thiện SRS và test case thủ công UC01–UC08 | Hưng | Chưa thống nhất | ⏳ Chưa xác nhận |

> **Lưu ý:** Người phụ trách và hạn xử lý cần được nhóm thống nhất tại buổi họp. Các mục "Chưa phân công" / "Chưa thống nhất" cần được bổ sung trong buổi Sprint Planning tuần 3.

---

## 4. Kết luận

### Đánh giá tổng quan Sprint tuần 2

Sprint tuần 2 đạt kết quả **tốt về mặt kỹ thuật backend**:
- Toàn bộ Admin API (UC09/UC10/UC11) đã hoàn thiện, có test và báo cáo kiểm thử.
- Booking API (đặt phòng, hủy, lịch sử) được Vượng hoàn thành với tính năng chống đặt trùng.
- Backend test coverage đạt 260/260 (100%), không có regression.
- Bảo mật và cấu hình triển khai được chuẩn bị.

### Vấn đề ưu tiên giải quyết

1. **Merge vào `main` và publish GHCR image** — cần thiết để hoàn tất T134 runtime test.
2. **Xác nhận action items tuần 1** — một số vẫn chưa có bằng chứng hoàn thành.
3. **Kiểm thử E2E toàn luồng** — cần có trước khi demo hoặc nộp sản phẩm.

### Định hướng Sprint tuần 3

*(Cần nhóm xác nhận trong buổi Sprint Planning)*

- Triển khai thực tế trên VPS (nếu có) hoặc máy demo.
- Hoàn thiện Frontend còn thiếu.
- Kiểm thử E2E toàn luồng.
- Chuẩn bị demo và tài liệu nộp báo cáo cuối.
- Giải quyết các bug còn tồn đọng.

---

## 5. Thông tin cần bổ sung

> Các phần dưới đây cần thành viên điền thêm trước hoặc trong buổi họp Sprint Review.

- **Thành viên có mặt tại Sprint Review:**
  `[ ] Nguyễn Thạc Hưng  [ ] Phùng Văn Vượng  [ ] Lê Tiến Đức  [ ] Lê Duy Minh`

- **Demo đã trình bày:** *(Liệt kê tính năng demo trong buổi họp)*

- **Phản hồi từ giảng viên / khách mời:** *(Ghi lại nếu có)*

- **Quyết định điều chỉnh scope tuần 3:** *(Nếu có thay đổi so với kế hoạch)*

- **Velocity thực tế tuần 2 (story points hoặc giờ):** *(Cần dữ liệu từ bảng công việc Trello/Lark)*

---

*Tài liệu do Lê Duy Minh tổng hợp dựa trên Git history, báo cáo kiểm thử và các artifact trong repository. Phản ánh trạng thái tại 06/11/2026. Các thông tin chưa xác minh được đánh dấu rõ ràng và cần nhóm bổ sung trước khi sử dụng làm biên bản chính thức.*
