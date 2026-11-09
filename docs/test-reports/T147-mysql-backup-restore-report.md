# T147 – Báo cáo kiểm tra sao lưu (Backup) và phục hồi (Restore) Docker Volume MySQL

**Ngày thực hiện:** 09/11/2026 · **Người thực hiện:** Lê Duy Minh  
**Môi trường kiểm thử:** Windows 11, Docker Desktop (v4.x), PowerShell 5.1  
**Môi trường VPS:** Chưa có môi trường VPS thật (mọi kiểm thử được thực hiện trên môi trường Docker cục bộ)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng và kiểm thử thành công quy trình sao lưu (Backup) cơ sở dữ liệu MySQL chạy trong Docker Volume.
2. Xây dựng và kiểm thử quy trình phục hồi (Restore) an toàn sang một cơ sở dữ liệu kiểm thử riêng biệt (`quickstay_test_restore`).
3. Đảm bảo toàn bộ quá trình không tác động hoặc làm thay đổi cơ sở dữ liệu chính `quickstay` và volume dữ liệu thật của nhóm.
4. Bảo đảm bảng mã UTF-8 tiếng Việt được bảo toàn nguyên vẹn, không bị lỗi font khi truyền qua PowerShell và Docker.
5. Bảo đảm bảo mật: Mật khẩu không bị lộ qua CLI/Git, các tệp backup được `.gitignore` bảo vệ tuyệt đối.

---

## 2. Danh sách file đã tạo / chỉnh sửa

| Tệp | Hành động | Mục đích |
|---|---|---|
| `scripts/backup-mysql.ps1` | Tạo mới | Script PowerShell tự động backup MySQL, kiểm tra container, volume thực tế, đặt tên theo ngày giờ |
| `scripts/restore-mysql.ps1` | Tạo mới | Script PowerShell khôi phục an toàn vào database kiểm thử, có chốt an toàn khi restore database thật |
| `docs/deployment/T147-mysql-backup-restore.md` | Tạo mới | Tài liệu hướng dẫn sử dụng chi tiết cho người dùng và quản trị viên |
| `docs/test-reports/T147-mysql-backup-restore-report.md` | Tạo mới | Báo cáo chi tiết kết quả kiểm thử thực tế |
| `.gitignore` | Chỉnh sửa | Bổ sung `backups/`, `*.sql`, `*.sql.gz` để ngăn rò rỉ dữ liệu lên Git |
| `README.md` | Chỉnh sửa | Cập nhật mục hướng dẫn nhanh Backup & Restore cho toàn nhóm |

---

## 3. Cấu hình xác minh thực tế (Baseline)

- **Container MySQL:** `quickstay-mysql-1` (Trạng thái: `Up`, `healthy`).
- **Docker Volume thực tế mount tại `/var/lib/mysql`:** `quickstay_mysql-data-recovery`.
- **Database nguồn:** `quickstay` (Charset: `utf8mb4`, Collation: `utf8mb4_unicode_ci`).
- **Số liệu dữ liệu gốc ghi nhận trước kiểm thử:**
  - Bảng `users`: **2** bản ghi (`admin@quickstay.local`, `leduyminh2006k4@gmail.com`).
  - Bảng `hotels`: **4** bản ghi.
  - Bảng `rooms`: **9** bản ghi.
  - Bảng `bookings`: **0** bản ghi.

---

## 4. Nhật ký thực thi kiểm thử

### 4.1. Kiểm thử sao lưu (Backup)

