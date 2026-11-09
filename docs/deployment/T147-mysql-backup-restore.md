# T147 – Hướng dẫn sao lưu (Backup) và phục hồi (Restore) Docker Volume MySQL

**Ngày thực hiện:** 09/11/2026 · **Người thực hiện:** Lê Duy Minh  
**Dự án:** QuickStay · **Môi trường:** Docker Desktop (Windows / PowerShell)

---

## 1. Giới thiệu tổng quan

Cơ sở dữ liệu MySQL của QuickStay được triển khai dưới dạng Docker container (`mysql:8.4`) và lưu trữ dữ liệu bền vững trên Docker Volume.
Tài liệu này hướng dẫn quy trình sao lưu (Logical Backup) và khôi phục (Restore) an toàn, phòng ngừa rủi ro mất mát dữ liệu và phục vụ quy trình kiểm thử.

### Thành phần hệ thống

| Thành phần | Thông tin chi tiết |
|------------|-------------------|
| **Dịch vụ Docker** | `mysql` (Container name: `quickstay-mysql-1`) |
| **Image** | `mysql:8.4` |
| **Docker Volume thực tế** | `quickstay_mysql-data-recovery` (Mount tại `/var/lib/mysql`) |
| **Database chính** | `quickstay` |
| **Bảng mã (Encoding)** | `utf8mb4` / `utf8mb4_unicode_ci` |
| **Script Backup** | `scripts/backup-mysql.ps1` |
| **Script Restore** | `scripts/restore-mysql.ps1` |
| **Thư mục lưu backup** | `backups/` (Đã được cấu hình trong `.gitignore`) |

---

## 2. Nguyên lý kỹ thuật

### 2.1. Tại sao dùng Logical Backup (`mysqldump`) thay vì copy physical volume?
- **Không làm gián đoạn hệ thống:** Sử dụng cờ `--single-transaction --quick` cho phép tạo snapshot dữ liệu nhất quán (ACID) của toàn bộ các bảng InnoDB mà không cần khóa bảng, không cần dừng container MySQL.
- **Tính di động cao:** File SQL thuần text có thể kiểm tra cấu trúc, nén, chuyển giao giữa các môi trường (Dev Windows, Staging, Production Ubuntu VPS).
- **Tránh rủi ro hỏng tệp InnoDB:** Copy tệp nhị phân (`ibdata1`, redo log buffers) khi MySQL đang hoạt động rất dễ dẫn đến hỏng cấu trúc dữ liệu nếu có transaction đang ghi dở.

### 2.2. Xử lý decoupling Database đích (Không khóa cứng `USE / CREATE DATABASE`)
Để file backup có thể được phục hồi linh hoạt sang bất kỳ database nào (ví dụ: `quickstay_test_restore` phục vụ kiểm thử) mà **không làm ảnh hưởng tới database chính**, lệnh `mysqldump` được chạy theo cú pháp:

```powershell
docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysqldump -u root \
    --single-transaction --quick --routines --triggers --events \
    --default-character-set=utf8mb4 quickstay
```

> **Lưu ý quan trọng:** Không sử dụng cờ `--databases quickstay` vì cờ này sẽ tự động sinh lệnh `CREATE DATABASE quickstay` và `USE quickstay;` trong file dump, làm mất khả năng khôi phục vào database đích khác.

### 2.3. Bảo toàn mã hóa UTF-8 tiếng Việt trên Windows
Trên Windows PowerShell, truyền dữ liệu qua pipeline string thông thường có thể làm méo bảng mã do Windows code page. Script giải quyết bằng cách:
1. Thiết lập `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` và `$OutputEncoding = [System.Text.Encoding]::UTF8`.
2. Dùng luồng chuyển hướng trực tiếp qua `cmd.exe /c "... < backup.sql"` để truyền nguyên vẹn binary bytes UTF-8 vào MySQL.
3. Chỉ định cờ `--default-character-set=utf8mb4` trong cả lệnh export và import.

---

## 3. Hướng dẫn Sao lưu (Backup)

### 3.1. Lệnh cơ bản (Tự động nhận diện)

Mở PowerShell tại thư mục gốc của dự án (`QuickStay`):

```powershell
.\scripts\backup-mysql.ps1
```

Script sẽ:
1. Tự động tìm container MySQL đang chạy (`quickstay-mysql-1`).
2. Xác minh Docker Volume thực tế được mount tại `/var/lib/mysql`.
3. Đọc `DB_ROOT_PASSWORD` từ file `.env` hoặc biến môi trường.
4. Xuất file backup vào thư mục `backups/` với tên theo ngày giờ: `quickstay_backup_yyyyMMdd_HHmmss.sql`.
5. Tự động kiểm tra file tồn tại, dung lượng `> 0` bytes, kiểm tra header và dòng kết thúc `Dump completed on`.

### 3.2. Các tùy chọn nâng cao

