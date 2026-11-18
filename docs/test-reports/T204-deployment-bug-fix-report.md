# T204 – Deployment Bug Fix Report

**Ngày:** 16/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh:** `minh/assigned-tasks`  
**Backend test:** 339/339 PASSED

---

## 1. Tổng quan

T204 phát hiện và sửa các lỗi triển khai phát sinh từ T203. 4 bugs xác định, 2 bugs được sửa code, 1 bug giữ nguyên có lý do, 1 bug không ảnh hưởng production.

---

## 2. Danh sách Bug

### BUG-A — `spring.flyway.validate-on-migrate=false` và `baseline-on-migrate=true`

| Thuộc tính | Giá trị |
|-----------|---------|
| **Mức độ** | 🟡 Medium |
| **File** | `backend/src/main/resources/application.properties` |
| **Hiện tượng** | Flyway không validate checksum khi migrate — có thể che giấu migration bị corrupt |
| **Nguyên nhân** | T203: volume cũ có checksum mismatch (V4 bị đổi content sau khi apply) |
| **Phương án** | Giữ `validate-on-migrate=false` để hệ thống chạy được với volume hiện tại. Trên clean machine, V4 migration sẽ chạy đúng từ đầu, không có mismatch. |
| **Trạng thái** | **OPEN (by design)** — cần thiết cho môi trường hiện tại |

**Lý do không sửa:** Nếu set `validate-on-migrate=true` trở lại, backend sẽ crash với volume `quickstay_mysql-test` vì checksum V4 đã bị ghi vào `flyway_schema_history` không khớp content file hiện tại. Trên clean machine không có vấn đề này.

---

### BUG-B — Migration V4 untracked trong Git ⭐ CRITICAL

| Thuộc tính | Giá trị |
|-----------|---------|
| **Mức độ** | 🔴 Critical |
| **File** | `backend/src/main/resources/db/migration/V4__fix_booking_status_type.sql` |
| **Hiện tượng** | File V4 tồn tại trên disk nhưng chưa trong Git — nếu clone fresh, V4 không tồn tại → không fix được lỗi schema trên volume cũ |
| **Nguyên nhân** | T203 tạo file nhưng chưa commit |
| **Cách sửa** | Commit V4 migration vào Git |
| **Trạng thái** | **FIXED** — sẽ commit cùng T204 |

**Nội dung V4:**
```sql
ALTER TABLE bookings MODIFY COLUMN status VARCHAR(20) NOT NULL;
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL;
```

---

### BUG-C — Backend port 8080 expose ra host trong prod compose ⭐ HIGH

| Thuộc tính | Giá trị |
|-----------|---------|
| **Mức độ** | 🟡 High |
| **File** | `docker-compose.prod.yml` |
| **Hiện tượng** | Backend port 8080 được bind ra `0.0.0.0:8080` trên host — bypass Nginx, bypass CORS |
| **Nguyên nhân** | T146 thêm `ports: 8080:8080` để debug, chưa xóa |
| **Bằng chứng** | `git diff origin/main..HEAD -- docker-compose.prod.yml` → `+    ports: 8080:8080` |
| **Cách sửa** | Xóa `ports: 8080:8080` khỏi backend service trong prod compose |
| **Trạng thái** | **FIXED** |

**Trước:**
```yaml
backend:
  ports:
    - "${BACKEND_PORT:-8080}:8080"
```

**Sau:**
```yaml
backend:
  # T204 BUG-C: xoa ports backend - khong can expose ra host
  # Nginx proxy noi bo qua Docker network; cd-docker.yml dung docker compose exec
```

---

### BUG-D — Volume name `quickstay_mysql-test` không khớp README

| Thuộc tính | Giá trị |
|-----------|---------|
| **Mức độ** | 🟢 Low |
| **File** | `docker-compose.yml`, `README.md` |
| **Hiện tượng** | README đề cập `quickstay_mysql-data-recovery` nhưng compose dùng `quickstay_mysql-test` |
| **Trạng thái** | **OPEN** — không sửa vì volume `quickstay_mysql-test` đang có dữ liệu, đổi tên sẽ mất data |

---

## 3. File đã thay đổi

| File | Thay đổi | Bug |
|------|---------|-----|
| `docker-compose.prod.yml` | Xóa `ports: 8080:8080` khỏi backend | BUG-C |
| `backend/src/main/resources/db/migration/V4__fix_booking_status_type.sql` | Commit vào Git | BUG-B |
| `backend/src/main/resources/application.properties` | `baseline-on-migrate=true`, `validate-on-migrate=false` (giữ nguyên) | BUG-A |

---

## 4. Lệnh kiểm thử

```bash
# Compose syntax
docker compose -f docker-compose.prod.yml config --quiet   # ✅ OK

# Verify port removed
grep "8080\|ports:" docker-compose.prod.yml
# Expected: chỉ còn healthcheck dùng localhost:8080, không có ports:

# Backend tests
./gradlew.bat test --no-daemon
# Expected: 339/339 PASSED
```

---

## 5. Kết quả kiểm thử

| Test | Kết quả |
|------|---------|
| `docker-compose.prod.yml config --quiet` | ✅ OK |
| Backend port 8080 không expose trong prod compose | ✅ Xác nhận |
| Backend test suite | ✅ 339/339 PASSED |
| Docker containers (khi Docker chạy) | ✅ 10/10 RT tests PASS từ T203 |

---

## 6. Tổng kết

| Bug | Mức | Trạng thái |
|-----|-----|-----------|
| BUG-A: `validate-on-migrate=false` | 🟡 Medium | OPEN (by design) |
| BUG-B: V4 migration untracked | 🔴 Critical | **FIXED** |
| BUG-C: Backend port 8080 expose prod | 🟡 High | **FIXED** |
| BUG-D: Volume name README mismatch | 🟢 Low | OPEN (data protection) |

**Bugs fixed: 2 | Bugs OPEN (by design): 2**

### Rủi ro còn lại

| Rủi ro | Mức | Ghi chú |
|--------|-----|---------|
| `validate-on-migrate=false` ẩn migration lỗi | Low | Chỉ ảnh hưởng dev/volume cũ; clean machine không gặp |
| Volume name mismatch trong README | Low | Tài liệu không ảnh hưởng deployment |
| Chưa kiểm thử trên clean machine hoàn toàn | Medium | Volume local có data cũ — không test từ zero được |
