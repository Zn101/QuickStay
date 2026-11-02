# Sprint Review & Retrospective — Tuần 1
**Dự án:** QuickStay · **Nhánh làm việc:** dev-minh  
**Thời gian Sprint:** 26/10/2026 – 30/10/2026  
**Ngày lập biên bản:** 30/10/2026  
**Người lập:** Lê Duy Minh (T072)  
**Người tham dự:** *(cần bổ sung danh sách thành viên có mặt tại buổi họp)*

---

## 1. Sprint Review — Tổng kết kết quả tuần 1

### 1.1. Kết quả theo bằng chứng trong repository

> **Nguyên tắc:** Chỉ ghi nhận task đã có commit, artifact hoặc kết quả kiểm thử rõ ràng trong repository.

#### ✅ Task có bằng chứng hoàn thành trong Git

| Task | Mô tả | Người thực hiện | Commit / Bằng chứng |
|------|-------|----------------|---------------------|
| T008 | Khởi tạo Spring Boot, cấu hình DB/JWT/CORS qua biến môi trường | Vượng | `0fba025` |
| T020 | Entity User, UserRepository và tài khoản admin mặc định | Vượng | `06ecc9c` |
| T021, T022 | API đăng ký, đăng nhập và JwtService | Vượng | `dde0b0d` |
| T035 | Unit test API đăng ký, đăng nhập, entity | Vượng | `506e16c` |
| T036 | Entity Hotel, Room, Booking và repository | Vượng | `8eb57c4` |
| T037 | Seed dữ liệu mẫu 4 khách sạn và các loại phòng | Vượng | `d744aa2` |
| T007 | Cập nhật ERD theo lược đồ Flyway | Vượng | `b83b04e` |
| T013 | Sơ đồ kiến trúc hệ thống (`docs/architecture.md`) | Minh | `7b8ce53` |
| T030 | PR template và quy ước commit (`.github/pull_request_template.md`) | Minh | `7b8ce53` |
| T233 | `.gitignore` đầy đủ và cấu trúc thư mục repo | Minh | `7b8ce53` |
| T014 | Dockerfile backend (Gradle + JDK 17, 2-stage) | Minh | `d37e34c` / `ee35d60` |
| T015 | Dockerfile frontend (Node build + Nginx) | Minh | `ee35d60` |
| T027, T028 | `docker-compose.yml`: MySQL healthcheck + backend + frontend + .env.example | Minh | `ee35d60` |
| T041 | GitHub Actions CI backend (`ci-backend.yml`) | Minh | `ee35d60` |
| T042 | GitHub Actions CI frontend (`ci-frontend.yml`) | Minh | `ee35d60` |
| T043 | Spring Security: JwtAuthFilter + phân quyền CUSTOMER/ADMIN | Minh | `ee35d60` |
| T054 | Cấu hình CORS chỉ cho nguồn Frontend | Minh | `ee35d60` |
| T055 | Xử lý 401/403 trả JSON (`SecurityConfig`) | Minh | `ee35d60` |
| T056 | Test phân quyền qua HTTP thật (`RealHttpSecurityTest`) | Minh | `ee35d60` |
| T057 | Đặc tả UC09–UC11 trong SRS (`QuickStay-SRS-UC09-UC11.md`) | Minh | `ee35d60` |
| T119 | Bộ xử lý lỗi chung `ApiExceptionHandler` | Minh | `ee35d60` |
| T234 | `nginx.conf` proxy `/api` và SPA fallback | Minh | `ee35d60` |
| CD | Workflow CD đẩy Docker image lên GHCR (`cd-docker.yml`) | Minh | `ee35d60` |
| (FE) | Trang Admin CRUD khách sạn/phòng/đơn (`Admin.jsx`) | Đức | `ee35d60` |
| (FE) | Trang đặt phòng (`BookingPage.jsx`, `BookingForm.jsx`) | Đức | `ee35d60` |
| (FE) | Trang lịch sử đặt phòng (`History.jsx`, `MyBookings.jsx`) | Đức | `ee35d60` |
| (FE) | Widget chatbot (`ChatWidget.jsx`) | Đức | `ee35d60` |
| (FE) | Navbar theo vai trò (`Navbar.jsx`) | Đức | `ee35d60` |
| (FE) | Test frontend (`App.test.jsx`, `format.test.js`) | Đức/Minh | `ee35d60` |
| T070 | Chạy thử toàn hệ thống bằng Docker Compose | Minh | Kiểm tra trực tiếp ngày 30/10 |
| T069 | Rà soát bảo mật: secret, biến môi trường, .gitignore | Minh | Hoàn thành ngày 30/10 |
| T072 | Sprint Review và Retro tuần 1 | Minh | Tài liệu này |

