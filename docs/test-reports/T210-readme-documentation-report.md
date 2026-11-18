# T210 – README & Documentation Report

**Ngày:** 17/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh:** `minh/assigned-tasks`

---

## 1. Nguồn tham khảo

| Nguồn | Thông tin thu thập |
|-------|------------------|
| `docs/architecture.md` | Kiến trúc tổng thể, stack công nghệ, sơ đồ ERD |
| `.env.example` | Danh sách và mô tả biến môi trường |
| `docker-compose.yml` | Services, ports, volumes, healthcheck |
| `docker-compose.prod.yml` | Cấu hình production |
| `backend/build.gradle` | Java 17, Spring Boot 3.5.6 |
| `frontend/package.json` | React 18, Vite 5, Zustand, react-router-dom 6 |
| `backend/src/main/java/com/quickstay/` | Packages: admin, booking, email, hotel, security, user |
| `backend/src/main/resources/db/migration/` | 4 migration files |
| `docs/deployment/T145-docker-server-setup.md` | Hướng dẫn Docker trên Ubuntu |
| `docs/QuickStay-API.md` | API endpoints |
| Containers đang chạy (T203) | Xác minh ports, services thực tế |

---

## 2. Files đã tạo / cập nhật

| File | Thao tác | Mô tả |
|------|---------|-------|
| `README.md` | **Cập nhật** | Thêm Overview, Features, Tech Stack, Architecture, Project Structure, Quick Start, Docs links, Team |
| `docs/QUICKSTART.md` | **Tạo mới** | Hướng dẫn chạy local đầy đủ cho người mới |

---

## 3. Nội dung README tổng (phần đã thêm)

| Section | Nội dung |
|---------|---------|
| Project Overview | Mô tả ngắn gọn hệ thống đặt phòng |
| Main Features | 10 tính năng chính với bảng mô tả |
| Technology Stack | Bảng đầy đủ 14 thành phần + phiên bản |
| Architecture | Sơ đồ ASCII + link đến `docs/architecture.md` |
| Project Structure | Cây thư mục chú thích |
| Quick Start | 5 lệnh để chạy được hệ thống |
| Documentation Links | Bảng liên kết đến tài liệu quan trọng |
| Development Team | Nhóm 05 — 4 thành viên + vai trò |

---

## 4. Nội dung QUICKSTART.md

| Section | Nội dung |
|---------|---------|
| Prerequisites | Docker Desktop (không cần Java/Node) |
| Clone | Lệnh git clone chính xác |
| Environment | Phân biệt rõ biến bắt buộc/tùy chọn, cách tạo JWT_SECRET |
| Start | `docker compose up -d --build` |
| Verify | Kiểm tra `docker compose ps`, health, Flyway, MySQL |
| Access | URLs chính xác: 8081 frontend, 8080 backend (dev) |
| Database | Mô tả 4 migration files, cách bật seed data |
| Logs | Các lệnh xem log theo service |
| Stop | `docker compose down` (không xóa volume) |
| Troubleshooting | 4 lỗi phổ biến từ T203/T204 với cách sửa |

---

## 5. Lệnh và URL đã xác minh

| Lệnh / URL | Nguồn xác minh |
|-----------|--------------|
| `docker compose up -d --build` | T203 runtime tests — 10/10 PASS |
| `docker compose ps` | Xác nhận container names thực tế |
| `http://localhost:8081` | Frontend port từ `docker-compose.yml` dòng 59 |
| `http://localhost:8080/actuator/health` | T203 RT-02: `{"status":"UP"}` |
| `admin@quickstay.local` / `Admin@123` | `AdminAccountInitializer.java` + `.env.example` |
| Tên services: `mysql`, `backend`, `frontend` | `docker-compose.yml` service names |
| `docker compose down` (không `-v`) | T203 bảo vệ dữ liệu |

---

## 6. Kiểm tra liên kết

| Link trong README | Tệp đích | Tồn tại |
|------------------|---------|--------|
| `docs/QUICKSTART.md` | `docs/QUICKSTART.md` | ✅ Mới tạo |
| `docs/architecture.md` | `docs/architecture.md` | ✅ Có sẵn |
| `docs/QuickStay-API.md` | `docs/QuickStay-API.md` | ✅ Có sẵn |
| `docs/QuickStay-ERD.md` | `docs/QuickStay-ERD.md` | ✅ Có sẵn |
| `docs/deployment/T145-docker-server-setup.md` | `docs/deployment/T145-docker-server-setup.md` | ✅ Có sẵn |
| `../README.md` trong QUICKSTART | `README.md` | ✅ OK |

---

## 7. Review

**Trạng thái:** ⚠️ Chưa được review bởi thành viên khác

Tài liệu đã chuẩn bị xong, cần ít nhất 1 thành viên đọc qua theo checklist:

| Checklist | Người review | Kết quả |
|-----------|-------------|---------|
| Hiểu được mục tiêu dự án | Chưa review | — |
| Hiểu cấu trúc hệ thống | Chưa review | — |
| Làm theo để chạy dự án được | Chưa review | — |
| Lệnh và URL chính xác | Chưa review | — |
| Liên kết hoạt động | Chưa review | — |

---

## 8. Trạng thái hoàn thành

| Tiêu chí | Trạng thái |
|---------|-----------|
| README tổng có Overview | ✅ Hoàn thành |
| README có Quick Start | ✅ Hoàn thành |
| README có Documentation links | ✅ Hoàn thành |
| `docs/QUICKSTART.md` đầy đủ 10 sections | ✅ Hoàn thành |
| Đối chiếu với source code và compose | ✅ Hoàn thành |
| Lệnh và URL đã xác minh | ✅ Hoàn thành |
| Liên kết hoạt động | ✅ Hoàn thành |
| Review bởi thành viên khác | ⚠️ Chưa thực hiện |

---

## 9. Những nội dung còn thiếu

1. **Review thành viên** — cần 1 thành viên đọc QUICKSTART và xác nhận chạy được
2. **Screenshot** — README chưa có ảnh chụp màn hình giao diện
3. **Contributing guide** — chưa có hướng dẫn đóng góp code
