# T142 – Báo cáo độ phủ test backend

Ngày đo: 09/11/2026 · Người thực hiện: Phùng Văn Vượng · Công cụ: JaCoCo · CSDL khi chạy test: H2

Chạy lại:

```bash
cd backend && ./gradlew test jacocoTestReport
```

Báo cáo chi tiết: `backend/build/reports/jacoco/test/html/index.html`.

## 1. Kết quả

271/271 test đạt. Tiêu chí của dự án (từ 80%) **đạt**.

| Package | Dòng | Nhánh |
|---|---|---|
| **Toàn backend** | **98,3%** (564/574) | **92,9%** (156/168) |
| `hotel` | 100% (82/82) | 100% (36/36) |
| `user` | 99,0% (96/97) | 100% (44/44) |
| `booking` | 100% (109/109) | 96,4% (27/28) |
| `admin` | 100% (133/133) | 83,3% (30/36) |
| `config` | 92,1% (82/89) | 83,3% (15/18) |
| `security` | 100% (61/61) | 66,7% (4/6) |

## 2. Phần chưa phủ

| Vị trí | Nội dung | Nhận xét |
|---|---|---|
| `ApiExceptionHandler:55–56` | Chờ khóa quá lâu → 409 | **Nên bổ sung.** Khó tạo trên H2, cần test giả lập ngoại lệ |
| `ApiExceptionHandler:61–62` | Vi phạm ràng buộc CSDL → 409 | **Nên bổ sung.** Xảy ra khi hai người đăng ký cùng email một lúc |
| `ApiExceptionHandler:67–68` | Lỗi không mong đợi → 500 | **Nên bổ sung.** Cần kiểm tra không lộ chi tiết lỗi ra ngoài |
| `ApiExceptionHandler:36` | `ResponseStatusException` | Code hiện dùng `ApiException`, gần như không còn đường vào |
| `ApiExceptionHandler:44` | Nhánh không có lỗi theo trường | Ít giá trị |
| `JwtAuthFilter:28` | Header không bắt đầu bằng `Bearer ` | **Nên bổ sung.** Liên quan xác thực |
| `BookingAdminController:41` | `status` rỗng hoặc thiếu | **Nên bổ sung** (phần admin) |
| `HotelAdminDtos:44–47`, `RoomAdminDtos:49` | Trường tùy chọn rỗng thành `null` | Ít rủi ro |
| `BookingDtos:31` | `guestName` là `null` trước khi validate | Ít rủi ro |
| `SecurityConfig:75` | Cấu hình CORS có phần tử rỗng | Ít rủi ro |
| `User:49`, `QuickStayApplication:11–12` | Getter, hàm `main` | Không cần test |

## 3. Giới hạn của số liệu

- Độ phủ cho biết dòng code **đã được chạy qua**, không bảo đảm mọi trường hợp đều đúng.
- JaCoCo chỉ đo code Java, không đo nội dung câu JPQL trong repository. Các truy vấn được kiểm tra riêng bằng `@DataJpaTest` và test API.
- Toàn bộ test chạy trên **H2**. Hành vi riêng của MySQL (khóa bản ghi, mức cô lập giao dịch, Flyway) **chưa được kiểm chứng**.
- Báo cáo chỉ gồm backend, không đo frontend.
