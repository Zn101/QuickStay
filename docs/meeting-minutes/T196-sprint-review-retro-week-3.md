# Sprint Review & Retrospective — Tuần 3

**Dự án:** QuickStay · **Repository:** Zn101/QuickStay  
**Thời gian Sprint:** 06/11/2026 – 13/11/2026  
**Ngày lập biên bản:** 13/11/2026  
**Người lập:** Lê Duy Minh (T196)  
**Thành phần tham gia:** *(cần bổ sung danh sách thành viên có mặt tại buổi họp)*

---

## 1. Sprint Review

### 1.1. Mục tiêu Sprint tuần 3

Dựa trên action items từ Sprint tuần 2 và kế hoạch dự án, Sprint tuần 3 tập trung vào:

1. Kiểm thử bảo mật và CORS.
2. Sửa bug Admin backend.
3. Chuẩn bị môi trường triển khai (Docker, VPS, Nginx).
4. Xây dựng CI pipeline.
5. Kiểm tra merge readiness vào main.
6. Sprint Review & Retrospective tuần 2.
7. Bổ sung test edge cases và phân trang (Vượng).
8. Hoàn thiện giao diện và chức năng frontend (Đức).

---

### 1.2. Task của Minh — Có bằng chứng hoàn thành

| Task | Mô tả | Ngày | Bằng chứng |
|------|-------|------|-----------|
| **T132** | Test CORS (14 test cases) | 06/11 | Commit `8875090`; báo cáo `T132-cors-test-report.md`; 256/256 pass |
| **T133** | Fix Admin bugs: BUG-01 filter hotelId, BUG-02 409 message | 06/11 | Commit `8875090`; 260/260 pass |
| **T134** | Chuẩn bị môi trường triển khai: `.dockerignore`, `docker-compose.prod.yml`, README VPS guide | 06/11 | Commit `8875090`; báo cáo `T134-deployment-environment-report.md` |
| **T135** | Sprint Review & Retrospective tuần 2 | 06/11 | `docs/sprint-review-retro-week-2.md` |
| **T145** | Cài đặt Docker trên VPS Ubuntu | 09/11 | `docs/deployment/T145-docker-server-setup.md`; README cập nhật |
| **T146** | Nginx reverse proxy + biến môi trường production | 09/11 | `nginx.conf` thêm X-Forwarded headers; `application-prod.properties`; báo cáo `T146-*.md` |
| **T156** | Smoke Test toàn bộ luồng QuickStay | 11/11 | Báo cáo `T156-smoke-test-report.md`; 20/20 PASS trên Docker Compose đang chạy |
| **T157** | Security Review: CORS, Git Secrets, Logging | 11/11 | Báo cáo `T157-security-review-report.md`; 23/23 PASS, 0 bug |
| **T169** | CI Pipeline cho QuickStay | 11/11 | `.github/workflows/ci.yml`; 339/339 backend pass, 18/18 frontend pass |
| **T170** | Kiểm tra điều kiện merge dev vào main | 11/11 | Báo cáo `T170-merge-readiness-report.md`; NOT READY → sau PR #29 → READY |
| **T171** | Kiểm tra Docker Image trên GHCR | 11/11 | Báo cáo `T171-ghcr-report.md`; cả 2 image pull thành công (backend 382MB, frontend 74.2MB) |
| **T193-G2.1** | Xác minh phát hiện bảo mật trước khi khắc phục | 13/11 | Báo cáo `T193-G2.1-verification-report.md`; 9 vấn đề xác nhận |
| **T193-G2.2-A** | Authentication & Production Security Remediation | 13/11 | `application-prod.properties` tạo; `SPRING_PROFILES_ACTIVE=prod`; 339/339 pass; báo cáo `T193-G2.2-A-*.md` |
| **T194** | Kiểm tra điều kiện tạo Git Tag v1.0-rc | 13/11 | Báo cáo `T194-pre-tag-audit-report.md`; READY (T170 đã merge) |
| **T195** | Audit lỗi triển khai QuickStay | 13/11 | Báo cáo `T195-deployment-audit-report.md`; 9 bugs phân tích, BUG-07 đã sửa |
| **T196** | Sprint Review & Retrospective tuần 3 | 13/11 | Tài liệu này |

**Tổng Minh: 16 task hoàn thành có bằng chứng trong tuần 3.**

---

### 1.3. Task của các thành viên khác — Có bằng chứng trong Git history