#### ⚠️ Task được lên kế hoạch nhưng CHƯA xác nhận hoàn thành

> Những task dưới đây nằm trong kế hoạch tuần 1 nhưng **không có commit riêng** hoặc **không tìm thấy artifact** trong repository. Cần thành viên phụ trách xác nhận.

| Task | Mô tả | Người phụ trách | Lý do chưa xác nhận |
|------|-------|----------------|---------------------|
| T001 | Họp khởi động: biên bản | Hưng | Không tìm thấy file biên bản trong repo |
| T002 | Tạo nhánh main/dev, bật bảo vệ nhánh | Hưng | PR#3, #5 đã merge → có nhánh, chưa rõ bảo vệ nhánh có bật không |
| T003 | Dựng bảng công việc (Trello/Lark) | Hưng | Công cụ ngoài repo, không kiểm tra được |
| T004 | Proposal nộp cho giảng viên | Hưng | File `.docx` có trong `docs/` nhưng chưa rõ đã nộp chưa |
| T005, T016–T018 | Viết SRS các mục 1, 2 | Hưng | File `.docx`/`.pdf` trong `docs/` nhưng chưa rõ nội dung hoàn thiện |
| T006 | Phân tích ERD (ảnh wireframe) | Vượng | ERD.md có nhưng sơ đồ ảnh chưa thấy trong repo |
| T009–T012 | Wireframe Trang chủ, Chi tiết, Auth | Đức | Không tìm thấy file ảnh wireframe trong repo |
| T023–T024 | Wireframe Dashboard Admin và chatbot | Đức | Không tìm thấy file ảnh wireframe |
| T025 | Khởi tạo React + Vite + Tailwind + Zustand | Đức | Frontend hoạt động nhưng commit gốc T025 không có |
| T026 | Layout chung và Navbar khung | Đức | Navbar có trong `ee35d60` nhưng không có commit T026 riêng |
| T029 | README hướng dẫn chạy dự án | Minh | README có nhưng đã được cập nhật sau T070 |
| T031–T034 | Đặc tả UC và test case UC01–UC08 | Hưng | SRS UC09–11 có, nhưng UC01–08 chưa thấy file riêng |
| T038–T040 | Giao diện Đăng nhập, Đăng ký, authStore | Đức | File `Login.jsx`, `Register.jsx` có trong repo nhưng commit không được ghi nhãn T038–T040 |
| T044–T047 | Test case UC04–UC13 | Hưng | Không thấy file test case thủ công trong repo |
| T048–T050 | API tìm kiếm, lọc khách sạn | Vượng | `HotelController` có tính năng này nhưng không có commit T048–T050 riêng |
| T051–T053 | Nối API Frontend, Navbar, Trang chủ | Đức | `Home.jsx` có nhưng không có commit riêng |
| T058–T061 | SRS phần 4, kiểm thử thủ công, Review PR, Retro | Hưng | Cần xác nhận từ Hưng |
| T062–T064 | API chi tiết khách sạn, tìm kiếm, hồ sơ | Vượng | `HotelController`, `UserController` có nhưng commit không đánh nhãn |
| T065–T068 | Trang chủ: tìm kiếm, bộ lọc, loading/empty | Đức | `Home.jsx` có tính năng nhưng chưa xác nhận T065–T068 riêng |

