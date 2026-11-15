# Sprint Review & Retrospective tuần 3 – Phần của Vượng (backend)

Tuần 3: 09/11 – 13/11/2026 · Người viết: Phùng Văn Vượng · Dùng để ghép vào biên bản chung tuần 3 (T185, T188, T192, T196).

## 1. Sprint Review

### 1.1. Task đã hoàn thành (có bằng chứng trong Git)

| Ngày | Task | Nội dung | Commit | PR |
|---|---|---|---|---|
| 09/11 | T140 | Test nhánh lỗi đăng ký, đăng nhập, hồ sơ; sửa mật khẩu tiếng Việt dài gây 500 và email quá dài trả 409 | `c9473cf` | #24 |
| 09/11 | T165 | Phân trang tùy chọn cho `/hotels`, `/bookings/me`, `/admin/bookings` | `7baa62c` | #24 |
| 09/11 | T142 | Đo độ phủ bằng JaCoCo, liệt kê phần chưa phủ | `5f04932` | #24 |
| 10/11 | T151 | Test nhánh lỗi đặt phòng, hủy đơn; sửa số thập phân bị làm tròn (`roomId: 1.5` đặt nhầm phòng) | `e77116e` | #26 |
| 10/11 | T152 | Bảng phân quyền mọi API qua HTTP thật | `325f9a4` | #26 |
| 10/11 | T153 | Đo hiệu năng với 20.000 đơn, EXPLAIN xác nhận dùng chỉ mục | `4b8a6e8` | #26 |
| 11/11 | T141, T166 | Test nhánh lỗi khách sạn, tìm kiếm, phòng trống; sửa `page` quá lớn gây 500 và thông báo tiếng Anh | `5bbe372` | #28 |
| 11/11 | T164 | Test đồng thời: 8 request HTTP vào phòng cuối, 40 yêu cầu ngẫu nhiên không bao giờ đặt quá số phòng | `5bbe372`, `602c842` | #28 |
| 12/11 | T175, T176 | Kiểm thử tải 1.200 request (50 đồng thời) đạt NFR-01, NFR-03; kiểm thử phân trang phía API | `c28601e` | #28 |
| 12/11 | T177 | Chốt tài liệu API, ERD theo code (sửa 7 chỗ lệch) | `0a18403`, `c28601e` | #28 |
| 13/11 | T186 | Sửa 2 lỗi admin tìm được khi review (`minPrice` ở `/admin/hotels`, đổi `hotelId` của loại phòng đã có đơn) | `f919506` | (PR mới) |
| 13/11 | T187 | Review mã backend của nhóm: 7 vấn đề | `7f042b3` | (PR mới) |

T186 và T187 được hoàn thiện ngày 15/11 (trễ 2 ngày so với kế hoạch).

### 1.2. Số liệu backend cuối tuần 3

| Chỉ số | Giá trị |
|---|---|
| Test backend | 326/326 xanh |
| Độ phủ (JaCoCo) | 99,3% dòng, 94,8% nhánh (tiêu chí ≥ 80%) |
| NFR-01 (dưới 500 ms) | Đạt: p95 tối đa 249 ms với 50 request đồng thời (T176) |
| NFR-03 (≥ 50 request đồng thời) | Đạt: 1.200/1.200 request, không lỗi |
| Lỗi thật tìm và sửa trong tuần | 7 (mật khẩu 72 byte, email dài, số thập phân, `page` quá lớn, thông báo tiếng Anh, `minPrice` admin, đổi `hotelId`) |

Báo cáo: `docs/test-reports/T142-…`, `T153-…`, `T175-T176-…`, `T187-…`.

## 2. Retrospective

### 2.1. Làm tốt ✅
- Mỗi lỗi đều có test viết trước (đỏ trước khi sửa), nên không lỗi nào quay lại.
- Có test qua HTTP thật và test đồng thời. Các test này bắt được những lỗi mà test MockMvc bỏ sót, như 403 bị đổi thành 401.
- Tài liệu API và ERD được đối chiếu và sửa theo code thật.

### 2.2. Chưa tốt ⚠️
- **Toàn bộ test chỉ chạy trên H2**, chưa chạy trên MySQL thật: khóa bản ghi, mức cô lập giao dịch và Flyway trên MySQL chưa được kiểm chứng.
- **Không có CI chạy test backend**, và CD build với `-x test`: PR làm hỏng build vẫn có thể được merge và triển khai.
- Hai task của Vượng (T175, T176) có lúc bị đánh dấu xong trong kế hoạch trước khi làm thật. Đã làm bổ sung ngày 12/11.
- Phải gộp nhánh nhiều lần do nhánh chung thay đổi trong ngày (Hưng gộp `main` vào `recovery/clean-dev`).
- T186, T187 trễ 2 ngày.
- Trạng thái task trên Lark chưa được cập nhật (vẫn là Backlog).

### 2.3. Cải thiện cho tuần 4 🔧
- Chạy toàn bộ test backend trên MySQL (Docker) trước khi demo.
- Thêm CI chạy `./gradlew test` cho mọi PR, chặn merge khi đỏ (Minh, T193).
- Cập nhật trạng thái Lark ngay khi PR được merge.
- Chỉ đánh dấu xong khi đã có commit và PR.

## 3. Action items

| Việc | Người | Hạn |
|---|---|---|
| Chạy test backend trên MySQL qua Docker | Vượng | 17/11 |
| CI backend + chặn CD khi test đỏ | Minh | 16/11 |
| Giao diện phân trang (T236), lưu token mới khi đổi email (`authStore.setUser`) | Đức | 16/11 |
| API AI (`/ai/describe`, `/ai/chat`) chưa có trên backend: quyết định làm hay bỏ khỏi tài liệu | Hưng | 16/11 |
| Cập nhật trạng thái task trên Lark | Cả nhóm | 16/11 |