| Task | Mô tả | Người thực hiện | Bằng chứng |
|------|-------|----------------|-----------|
| **T140** | Bổ sung test nhánh lỗi đăng ký, đăng nhập, hồ sơ và sửa 2 lỗi validate | Vượng | Commit `c9473cf` |
| **T141, T164, T166** | Test nhánh lỗi khách sạn, test đồng thời phòng cuối, sửa lỗi validate | Vượng | Commit `5bbe372` |
| **T142** | Đo độ phủ test bằng JaCoCo | Vượng | Commit `5f04932`; báo cáo `T142-test-coverage-report.md` |
| **T165** | API phân trang danh sách khách sạn và đơn đặt phòng | Vượng | Commit `7baa62c` |
| **T175, T176, T177** | Kiểm thử tải và phân trang, chốt tài liệu API và ERD | Vượng | Commit `c28601e` |
| **T143, T144** | Hoàn thiện modal đăng nhập, modal xóa | Đức | Commit `1e658e1` |
| **T151** | Test nhánh lỗi đặt phòng, hủy đơn; sửa lỗi số thập phân | Vượng | Commit `e77116e` |
| **T152** | Bổ sung test API admin và phân quyền qua HTTP thật | Vượng | Commit `325f9a4` |
| **T153** | Đo hiệu năng truy vấn phòng trống và kiểm tra chỉ mục | Vượng | Commit `4b8a6e8`; báo cáo `T153-*.md` |
| **T181** | Thu thập và tổ chức ảnh minh chứng triển khai | Minh/Đức | Commit `fe8b174` |
| **T126, T127, T128** | Test hồ sơ, lịch sử và đặt phòng đồng thời qua HTTP thật; sửa 403→401 | Vượng | Commit `c89fdc0`, `e495098` |
| Frontend polish | UI layout, chatbox, filters, reviews, photos, maps, payments, email verification | Đức + team | Commits `4fa85ca`, `5ed7084`, `74eb812`, `4fb4e4a`, `7cef20b` |
| CD workflow fix | SSH deploy key, GHCR images, CD healthcheck | Hưng/Team | Commits `506ca8a`, `f85a1a7`, `a20511c`, `ef1393d` |
| CI workflow on main | CI trigger main+dev, test gating | Team | Commit `5951370`, `4fb4e4a` |
| Security fix on main | Secure token exposure, remove admin fallback, upgrade vitest/react-router | Team | Commit `4fb4e4a` |

---

### 1.4. Kết quả sản phẩm và kiểm chứng

| Sản phẩm | Trạng thái | Bằng chứng |
|----------|-----------|-----------|
| **Backend test** | ✅ 339/339 PASSED | Gradle build successful |
| **Frontend test** | ✅ 18/18 PASSED | Vitest run + Vite build OK |
| **CORS** | ✅ 14/14 PASS | `CorsTest.java`; origin hợp lệ nhận ACAO, origin lạ bị 403 |
| **Security review** | ✅ 23/23 PASS | Không có secret trong Git, không log sensitive data |
| **Smoke test** | ✅ 20/20 PASS | Hệ thống chạy thực tế trên Docker Compose |
| **GHCR images** | ✅ Cả 2 image tồn tại | Backend 382MB, Frontend 74.2MB — pull thành công |
| **CI pipeline** | ✅ `ci.yml` trên main | Trigger push/PR main+dev, song song backend+frontend |
| **CD pipeline** | ✅ `cd-docker.yml` trên main | Build+push GHCR + deploy VPS qua SSH |
| **Merge T170** | ✅ PR #29 merged | `recovery/clean-dev` → `main` |
| **T193-G2.2-A** | ⚠️ Local ready, chưa merge | `application-prod.properties` + `SPRING_PROFILES_ACTIVE=prod` |
| **T195** | ⚠️ BUG-07 sửa, BUG-04/05 chờ merge | `docker-compose.yml` đã thêm healthcheck |

---

