# T158 – Báo cáo G2.1: Xác minh an toàn trước khi merge (Merge Safety Review)

**Ngày thực hiện:** 11/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Mã công việc:** T158 – Quản lý nhánh và chuẩn bị merge mã nguồn tuần 2  
**Trạng thái hiện tại:** Đang đứng tại nhánh thử nghiệm `test/merge-minh-to-clean-dev`  
**Quy tắc tuân thủ:** CHƯA COMMIT, CHƯA PUSH, CHƯA MERGE, CHƯA CHUYỂN NHÁNH, KHÔNG XÓA DỮ LIỆU.

---

## 1. Kiểm tra 25 file tại working tree nhánh hiện tại

### 1.1. Kết quả thực thi các lệnh Git kiểm tra

#### Lệnh `git status --short`
```text
M  .env.example
M  .gitignore
M  README.md
A  backend/.dockerignore
M  backend/Dockerfile
M  backend/src/main/java/com/quickstay/admin/HotelAdminService.java
M  backend/src/main/java/com/quickstay/admin/RoomAdminController.java
M  backend/src/main/java/com/quickstay/admin/RoomAdminService.java
M  backend/src/main/resources/application.properties
A  backend/src/test/java/com/quickstay/CorsTest.java
M  backend/src/test/java/com/quickstay/admin/AdminHotelApiTest.java
M  backend/src/test/java/com/quickstay/admin/AdminRoomApiTest.java
A  docker-compose.prod.yml
A  docs/deployment/T145-docker-server-setup.md
A  docs/deployment/T147-mysql-backup-restore.md
A  docs/sprint-review-retro-week-2.md
A  docs/test-reports/T132-cors-test-report.md
A  docs/test-reports/T133-admin-bug-fix-report.md
A  docs/test-reports/T134-deployment-environment-report.md
A  docs/test-reports/T146-nginx-production-deployment-report.md
A  docs/test-reports/T147-mysql-backup-restore-report.md
M  frontend/nginx.conf
 M frontend/src/App.test.jsx
A  scripts/backup-mysql.ps1
A  scripts/restore-mysql.ps1
```

#### Lệnh `git diff --stat` & `git diff --name-status` (Unstaged changes)
```text
frontend/src/App.test.jsx | 2 +-
1 file changed, 1 insertion(+), 1 deletion(-)

M	frontend/src/App.test.jsx
```
*Chi tiết thay đổi:*
```diff
- expect(await screen.findByText('Quản lý khách sạn')).toBeInTheDocument()
+ expect(await screen.findByText(/quản lý khách sạn/i)).toBeInTheDocument()
```

#### Lệnh `git diff --cached --stat` & `git diff --cached --name-status` (Staged changes)
24 files staged (2.930 dòng thêm, 11 dòng xóa, gồm 9 file sửa đổi `M`, 15 file thêm mới `A`, 0 file bị xóa `D`).

---

### 1.2. Phân loại 25 file theo nhóm công việc T132–T147

