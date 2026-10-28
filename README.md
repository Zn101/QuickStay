# QuickStay – Hệ thống đặt phòng khách sạn (MVP)

Web đặt phòng khách sạn: tìm kiếm, xem phòng trống theo ngày, đặt phòng (thanh toán tại khách sạn), lịch sử, quản trị, mô tả bằng AI và chatbot.
Chi tiết yêu cầu: `docs/QuickStay-Project-Proposal-3days.docx`. Báo cáo kiểm thử: `docs/QuickStay-Test-Report.md`.

## Chạy bằng Docker (toàn hệ thống)

```bash
cp .env.example .env        # sửa JWT_SECRET, mật khẩu; điền ANTHROPIC_API_KEY nếu muốn dùng AI thật
docker compose up --build
```

- Website: http://localhost:8081 (Nginx phục vụ React, chuyển tiếp `/api` sang backend)
- Admin mặc định: `admin@quickstay.local` / `Admin@123` (đổi bằng `ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Lần đầu chạy sẽ tạo 4 khách sạn mẫu.

## Chạy khi phát triển

```bash
cd backend  && ./gradlew bootRun     # http://localhost:8080, dùng H2 trong bộ nhớ nếu không đặt DB_URL
cd frontend && npm install && npm run dev   # http://localhost:5173, proxy /api sang :8080
```

## Kiểm thử

```bash
cd backend  && ./gradlew test        # 46 test backend
cd frontend && npm test              # 8 test frontend
node qa/e2e.mjs                      # E2E qua API (backend đang chạy)
node qa/load-test.mjs                # 50 request đồng thời
```

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `backend/` | Spring Boot 3 (Web, JPA, Security, Validation), JWT, BCrypt, MySQL |
| `frontend/` | React + Vite, Tailwind, Zustand, React Router |
| `qa/` | Script E2E, kiểm thử tải, kết quả Lighthouse |
| `.github/workflows/ci.yml` | Build + test, khi push `main` thì đẩy image lên GHCR |

## Ghi chú thiết kế

- **Không đặt trùng phòng:** khi đặt, hệ thống khóa bản ghi phòng (`PESSIMISTIC_WRITE`), đếm số đặt phòng chưa hủy chồng lấn khoảng ngày rồi mới ghi, tất cả trong một transaction (test `TC_BOOK_12`). Ngày trả phòng không tính vào đêm ở, nên hai kỳ nghỉ liền nhau không xung đột.
- **AI:** gọi Anthropic Messages API bằng `RestClient` (biến `ANTHROPIC_API_KEY`, `AI_MODEL`). Khi không có khóa hoặc dịch vụ lỗi, hệ thống trả nội dung dự phòng dựng từ dữ liệu trong DB nên tính năng vẫn dùng được.
- **Lỗi API** luôn có dạng `{"message": "..."}`. Thông báo lỗi từ backend hiện không có dấu tiếng Việt.