### 1.5. Lỗi, rủi ro và vấn đề còn tồn tại

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|-----------|
| 1 | T193-G2.2-A chưa merge vào main | 🟡 High | Local ready, chờ commit/PR |
| 2 | `docker-compose.prod.yml` local có `ports: 8080:8080` không có trên main | 🟡 Medium | Cần xóa khi merge |
| 3 | Volume `quickstay_mysql-test` có dữ liệu cần bảo vệ | 🟡 Medium | Giữ nguyên, không xóa name |
| 4 | CD không có quality gate (không `needs: ci`) | 🟡 Medium | CD chạy song song CI |
| 5 | npm vulnerabilities (vitest, react-router-dom) | 🟡 Medium | Dev-only (vitest), production (react-router CVE-1) |
| 6 | Chưa có HTTPS/SSL trong production | 🟢 Low | Cần Certbot/Caddy bên ngoài |
| 7 | Branch protection chưa bật trên `main` | 🟢 Low | Không có required status checks |
| 8 | T195 G2 thay đổi chưa commit | 🟡 Medium | `docker-compose.yml` BUG-07 + báo cáo |

---

## 2. Sprint Retrospective

### 2.1. Keep — Những điều nên tiếp tục

1. **Test coverage liên tục tăng:** Từ 260 (tuần 2) lên 339 test cases (tuần 3) — tất cả 100% pass. Mỗi task mới đều có test đi kèm.

2. **Báo cáo kiểm thử đầy đủ:** 27 file báo cáo trong `docs/test-reports/` — có bằng chứng cụ thể, không tự đánh dấu Pass khi chưa kiểm tra.

3. **Security review có hệ thống:** T157 (CORS + Git secrets + logging) và T193 (pipeline security) — xác nhận không có secret bị lộ, CORS đúng, error handling không leak.

4. **Smoke test trên hệ thống thực:** T156 chạy 20 test case trên Docker Compose đang chạy — xác nhận toàn bộ luồng hoạt động.

5. **CI pipeline tạo và hoạt động:** `ci.yml` trên main trigger đúng nhánh, chạy song song backend+frontend.

6. **Merge T170 hoàn thành:** `recovery/clean-dev` đã merge vào `main` qua PR #29 — code tuần 2+3 đã lên production.

7. **Vượng hoàn thiện test edge cases:** T140, T141, T151-T153, T164, T165 — test nhánh lỗi, test tải, phân trang, JaCoCo coverage.

### 2.2. Problem — Những vấn đề cần cải thiện

1. **Thay đổi chưa commit tích tụ:** Nhiều task (T193, T195) hoàn thành code nhưng chưa commit/push — tạo rủi ro mất việc và khó review.

2. **CD không có quality gate:** `cd-docker.yml` chạy khi push vào `main` mà không chờ CI pass — code chưa test có thể deploy lên VPS.

3. **`docker-compose.yml` local khác `origin/main`:** Volume name, port expose, env fallbacks — cần đồng bộ trước merge.

4. **Volume name `quickstay_mysql-test`:** Có dữ liệu cần bảo vệ nhưng tên gợi ý test — cần documentation rõ ràng.

5. **npm vulnerabilities chưa được xử lý:** `react-router-dom` CVE-1 (open redirect) ảnh hưởng production frontend.

6. **Commit message encoding:** Một số commit của Vượng hiển thị ký tự lỗi (`ß╗»`, `─æß║╖t`) — do encoding issue khi commit trên Windows.

7. **Branch protection chưa bật:** `main` cho phép push trực tiếp, không có required status checks.

### 2.3. Try — Những cách làm mới nên thử

1. **Commit sớm và thường xuyên:** Đừng để tích tụ nhiều thay đổi rồi mới commit — dễ conflict và khó review.

2. **Tích hợp quality gate vào CD:** Thêm `needs: ci` hoặc dùng `workflow_run` để CD chỉ chạy sau CI pass.

3. **Đồng bộ `docker-compose.yml` với `origin/main`:** Trước khi tạo PR, kiểm tra diff với main để phát hiện sai lệch.

4. **Nâng cấp `react-router-dom` lên 7.x:** Cần kiểm tra breaking changes (routes, hooks) trước khi upgrade.

5. **Tạo `application-prod.properties` trên main sớm:** Đảm bảo production fail-fast khi thiếu secret.

6. **Bật branch protection:** Required status checks (CI) trước khi merge vào `main`.

### 2.4. Stop — Những việc nên dừng

1. **Dừng việc hardcode fallback `Admin@123` trong production config.** Đã xử lý trong T193-G2.2-A, cần merge.

2. **Dừng việc expose backend port 8080 ra host trong prod compose.** `origin/main` đã đúng (không expose), local cần xóa.

3. **Dừng việc gộp nhiều task vào 1 commit.** Mỗi task nên có commit riêng để dễ truy vết và rollback.

---

## 3. Action Items