| Nhóm Task | Tên file | Trạng thái Git | Mô tả thay đổi |
|---|---|:---:|---|
| **T132** (CORS Testing) | `backend/src/test/java/com/quickstay/CorsTest.java` | **A** (Staged) | Thêm 14 test cases kiểm tra cấu hình CORS, header Authorization, preflight OPTIONS, từ chối origin lạ. |
| | `docs/test-reports/T132-cors-test-report.md` | **A** (Staged) | Báo cáo kiểm thử chi tiết CORS. |
| **T133** (Fix Admin Bugs) | `backend/src/main/java/com/quickstay/admin/RoomAdminController.java` | **M** (Staged) | Bổ sung query param `hotelId` vào `GET /api/admin/rooms`. |
| | `backend/src/main/java/com/quickstay/admin/RoomAdminService.java` | **M** (Staged) | Lọc phòng theo `hotelId` bằng phương thức repository đã có. |
| | `backend/src/main/java/com/quickstay/admin/HotelAdminService.java` | **M** (Staged) | Chuẩn hóa thông báo lỗi 409 khi xóa khách sạn đã có booking. |
| | `backend/src/test/java/com/quickstay/admin/AdminRoomApiTest.java` | **M** (Staged) | Thêm test case kiểm tra lọc phòng theo `hotelId`. |
| | `backend/src/test/java/com/quickstay/admin/AdminHotelApiTest.java` | **M** (Staged) | Thêm test case xác thực message 409 khi xóa khách sạn. |
| | `docs/test-reports/T133-admin-bug-fix-report.md` | **A** (Staged) | Báo cáo sửa 2 bug admin. |
| **T134** (Deployment Env) | `backend/.dockerignore` | **A** (Staged) | Loại trừ thư mục build, gradle cache, env khỏi Docker build. |
| | `docker-compose.prod.yml` | **A** (Staged) | Cấu hình compose production dùng GHCR images, mạng nội bộ MySQL. |
| | `README.md` | **M** (Staged) | Bổ sung tài liệu vận hành và deploy VPS Ubuntu. |
| | `docs/test-reports/T134-deployment-environment-report.md` | **A** (Staged) | Báo cáo kiểm thử môi trường production. |
| **T135** (Sprint Review) | `docs/sprint-review-retro-week-2.md` | **A** (Staged) | Tài liệu Sprint Review & Retrospective tuần 2. |
| **T145** (Server Setup) | `docs/deployment/T145-docker-server-setup.md` | **A** (Staged) | Hướng dẫn cấu hình VPS, Docker engine, bảo mật firewall. |
| **T146** (Nginx & Reverse Proxy) | `backend/Dockerfile` | **M** (Staged) | Cài đặt `curl` (`apk add --no-cache curl`) cho Docker healthcheck. |
| | `backend/src/main/resources/application.properties` | **M** (Staged) | Cấu hình `server.forward-headers-strategy=NATIVE` cho Nginx proxy. |
| | `frontend/nginx.conf` | **M** (Staged) | Cấu hình Nginx reverse proxy `/api/`, cache tĩnh, SPA fallback. |
| | `.env.example` | **M** (Staged) | Bổ sung biến môi trường Nginx, timezone, cấu hình domain. |
| | `.gitignore` | **M** (Staged) | Bổ sung quy tắc loại trừ file khóa SSL/TLS (`*.pem`, `*.key`). |
| | `docs/test-reports/T146-nginx-production-deployment-report.md` | **A** (Staged) | Báo cáo kiểm thử Nginx reverse proxy. |
| **T147** (Database Backup) | `scripts/backup-mysql.ps1` | **A** (Staged) | PowerShell script sao lưu tự động MySQL qua container. |
| | `scripts/restore-mysql.ps1` | **A** (Staged) | PowerShell script phục hồi dữ liệu MySQL an toàn. |
| | `docs/deployment/T147-mysql-backup-restore.md` | **A** (Staged) | Tài liệu hướng dẫn backup/restore cơ sở dữ liệu. |
| | `docs/test-reports/T147-mysql-backup-restore-report.md` | **A** (Staged) | Báo cáo kiểm thử backup/restore với volume thật. |
| **Sửa test Frontend** | `frontend/src/App.test.jsx` | **M** (Unstaged) | Đổi chuỗi so khớp `'Quản lý khách sạn'` sang regex `/quản lý khách sạn/i`. |

---

### 1.3. Bằng chứng xác định nguồn gốc 25 file: Có phải "thay đổi chưa commit bị mất" không?

> **KẾT LUẬN QUAN TRỌNG:** 25 file này **KHÔNG PHẢI LÀ CODE CHƯA COMMIT**. Toàn bộ mã nguồn đã được commit và push lên remote từ trước.

**Bằng chứng cụ thể từ lịch sử Git:**
1. **24 file Staged:**
   - Hoàn toàn trùng khớp 100% với 2 commit của Lê Duy Minh trên nhánh `minh/assigned-tasks`:
     - Commit `8875090` (06/11/2026): *T132, T133, T134, T135: CORS test, bug fix, deployment, sprint review* (13 files).
     - Commit `165e4be` (09/11/2026): *T145, T146, T147: Docker server setup, Nginx reverse proxy, MySQL backup & restore* (13 files, có 2 file trùng).
   - Kiểm tra nhánh remote `origin/minh/assigned-tasks`: Đang ở đúng commit `165e4be`. Toàn bộ 24 file này đã nằm an toàn trên GitHub, không có rủi ro mất dữ liệu.
2. **File thứ 25 (`frontend/src/App.test.jsx`):**
   - Đã được commit trước đó trên nhánh kiểm thử `test/merge-clean-dev-to-main` tại commit `a3a5d2d` (*fix(test): update admin hotels page text matcher to case-insensitive regex*).