- **Lệnh thực thi:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\backup-mysql.ps1
  ```
- **Kết quả đầu ra thực tế:**
  ```text
  ==============================================================
   [QuickStay] BAT DAU BACKUP CO SO DU LIEU MYSQL DOCKER
  ==============================================================
  Thoi gian bat dau:   2026-11-09 23:09:47
  Container MySQL:     quickstay-mysql-1
  Docker Volume mount: quickstay_mysql-data-recovery
  Database nguon:      quickstay
  Thu muc xuat file:   D:\OJT_QuickStay_Project\QuickStay\backups
  File backup:         quickstay_backup_20261109_230947.sql
  ==============================================================

  [THANH CONG] Sao luu co so du lieu hoan tat!
  File backup:  D:\OJT_QuickStay_Project\QuickStay\backups\quickstay_backup_20261109_230947.sql
  Kich thuoc:   7.71 KB (7897 bytes)
  So dong SQL:  141 dong
  Kiem tra:     Dat chuan MySQL dump UTF-8 (Khong khoa cung database dich)
  ==============================================================
  ```
- **Xác minh file backup:**
  - Tệp tồn tại: `D:\OJT_QuickStay_Project\QuickStay\backups\quickstay_backup_20261109_230947.sql`.
  - Dung lượng: `7897 bytes` (> 0 bytes).
  - Kiểm tra header: Có dòng `-- MySQL dump 10.13 Distrib 8.4.13`.
  - Kiểm tra kết thúc: Có dòng `-- Dump completed on 2026-11-09 16:09:47`.
  - **Kiểm tra Decoupling:** Không chứa `CREATE DATABASE` và không chứa `USE quickstay;` $\rightarrow$ Đạt yêu cầu cho phép chuyển dữ liệu sang database kiểm thử bất kỳ.
  - **Kiểm tra Git:** `git status --short` xác nhận thư mục `backups/` và file `.sql` hoàn toàn không bị Git theo dõi.

### 4.2. Kiểm thử phục hồi sang môi trường kiểm thử riêng (Restore)

- **Lệnh thực thi:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\restore-mysql.ps1 `
      -BackupFile .\backups\quickstay_backup_20261109_230947.sql `
      -TargetDatabase quickstay_test_restore
  ```
- **Kết quả đầu ra thực tế:**
  ```text
  ==============================================================
   [QuickStay] BAT DAU KHOI PHUC CO SO DU LIEU MYSQL DOCKER
  ==============================================================
  Thoi gian bat dau:   2026-11-09 23:09:55
  Container MySQL:     quickstay-mysql-1
  Docker Volume mount: quickstay_mysql-data-recovery
  File backup nguon:   D:\OJT_QuickStay_Project\QuickStay\backups\quickstay_backup_20261109_230947.sql
  Kich thuoc file:     7.71 KB
  Database dich:       quickstay_test_restore
  ==============================================================

  Dang nap du lieu tu file backup vao database 'quickstay_test_restore'...

  ==============================================================
   [KET QUA XAC MINH DU LIEU SAU RESTORE]
  ==============================================================
  Danh sach bang da khoi phuc trong 'quickstay_test_restore' (Tong cong: 4 bang):
    - Bang bookings: 0 ban ghi
    - Bang hotels: 4 ban ghi
    - Bang rooms: 9 ban ghi
    - Bang users: 2 ban ghi

  Mau du lieu nguoi dung va khach san (Kiem tra UTF-8 tieng Viet):
  id	email	full_name	role
  1	admin@quickstay.local	Quan tri vien	ADMIN
  2	leduyminh2006k4@gmail.com	Duy Minh Lê	CUSTOMER
  id	name	city
  1	Sunrise Da Nang Hotel	Da Nang
  2	Old Quarter Boutique Ha Noi	Ha Noi

  ==============================================================
   [DOI CHIEU VOI DATABASE GOC 'quickstay']
  ==============================================================
  tbl	count
  users	2
  hotels	4
  rooms	9
  bookings	0
  [XAC NHAN AN TOAN] Database goc 'quickstay' van giu nguyen 100% du lieu, khong he bi anh huong!
  [GHI CHU] Database kiem thu 'quickstay_test_restore' van duoc GIU NGUYEN de phuc vu kiem tra (khong tu dong drop).

  [HOAN TAT] Khoi phuc du lieu thanh cong!
  ==============================================================
  ```

---

## 5. Bảng đối chiếu dữ liệu trước và sau Restore

| Tên bảng | Dữ liệu gốc `quickstay` (Trước backup) | Dữ liệu khôi phục `quickstay_test_restore` | Dữ liệu gốc `quickstay` (Sau restore) | Trạng thái đối chiếu |
|---|---|---|---|---|
| `users` | **2** bản ghi | **2** bản ghi | **2** bản ghi | **PASS** (Khớp 100%) |
| `hotels` | **4** bản ghi | **4** bản ghi | **4** bản ghi | **PASS** (Khớp 100%) |
| `rooms` | **9** bản ghi | **9** bản ghi | **9** bản ghi | **PASS** (Khớp 100%) |
| `bookings` | **0** bản ghi | **0** bản ghi | **0** bản ghi | **PASS** (Khớp 100%) |