| STT | Công việc cần xử lý | Người phụ trách | Deadline | Trạng thái |
|-----|---------------------|----------------|-----------|-----------|
| A16 | Commit + push T193-G2.2-A và T195 thay đổi lên `minh/assigned-tasks` | Minh | Chưa thống nhất | ⏳ Chờ user |
| A17 | Tạo PR `minh/assigned-tasks` → `recovery/clean-dev` (bao gồm T193 + T195) | Minh | Sau A16 | ⏳ Chờ A16 |
| A18 | Xóa `ports: 8080:8080` khỏi `docker-compose.prod.yml` khi merge vào main | Minh | Khi merge | ⏳ Chờ merge |
| A19 | Tích hợp quality gate: CD chỉ chạy sau CI pass | Chưa phân công | Chưa thống nhất | ⏳ Chưa bắt đầu |
| A20 | Nâng cấp `react-router-dom` 6.x → 7.x (CVE-1 open redirect) | Chưa phân công | Chưa thống nhất | ⏳ Chưa bắt đầu |
| A21 | Bật branch protection trên `main` (required CI status checks) | Hưng (repo admin) | Chưa thống nhất | ⏳ Chưa bắt đầu |
| A22 | Đồng bộ `docker-compose.yml` local với `origin/main` | Minh | Khi merge | ⏳ Chờ merge |
| A23 | Tạo Git Tag `v1.0-rc` trên `main` (sau khi T193 merge) | Team lead | Sau A17 | ⏳ Chờ A17 |
| A24 | Kiểm thử E2E toàn luồng trên VPS sau deploy | Cả nhóm | Sau A23 | ⏳ Chưa bắt đầu |
| A25 | Thêm HTTPS/SSL cho production (Certbot/Caddy) | Chưa phân công | Chưa thống nhất | ⏳ Chưa bắt đầu |

---

## 4. Kết luận

### Đánh giá chung Sprint tuần 3

Sprint tuần 3 đạt kết quả **tốt về mặt kiểm thử bảo mật và chuẩn bị triển khai**:
- Toàn bộ security review hoàn thành (T157, T193) — không phát hiện secret bị lộ
- CI pipeline hoạt động, CD deploy VPS thành công
- Merge T170 hoàn thành — code lên `main` và deploy VPS
- Backend test đạt 339/339, frontend 18/18
- 20/20 smoke test pass trên hệ thống thực

### Vấn đề ưu tiên giải quyết

1. **Merge T193-G2.2-A vào main** — security fix production (fail-fast khi thiếu secret)
2. **Tạo Git Tag `v1.0-rc`** — T194 xác nhận READY, cần merge T193 trước
3. **Quality gate cho CD** — CD cần chờ CI pass trước khi deploy

### Định hướng Sprint tuần 4

*(Cần nhóm xác nhận trong buổi Sprint Planning)*

- Hoàn tất merge T193-G2.2-A và T195 vào main
- Tạo Git Tag `v1.0-rc` và deploy chính thức
- Kiểm thử E2E toàn luồng trên VPS
- Nâng cấp dependencies có vulnerability (react-router-dom)
- Bật branch protection trên `main`
- Chuẩn bị demo và tài liệu nộp báo cáo cuối kỳ
- Hoàn thiện HTTPS/SSL cho production

---

## 5. Thông tin cần bổ sung

> Các phần dưới đây cần thành viên điền thêm trước hoặc trong buổi họp Sprint Review.

- **Thành viên có mặt tại Sprint Review:**
  `[ ] Nguyễn Thạc Hưng  [ ] Phùng Văn Vượng  [ ] Lê Tiến Đức  [ ] Lê Duy Minh`

- **Demo đã trình bày:** *(Liệt kê tính năng demo trong buổi họp)*

- **Phản hồi từ giảng viên / khách mời:** *(Ghi lại nếu có)*

- **Quyết định điều chỉnh scope tuần 4:** *(Nếu có thay đổi so với kế hoạch)*

- **Velocity thực tế tuần 3 (story points hoặc giờ):** *(Cần dữ liệu từ bảng công việc Trello/Lark)*

---

*Tài liệu do Lê Duy Minh tổng hợp dựa trên Git history, báo cáo kiểm thử và các artifact trong repository. Phản ánh trạng thái tại 13/11/2026. Các thông tin chưa xác minh được đánh dấu rõ ràng và cần nhóm bổ sung trước khi sử dụng làm biên bản chính thức.*