3. **Tại sao working tree lại xuất hiện 25 file này?**
   - Nhánh `test/merge-minh-to-clean-dev` được tạo ra để thử nghiệm merge `minh/assigned-tasks` vào `origin/recovery/clean-dev`.
   - Trạng thái `All conflicts fixed but you are still merging (use "git commit" to conclude merge)` là trạng thái staged tự nhiên của Git khi đang trong quá trình thực thi một lệnh merge (in-progress merge).

---

## 2. Xác minh các nhánh và quan hệ commit

### 2.1. Bảng đối chiếu 5 nhánh liên quan

| Nhánh | Commit SHA đầu nhánh | Tác giả & Thông điệp commit | Đánh giá hiện trạng |
|---|:---:|---|---|
| `origin/main` | `ef1393d` | Zn101 – *fix: decode SSH deploy key in GitHub Actions* | Nhánh chính thức, chứa CD workflow deploy VPS thực tế qua SSH. |
| `origin/dev` | `2e47fe6` | Zn101 – *Merge pull request #8 from Zn101/dev-minh* | **Lỗi thời 9 ngày** (02/11/2026). Là tổ tiên trực tiếp của `main`. |
| `origin/recovery/clean-dev` | `160f20e` | Zn101 – *Merge pull request #24 from Zn101/dev-vuong* | **Nhánh tích hợp sống của cả nhóm tuần 2**. Chứa PR #12 → #24. |
| `origin/minh/assigned-tasks` | `165e4be` | Minh – *T145, T146, T147: Docker server setup...* | Nhánh làm việc cá nhân của Minh, chứa toàn bộ T082–T147. |
| `test/merge-minh-to-clean-dev` | `160f20e` (+ merge `165e4be`) | Merge in-progress (`HEAD` = `160f20e`, `MERGE_HEAD` = `165e4be`) | Nhánh local dùng để kiểm thử tích hợp giữa clean-dev và Minh. |

---

### 2.2. Quan hệ commit và độ lệch giữa các nhánh

```mermaid
gitGraph
   commit id: "2e47fe6 (dev cũ)"
   commit id: "503c6cb (PR #17 base)"
   branch main
   checkout main
   commit id: "6abf259 (restore CD)"
   commit id: "a20511c (VPS deploy)"
   commit id: "ef1393d (main HEAD)"
   checkout root
   branch "recovery/clean-dev"
   checkout "recovery/clean-dev"
   commit id: "97a903b (PR #21 Minh)"
   commit id: "1a528f6 (PR #22 Vuong)"
   branch "minh/assigned-tasks"
   checkout "minh/assigned-tasks"
   commit id: "8875090 (T132-T135)"
   commit id: "165e4be (T145-T147)"
   checkout "recovery/clean-dev"
   commit id: "c9473cf (T140 Vuong)"
   commit id: "7baa62c (T165 Vuong)"
   commit id: "5f04932 (T142 Vuong)"
   commit id: "160f20e (PR #24 HEAD)"
```

- **`origin/dev` so với `origin/main`:**
  - `origin/dev..origin/main`: **62 commits** (main đi trước dev 62 commits).
  - `origin/main..origin/dev`: **0 commits** (dev không có bất kỳ commit mới nào mà main chưa có).
  - Điểm chung (merge base): `2e47fe6` (chính là đỉnh của `origin/dev`).