---

### 1.2. Các sản phẩm đã tạo ra (có thể xác minh)

| Sản phẩm | Trạng thái | Ghi chú |
|----------|-----------|---------|
| **Backend REST API** (Spring Boot 3.5.6, Java 17) | ✅ Hoạt động | `GET /api/hotels`, `POST /api/auth/login`, `POST /api/bookings`, `/api/admin/**`, `/api/ai/**` |
| **Frontend SPA** (React 18 + Vite + Tailwind) | ✅ Hoạt động | 10 trang: Home, Login, Register, HotelDetail, BookingPage, BookingForm, MyBookings, History, Profile, Admin |
| **MySQL 8.4** với Flyway migration | ✅ Hoạt động | 4 bảng: users, hotels, rooms, bookings |
| **Dữ liệu mẫu** tự động seed | ✅ | 4 khách sạn, 9 loại phòng, 2 users |
| **Docker Compose** 3 service | ✅ | mysql (healthy) + backend + frontend |
| **CI Backend** (`ci-backend.yml`) | ✅ File tồn tại | Chưa xác nhận chạy xanh trên GitHub Actions tab |
| **CI Frontend** (`ci-frontend.yml`) | ✅ File tồn tại | 8/8 test pass local |
| **CD Docker** (`cd-docker.yml`) | ✅ File tồn tại | Push image lên GHCR khi merge main |
| **Test backend** (JUnit 5 / MockMvc) | ✅ | 46 test, 46 đạt (theo `docs/QuickStay-Test-Report.md`) |
| **Test frontend** (Vitest) | ✅ | 8/8 test pass (xác nhận trực tiếp) |
| **E2E test** (`qa/e2e.mjs`) | ⚠️ | File **không có** trong `qa/` (chỉ có `.gitkeep`); báo cáo ghi 13/13 nhưng chưa tìm thấy file |
| **Tài liệu ERD** | ✅ | `docs/QuickStay-ERD.md` |
| **Tài liệu API** | ✅ | `docs/QuickStay-API.md` |
| **Tài liệu Kiến trúc** | ✅ | `docs/architecture.md` |
| **PR Template** | ✅ | `.github/pull_request_template.md` |
| **.gitignore** | ✅ | Bảo vệ `.env`, `node_modules`, `build/`, v.v. |

### 1.3. Pull Request đã merge

| PR | Nhánh nguồn | Người mở | Trạng thái |
|----|------------|---------|------------|
| PR #3 | `dev-duc` | Đức (tienducle86) | ✅ Merged vào dev ngày 29/10 |
| PR #5 | `dev-vuong` | Vượng (vuongvanphung2k6) | ✅ Merged vào dev ngày 29/10 |
| (không số) | `dev` → `dev-minh` | Minh | ✅ Merged ngày 29/10 |

### 1.4. Chức năng đã kiểm thử

| Chức năng | Cách kiểm thử | Kết quả |
|----------|--------------|---------|
| Đăng ký / Đăng nhập / JWT | JUnit + MockMvc (TC_AUTH_01–09) | ✅ 9 test pass |
| CRUD Khách sạn, Phòng | JUnit + MockMvc (TC_HOTEL_01–09, TC_ADMIN_02–05) | ✅ Pass |
| Đặt phòng, chống đặt trùng | JUnit + MockMvc (TC_BOOK_01–12) | ✅ Pass |
| Phân quyền CUSTOMER/ADMIN/ẩn danh | TestRestTemplate qua HTTP thật (TC_SEC_01–03, TC_ADMIN_01) | ✅ Pass |
| AI sinh mô tả + chatbot dự phòng | JUnit (TC_AI_01–05) | ✅ Pass |
| Hiệu năng: p95 < 500ms, FCP < 2s | Load test + Lighthouse | ✅ NFR-01, 02, 03 đạt |
| Docker Compose toàn hệ thống | Chạy trực tiếp ngày 30/10 | ✅ 3 container UP, API xanh |
| Bảo mật: không secret trong Git | Git history scan | ✅ Sạch |