### Đối chiếu dữ liệu chi tiết tiếng Việt (UTF-8)

- **Bản ghi User 2:**
  - Database gốc `quickstay`: `Duy Minh Lê`
  - Database khôi phục `quickstay_test_restore`: `Duy Minh Lê`
  - Đánh giá: **PASS** – Dấu tiếng Việt `ê` được bảo toàn nguyên vẹn, không xảy ra hiện tượng vỡ font (mojibake).
- **Bản ghi Hotels:**
  - Khách sạn 1: `Sunrise Da Nang Hotel` / `12 Vo Nguyen Giap, Son Tra`
  - Khách sạn 2: `Old Quarter Boutique Ha Noi` / `28 Hang Bac, Hoan Kiem`
  - Khách sạn 3: `Saigon Central Inn` / `45 Le Loi, Quan 1`
  - Khách sạn 4: `Hoi An Riverside Homestay` / `8 Bach Dang, Cam Chau`
  - Đánh giá: **PASS** – Schema, khóa chính, khóa ngoại, dữ liệu text khớp hoàn toàn 1:1.

---

## 6. Kiểm thử các kịch bản ngoại lệ (Edge Cases)

| Kịch bản | Thao tác kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| **File backup không tồn tại** | Chạy `restore-mysql.ps1 -BackupFile ./backups/non_existing_file.sql` | Báo lỗi rõ ràng và dừng lại | Ném ngoại lệ: `LOI RESTORE: Khong tim thay file backup!...` (Exit code: 1) | **PASS** |
| **Thiếu biến mật khẩu trên Production** | Chạy `backup-mysql.ps1 -Production` | Chặn đứng, cấm dùng dev password | Ném ngoại lệ: `LOI BAO MAT: Khong tim thay DB_ROOT_PASSWORD!...` (Exit code: 1) | **PASS** |
| **Chỉ định container không tồn tại** | Chạy `backup-mysql.ps1 -ContainerName nonexistent-mysql` | Báo lỗi không tìm thấy container | Ném ngoại lệ: `LOI: Container 'nonexistent-mysql' khong ton tai hoac khong o trang thai running!` (Exit code: 1) | **PASS** |

---

## 7. Đánh giá trạng thái thực hiện

- **ĐÃ TRIỂN KHAI:**
  - [x] Script sao lưu `scripts/backup-mysql.ps1`.
  - [x] Script phục hồi `scripts/restore-mysql.ps1`.
  - [x] Cấu hình bảo mật `.gitignore` (ngăn commit file `.sql` và thư mục `backups/`).
  - [x] Tài liệu hướng dẫn sử dụng [docs/deployment/T147-mysql-backup-restore.md](docs/deployment/T147-mysql-backup-restore.md).
  - [x] Báo cáo kiểm thử [docs/test-reports/T147-mysql-backup-restore-report.md](docs/test-reports/T147-mysql-backup-restore-report.md).
- **ĐÃ KIỂM THỬ THÀNH CÔNG (PASS):**
  - [x] Backup MySQL từ Docker Volume `quickstay_mysql-data-recovery` thành công.
  - [x] Xuất dump không kèm `CREATE DATABASE` / `USE`, decouple hoàn toàn database đích.
  - [x] Restore vào database kiểm thử riêng biệt `quickstay_test_restore` thành công.
  - [x] Đối chiếu số lượng bảng và số lượng dòng dữ liệu khớp 100%.
  - [x] Kiểm tra bảo toàn dữ liệu tiếng Việt UTF-8 thành công.
  - [x] Kiểm tra an toàn: Database gốc `quickstay` và Docker volume gốc không bị biến động hay thay đổi.
  - [x] Kiểm thử 3 ca ngoại lệ (thiếu file, thiếu mật khẩu production, sai container) thành công.
- **CHƯA KIỂM THỬ:**
  - [ ] Khôi phục trên môi trường máy chủ Ubuntu VPS thực tế (lý do: dự án chưa được cấp phát VPS thật).
- **TRẠNG THÁI TỒN TẠI:**
  - Database kiểm thử `quickstay_test_restore` đang được giữ nguyên trên container để người dùng kiểm tra độc lập (không tự ý DROP).