- **`origin/recovery/clean-dev` so với `origin/main`:**
  - `recovery/clean-dev..main`: **24 commits** trên `main` chưa có trên `recovery/clean-dev` (chủ yếu là hệ thống CD deploy VPS và các commit hotfix liên quan).
  - `main..recovery/clean-dev`: **11 commits** trên `recovery/clean-dev` chưa có trên `main` (bao gồm toàn bộ logic tuần 2: PR #17 đến PR #24).
  - Điểm chung (merge base): `503c6cb` (Merge pull request #17 from Zn101/dev-vuong).
- **`origin/minh/assigned-tasks` so với `origin/recovery/clean-dev`:**
  - `recovery/clean-dev..minh`: **2 commits** (`8875090` và `165e4be`, chứa T132–T147).
  - `minh..recovery/clean-dev`: **4 commits** (`c9473cf`, `7baa62c`, `5f04932`, `160f20e` do Vương đưa vào qua PR #24).
  - Điểm chung (merge base): `1a528f6` (Merge pull request #22 from Zn101/dev-vuong).

---

### 2.3. Vị trí chính xác của các commit T132–T147
- Commit `8875090` (T132, T133, T134, T135) và Commit `165e4be` (T145, T146, T147):
  - Đang nằm trên nhánh: `minh/assigned-tasks` (local) và `origin/minh/assigned-tasks` (remote).
  - **Chưa có mặt** trên: `origin/recovery/clean-dev`, `origin/dev`, `origin/main`.

---

### 2.4. Hiện trạng PR #13 và PR #21
- **PR #13:** Đã được merge vào ngày 04/11/2026 tại commit `0f3826f` (*Merge pull request #13 from Zn101/minh/assigned-tasks*). Nhánh `recovery/clean-dev` sau đó đã có commit `3df9521` của Vương để sửa lỗi biên dịch sau PR #13.
- **PR #21:** Cũng đã được merge vào ngày 06/11/2026 tại commit `97a903b` (*Merge pull request #21 from Zn101/minh/assigned-tasks*), đưa các task T069, T120, T121 vào `recovery/clean-dev`.
- **Kết luận:** PR #13 và PR #21 đều **ĐÃ ĐÓNG VÀ HOÀN TẤT TRONG QUÁ KHỨ**. Không thể "cập nhật" hay "re-open" PR #13 để đẩy T132–T147. Để đưa T132–T147 vào `recovery/clean-dev`, bắt buộc phải tạo một Pull Request mới trên GitHub.

---

## 3. Kiểm tra quy trình CI/CD

### 3.1. Đối chiếu 3 workflow

#### 1. `.github/workflows/cd-docker.yml`
- **Hiện trạng:** Tồn tại trên cả `origin/main`, `origin/recovery/clean-dev`, và `origin/minh/assigned-tasks`.
- **Chức năng:** Trigger khi có push/merge vào nhánh `main`. Build Docker images multi-stage cho backend và frontend, gắn tag (SHA + latest), push lên GitHub Container Registry (`ghcr.io`).
- **Khác biệt quan trọng giữa `main` và các nhánh khác:**
  - Phiên bản trên `origin/main` (commit `a20511c` và `ef1393d`) có thêm **Bước 7: Deploy to VPS**: sử dụng SSH key giải mã từ secret `VPS_SSH_KEY`, kết nối SSH vào VPS Ubuntu tại `/opt/quickstay`, thực hiện `docker compose pull backend frontend`, khởi động lại dịch vụ và kiểm tra endpoint `/actuator/health`.
  - Phiên bản trên `recovery/clean-dev` và `minh/assigned-tasks` chưa có bước 7 này.

#### 2. `.github/workflows/ci-backend.yml`
- **Hiện trạng:** Đã bị xóa khỏi repository từ ngày 02/11/2026.
- **Lý do bị xóa:** Bị cuốn vào commit revert PR #8 (`46e1d5e`) và PR #10 (`bb4ef9a`) khi nhóm xử lý sự cố xung đột code đầu dự án, và sau đó không ai khôi phục lại.
- **Chức năng ban đầu:** Trigger khi có PR hoặc push vào `backend/**`. Khởi tạo JDK 17, phân quyền `gradlew`, cache dependency, chạy `./gradlew build` (kiểm thử 271 unit/integration test trên database H2 in-memory), xuất báo cáo test ra GitHub Artifacts và Step Summary.

#### 3. `.github/workflows/ci-frontend.yml`
- **Hiện trạng:** Đã bị xóa cùng đợt với `ci-backend.yml` vào ngày 02/11/2026.
- **Chức năng ban đầu:** Trigger khi có PR hoặc push vào `frontend/**`. Chạy `npm ci`, thực thi test runner `npm test` (Vitest), build bundle `npm run build` và kiểm tra lỗi biên dịch JSX/CSS.

---

### 3.2. Đánh giá nguy cơ: Việc xóa CI có ảnh hưởng đến kiểm thử trước khi deploy không?

> ⚠️ **MỨC ĐỘ RỦI RO: ĐẶC BIỆT CAO (CRITICAL)**

1. **Dockerfile bỏ qua kiểm thử:**
   File `backend/Dockerfile` đóng gói ứng dụng bằng lệnh:
   ```dockerfile
   RUN ./gradlew bootJar --no-daemon -x test
   ```
   Tùy chọn `-x test` được cố ý cấu hình để tăng tốc độ build Docker image và tránh phụ thuộc vào database bên ngoài khi tạo container.
2. **Hậu quả khi thiếu CI:**
   - Khi không có `ci-backend.yml` và `ci-frontend.yml`, khi bất kỳ ai tạo PR hoặc push vào `main`, **GitHub Actions hoàn toàn không chạy bất kỳ bài test nào**.
   - Nếu mã nguồn có lỗi logic, vỡ API contract, hoặc frontend không render được:
     - Lệnh `bootJar -x test` vẫn biên dịch ra file JAR bình thường.
     - Docker image vẫn được build và push thành công lên GHCR.
     - Bước 7 trong `cd-docker.yml` lập tức SSH vào VPS và triển khai bản lỗi trực tiếp lên môi trường production!
   - Endpoint healthcheck `/actuator/health` chỉ xác nhận ứng dụng Spring Boot khởi động được Spring Context, **không thể phát hiện các lỗi nghiệp vụ hoặc test regression**.

---

## 4. Đánh giá hướng merge

### 4.1. So sánh chi tiết hai phương án

| Tiêu chí | Phương án A: `recovery/clean-dev` → `main` (Khuyến nghị) | Phương án B: `dev` → `main` (Không khả thi) |
|---|---|---|
| **Số commit đưa vào `main`** | **11 commits** (từ `recovery/clean-dev`) + 2 commits T132–T147 (nếu merge Minh trước). | **0 commit**. Nhánh `dev` cũ hơn `main` 62 commits. |
| **Tính năng tích hợp** | Toàn bộ tính năng tuần 2: phân trang T165, coverage JaCoCo T142, edge case T140, test đồng thời T126/T127, fix bảo mật T128, admin booking T106–T108, CORS T132, Nginx T146, MySQL backup T147. | Không có thêm tính năng nào. Bỏ sót toàn bộ công việc từ 03/11 đến 11/11 của cả nhóm. |
| **Xung đột (Conflicts)** | 2 file xung đột kiểu add/add (`cd-docker.yml`, `Dockerfile`). Đã có giải pháp rõ ràng. | Không có conflict trực tiếp vì `dev` là tổ tiên của `main` (`Already up to date`). |
| **Rủi ro mất mát chức năng** | Có thể vô tình ghi đè bước deploy VPS trên `main` nếu resolve conflict sai cách. | Cực cao nếu ai đó dùng `git reset --hard` hoặc force-push để ép `main` về `dev`: sẽ làm mất 62 commit và toàn bộ hạ tầng VPS CD. |
| **Bảo toàn CD VPS** | Giữ nguyên 100% nội dung Bước 7 (SSH deploy key, VPS script) của `main`. | Không áp dụng. |

---

### 4.2. Chi tiết 2 xung đột dự kiến trong Phương án A và phương án xử lý

#### Conflict 1: `.github/workflows/cd-docker.yml`
- **Nguyên nhân:** Cả hai nhánh đều tạo file này độc lập từ merge-base `503c6cb`.
- **So sánh:**
  - Phía `main`: Có cấu hình tên image cứng `ghcr.io/zn101/quickstay-...` và có Bước 7: *Deploy to VPS* (SSH command cập nhật container).
  - Phía `recovery/clean-dev` / `minh`: Sử dụng `${{ github.repository_owner }}` và có các comment mô tả cache GHA.
- **Cách xử lý an toàn:**
  - Giữ lại toàn bộ Bước 7 (Deploy to VPS) từ nhánh `main`.
  - Giữ tên image `ghcr.io/zn101/...` từ nhánh `main` để tương thích chính xác với secrets và compose đang chạy trên VPS.
  - Tích hợp thêm các chú thích cache hữu ích từ `clean-dev`.

#### Conflict 2: `backend/Dockerfile`
- **Nguyên nhân:** Cả hai nhánh đều thêm file từ cùng điểm xuất phát.
- **So sánh:**
  - Phía `main`: File bị dính Byte Order Mark (BOM UTF-8) ở đầu file và ký tự gạch ngang bị vỡ font (`â€“`), không có lệnh cài `curl`.
  - Phía `clean-dev` / `minh`: File UTF-8 sạch. Nhánh `minh/assigned-tasks` đã có thêm lệnh `RUN apk add --no-cache curl` phục vụ healthcheck của Nginx/Docker.
- **Cách xử lý an toàn:**
  - Sử dụng toàn bộ file `backend/Dockerfile` từ nhánh `minh/assigned-tasks` (có `curl`, UTF-8 sạch, không có BOM).

---

### 4.3. Các kiểm thử bắt buộc phải vượt qua trước khi merge vào `main`

1. **Backend Test Suite (Local / Sandbox):**
   - Lệnh: `./backend/gradlew -p backend test`
   - Tiêu chí: Tối thiểu **271/271 test cases PASSED** (0 failures, 0 errors, 0 ignored).
2. **Backend Production Packaging:**
   - Lệnh: `./backend/gradlew -p backend bootJar`
   - Tiêu chí: Tạo thành công file `backend/build/libs/app.jar` (~66 MB).
3. **Frontend Vitest Suite:**
   - Lệnh: `npm --prefix frontend test`
   - Tiêu chí: **18/18 test cases PASSED** (đã bao gồm matcher regex `/quản lý khách sạn/i`).
4. **Frontend Production Build:**
   - Lệnh: `npm --prefix frontend run build`
   - Tiêu chí: Sinh thư mục `frontend/dist/` sạch sẽ, không có cảnh báo compile lỗi.
5. **Cấu hình Docker Compose Dev & Prod:**
   - Lệnh: `docker compose config` và `docker compose -f docker-compose.prod.yml config`
   - Tiêu chí: Cú pháp YAML hợp lệ, cấu hình biến môi trường và service mapping chính xác.

---

## 5. Kết luận & Đề xuất hành động

### 5.1. Nhánh nguồn và nhánh đích đề xuất
- **Nhánh nguồn tích hợp cấp 1:** `origin/minh/assigned-tasks` → `origin/recovery/clean-dev` (đưa T132–T147 vào nhánh làm việc chung của nhóm).
- **Nhánh nguồn tích hợp cấp 2:** `origin/recovery/clean-dev` → `origin/main`.
- **Nhánh đích cuối cùng:** `origin/main` (Production).

### 5.2. Các thay đổi bắt buộc phải bảo toàn
1. **Bước Deploy to VPS qua SSH** trong `.github/workflows/cd-docker.yml` trên `main` (không để bị ghi đè bởi bất kỳ nhánh dev nào).
2. **Lệnh `RUN apk add --no-cache curl`** trong `backend/Dockerfile` của Minh để Docker healthcheck hoạt động ổn định trên VPS.
3. **Cấu hình `server.forward-headers-strategy=NATIVE`** trong `application.properties` để Spring Boot nhận đúng IP và scheme từ Nginx reverse proxy.
4. **Sửa đổi regex trong `frontend/src/App.test.jsx`** để frontend test luôn xanh trên mọi môi trường.

### 5.3. Các rủi ro chưa giải quyết
1. **Thiếu rào chắn tự động CI:** Cần khôi phục `ci-backend.yml` và `ci-frontend.yml` trên `main` để ngăn chặn việc tự động deploy mã nguồn hỏng lên VPS.
2. **Nhánh `dev` bị bỏ quên:** Sau khi merge xong vào `main`, nhánh `origin/dev` cần được cập nhật (fast-forward hoặc reset theo `main`) để tránh nhầm lẫn cho các thành viên khác trong các sprint sau.

### 5.4. Các bước cần Minh xác nhận trước khi thực hiện
1. **Xác nhận 1:** Đồng ý hủy bỏ trạng thái in-progress merge trên nhánh tạm `test/merge-minh-to-clean-dev` (vì toàn bộ 25 file đã an toàn trên `origin/minh/assigned-tasks`).
2. **Xác nhận 2:** Mở Pull Request mới trên GitHub: `minh/assigned-tasks` → `recovery/clean-dev` (không cố gắng dùng lại PR #13 đã đóng).
3. **Xác nhận 3:** Chọn **Phương án A** (`recovery/clean-dev` → `main`) và phê duyệt phương án giải quyết conflict giữ lại bước deploy VPS của `main`.
4. **Xác nhận 4:** Bổ sung việc khôi phục lại 2 workflow `ci-backend.yml` và `ci-frontend.yml` ngay sau khi merge vào `main`.