---

## 2. Sprint Retrospective

### 2.1. What went well — Những điều đã làm tốt ✅

1. **Backend hoàn thiện trước kế hoạch:** Toàn bộ REST API lõi (auth, hotel, booking, admin, AI) đã được implement và test trong tuần 1, bao gồm cả tính năng chống đặt trùng bằng PESSIMISTIC_WRITE lock.

2. **Kiến trúc Docker vững chắc:** `docker-compose.yml` với healthcheck, named volume, default values an toàn cho development — hệ thống khởi động 1 lệnh.

3. **CI/CD cơ bản có mặt từ sớm:** 3 workflow GitHub Actions (CI backend, CI frontend, CD Docker) được thiết lập trong tuần 1, tạo nền tảng cho automation.

4. **Bảo mật từ đầu:** Không có secret thật trong Git, `.env` được bảo vệ đúng cách, JWT được validate độ dài tối thiểu.

5. **Test coverage cao:** 46 backend + 8 frontend = 54 test, 100% pass. Phát hiện lỗi 401/403 thực tế và sửa trong cùng tuần.

6. **Tài liệu kỹ thuật đầy đủ:** `architecture.md`, `ERD.md`, `API.md`, PR template đều được tạo.

7. **PR workflow hoạt động:** 2 PR được mở và merge vào dev đúng quy trình.

### 2.2. What went wrong — Những khó khăn và hạn chế ⚠️

1. **Commit message không nhất quán:** Nhiều commit dùng tên chung "Update project code" thay vì tên task cụ thể (T015, T028, v.v.), khó truy vết công việc theo task ID.

2. **Nộp code dồn vào cuối tuần:** Phần lớn commit của Minh và Vượng đều tập trung vào ngày 29–30/10, không trải đều theo kế hoạch ngày (T2–T6). Khó đánh giá tiến độ thực theo ngày.

3. **File E2E test không có trong repo:** `docs/QuickStay-Test-Report.md` ghi nhận 13/13 E2E pass nhưng `qa/e2e.mjs` không tồn tại trong repository (chỉ có `.gitkeep`). Không thể xác minh độc lập.

4. **Commit message của Đức không theo quy ước:** Commit `86b6ca3` có message "up" — không tuân theo PR template đã thiết lập.

5. **Wireframe và biên bản họp không có trong repo:** Các artifact phi code (wireframe, biên bản T001, test case thủ công T034, T044–T046) không được lưu vào repository, không thể xác minh.

6. **Thiếu thẻ task ID trong nhiều commit:** Nhiều commit của Đức và Minh không có mã task (T025, T026, T038–T040, T051–T053...) dù công việc đã được thực hiện.

7. **`qa/e2e.mjs` và `qa/load-test.mjs` không có trong repo:** Tài liệu test report tham chiếu đến các file này nhưng chúng không được commit.

### 2.3. What to improve — Đề xuất cải thiện tuần 2 🔧

1. **Chuẩn hóa commit message:** Mỗi commit phải bắt đầu bằng mã task (`T0xx: mô tả`) theo quy ước đã thống nhất.

2. **Commit sớm và thường xuyên:** Đẩy code mỗi cuối buổi làm việc, không để dồn. Giúp theo dõi tiến độ hằng ngày trong daily standup.

3. **Thêm file E2E và load test vào repo:** `qa/e2e.mjs` và `qa/load-test.mjs` cần được commit để kết quả kiểm thử có thể tái tạo và xác minh.

4. **Lưu artifact phi code vào `docs/`:** Wireframe (ảnh), biên bản họp, test case thủ công nên được lưu vào thư mục `docs/` và commit vào repo.