| Tham số | Mặc định | Mô tả |
|---------|----------|-------|
| `-ContainerName` | Auto-detect | Chỉ định đích danh tên container MySQL |
| `-Database` | `quickstay` | Tên database cần backup |
| `-OutputDir` | `./backups` | Thư mục lưu trữ file backup |
| `-RootPassword` | Từ `.env` | Cung cấp mật khẩu root trực tiếp |
| `-Production` | False | Chế độ Production: Bắt buộc có mật khẩu, cấm fallback mật khẩu mặc định |

**Ví dụ:**

```powershell
# Chỉ định thư mục lưu trữ khác
.\scripts\backup-mysql.ps1 -OutputDir D:\DataBackups

# Chạy trên môi trường Production với biến môi trường
.\scripts\backup-mysql.ps1 -Production
```

---

## 4. Hướng dẫn Phục hồi (Restore)

### 4.1. Khôi phục an toàn vào Database kiểm thử (Khuyến nghị)

Mặc định, script restore sẽ nạp dữ liệu vào database kiểm thử độc lập mang tên `quickstay_test_restore`. Database chính `quickstay` được bảo toàn nguyên vẹn 100%.

```powershell
# Tự động lấy file backup mới nhất trong thư mục backups/
.\scripts\restore-mysql.ps1

# Hoặc chỉ định file backup cụ thể
.\scripts\restore-mysql.ps1 -BackupFile .\backups\quickstay_backup_20261109_230947.sql
```

Sau khi hoàn thành, script tự động:
- Đếm số lượng bảng và số lượng bản ghi của từng bảng trong database đích.
- Hiển thị mẫu dữ liệu tiếng Việt để kiểm tra font chữ.
- Đối chiếu số lượng bản ghi với database gốc `quickstay`.
- Giữ nguyên database kiểm thử để phục vụ đối chiếu và kiểm tra.

### 4.2. Khôi phục sự cố vào Database chính (`quickstay`)

> [!CAUTION]
> Thao tác này sẽ **GHI ĐÈ** dữ liệu trong database chính `quickstay`. Chỉ sử dụng khi cần khôi phục sau sự cố thực tế.

```powershell
.\scripts\restore-mysql.ps1 -BackupFile .\backups\quickstay_backup_20261109_230947.sql -TargetDatabase quickstay
```

**Cơ chế bảo vệ 2 lớp:**
1. **Yêu cầu xác nhận:** Script yêu cầu người dùng phải gõ chính xác chữ `YES` mới tiếp tục.
2. **Snapshot tự động:** Trước khi thực hiện ghi đè, script **tự động gọi script backup** để tạo 1 bản snapshot dự phòng tức thời (rollback point). Nếu quá trình restore có vấn đề, bạn vẫn có bản snapshot vừa tạo để hoàn tác.

Nếu chạy trong quy trình tự động hóa (CI/CD):
```powershell
.\scripts\restore-mysql.ps1 -BackupFile .\backups\quickstay_backup_20261109_230947.sql -TargetDatabase quickstay -Force
```

---

## 5. Quy tắc an toàn & Bảo mật

1. **Không đưa file backup lên Git:**
   - Thư mục `backups/`, `*.sql`, `*.sql.gz` đã được khai báo trong [.gitignore](file:///d:/OJT_QuickStay_Project/QuickStay/.gitignore).
   - Tuyệt đối không xóa các dòng này khỏi `.gitignore`.
2. **Không ghi mật khẩu vào mã nguồn:**
   - Không lưu mật khẩu dạng plaintext trong script hay commit vào repository.
   - Script sử dụng biến môi trường nội bộ `MYSQL_PWD` khi giao tiếp với container, không làm lộ mật khẩu qua danh sách tiến trình (`ps`) hoặc log console.
3. **Quy tắc thao tác với Docker:**
   - **Tuyệt đối KHÔNG chạy:** `docker compose down -v` (cờ `-v` sẽ xóa volume chứa dữ liệu).
   - **Tuyệt đối KHÔNG chạy:** `docker system prune -a` trên máy chủ chứa volume dữ liệu.
   - Khi cần dừng hệ thống, chỉ chạy: `docker compose down`.

---

## 6. Xử lý sự cố thường gặp (Troubleshooting)

| Hiện tượng | Nguyên nhân | Cách khắc phục |
|---|---|---|
| `LOI: Khong tim thay container MySQL dang chay` | MySQL container chưa được start | Chạy `docker compose up -d mysql` và đợi đến khi trạng thái chuyển sang `healthy`. |
| `LOI BAO MAT: Khong tim thay DB_ROOT_PASSWORD` | Chạy cờ `-Production` nhưng thiếu cấu hình mật khẩu | Điền `DB_ROOT_PASSWORD` vào file `.env` hoặc truyền biến môi trường `$env:DB_ROOT_PASSWORD`. |
| `LOI RESTORE: Khong tim thay file backup` | Đường dẫn file không chính xác | Kiểm tra lại đường dẫn tệp trong thư mục `backups/`. |
| Lỗi font tiếng Việt khi xem trong console | Console PowerShell chưa đặt encoding UTF-8 | Chạy `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` trước khi truy vấn. |