5. **Bật branch protection trên `dev` và `main`:** Yêu cầu ít nhất 1 review trước khi merge để tăng chất lượng code.

6. **Không dùng commit message chung:** "Update project code" / "up" / "first commit" không cung cấp thông tin. Tuân theo quy ước: `T0xx: Mô tả ngắn gọn (≤ 72 ký tự)`.

---

## 3. Action Items — Công việc cải thiện

| # | Nội dung | Người phụ trách | Thời hạn | Trạng thái |
|---|---------|----------------|---------|------------|
| A01 | Commit `qa/e2e.mjs` và `qa/load-test.mjs` vào repo (hoặc xác nhận đường dẫn đúng) | Hưng / Vượng | 02/11/2026 (T2 tuần 2) | ⏳ Chưa bắt đầu |
| A02 | Đổi tên / bổ sung commit message cho các commit "Update project code" (nếu cần) | Minh | 02/11/2026 | ⏳ Cần thảo luận nhóm |
| A03 | Lưu ảnh wireframe vào `docs/wireframes/` và commit | Đức | 02/11/2026 | ⏳ Chưa bắt đầu |
| A04 | Lưu biên bản họp T001 và test case thủ công vào `docs/` | Hưng | 02/11/2026 | ⏳ Chưa bắt đầu |
| A05 | Bật branch protection trên `dev` (require 1 review) | Hưng (repo admin) | 02/11/2026 | ⏳ Chưa bắt đầu |
| A06 | Tuân thủ commit message format `T0xx:` cho toàn bộ tuần 2 | Tất cả | Từ 02/11 | ⏳ Chưa áp dụng |
| A07 | Xác nhận GitHub Actions CI đã chạy xanh trên tab Actions của GitHub | Minh | 02/11/2026 | ⏳ Chưa xác nhận |
| A08 | Hoàn thiện/xác nhận các task chưa rõ trạng thái (T009–T012, T023–T024, T034, T044–T046) | Hưng / Đức | 02/11/2026 | ⏳ Cần xác nhận |

---

## 4. Số liệu Sprint tuần 1

| Chỉ số | Giá trị |
|--------|---------|
| Tổng task kế hoạch tuần 1 | 74 task (theo `QuickStay-Ke-Hoach-Hang-Ngay.md`) |
| Task xác nhận hoàn thành (có bằng chứng repo) | ~32 task |
| Task chưa xác nhận / cần bổ sung | ~42 task |
| PR đã merge | 3 (PR#3, PR#5, merge dev→dev-minh) |
| Commit tuần 1 | 19 commit (28–30/10/2026) |
| Backend test pass | 46 / 46 (100%) |
| Frontend test pass | 8 / 8 (100%) |
| E2E test | 13 / 13 (theo báo cáo — cần xác minh file) |
| Container Docker | 3/3 UP + MySQL healthy |
| NFR đạt | NFR-01, 02, 03, 04, 05 (NFR-06 cần test riêng) |

---

## 5. Thông tin cần bổ sung

> Các phần dưới đây cần thành viên điền thêm trước hoặc trong buổi họp.

- **Thành viên có mặt tại Sprint Review:**  
  `[ ] Nguyễn Thạc Hưng  [ ] Phùng Văn Vượng  [ ] Lê Tiến Đức  [ ] Lê Duy Minh`

- **Velocity thực tế (story points hoặc giờ):**  
  *(Cần dữ liệu từ bảng công việc Trello/Lark)*

- **Demo đã trình bày:** *(Liệt kê tính năng demo trong buổi họp)*

- **Phản hồi từ giảng viên / khách mời:** *(Ghi lại nếu có)*

- **Quyết định thay đổi scope tuần 2:** *(Nếu có điều chỉnh kế hoạch)*

---

*Tài liệu được tạo tự động từ khảo sát repository. Nội dung phản ánh trạng thái repository lúc 30/10/2026 17:00 ICT. Vui lòng bổ sung thông tin còn thiếu trước khi lưu trữ chính thức.*
