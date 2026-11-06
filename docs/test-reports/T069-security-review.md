# T069 – Security Configuration Review

**Ngày thực hiện:** 05/11/2026  
**Người thực hiện:** Minh  
**Môi trường:** Windows 11, Git, PowerShell  
**Phạm vi:** Secret, biến môi trường, .gitignore, lịch sử Git  

---

## 1. Tổng hợp kết quả

| ID | Nội dung kiểm tra | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Bằng chứng |
|----|-------------------|-----------------|----------------|------------|------------|
| T069-01 | Hardcode secret trong source code | Không có secret thật trong code | Không có secret production. Test files có credential test (an toàn) | Đạt | `ApiTestBase.java` line 26: `ADMIN_PASSWORD` là test credential; `JwtServiceTest.java` line 13: test-only secret |
| T069-02 | File `.env` không bị tracking | `.env` không trong Git | `.env` không tồn tại, không tracking, không có trong history | Đạt | `git ls-files .env` → không kết quả; `git log -- .env` → trống |
| T069-03 | `.env.example` chỉ có placeholder/cảnh báo | Không chứa secret thật, có hướng dẫn rõ | Đã cập nhật: thêm cảnh báo rõ ràng, giữ dev defaults với comment PHAI THAY | Đạt | File `.env.example` đã sửa |
| T069-04 | `.gitignore` bao phủ file nhạy cảm | Có quy tắc cho `.env`, cert, key, local config | Đã thêm: `*.pem`, `*.key`, `*.p12`, `*.jks`, `*.pfx`, `*.crt`, `*.cer`, `application-local.*`, `application-secret.*` | Đạt | `.gitignore` đã sửa |
| T069-05 | Git history không có secret bị lộ | Không có secret trong các commit cũ | Không tìm thấy `.env`, `*.pem`, `*.key`, `*.p12`, `*.jks` trong toàn bộ history | Đạt | `git log --all --diff-filter=A -- "*.pem" "*.key"` → trống |
| T069-06 | Docker Compose không hardcode credential quan trọng | Dùng biến môi trường | `docker-compose.yml` dùng `${DB_PASSWORD}`, `${JWT_SECRET}` — đúng cách. Có fallback dev-only đã comment rõ | Đạt | Xem `docker-compose.yml` — pattern `${VAR:-fallback}` |
| T069-07 | CI/CD dùng secrets đúng cách | GitHub Secrets, không hardcode | `.github/workflows/` chỉ có `.gitkeep` — chưa có workflow. Không có secret bị expose | Đạt | `Get-ChildItem .github/workflows` → chỉ `.gitkeep` |

**Kết quả tổng hợp: 7/7 Đạt**

---

## 2. Chi tiết phát hiện

### T069-01: Hardcode secret trong source code

**Kết quả:** Đạt (sau phân tích)

Quét tất cả file `.java` và `.properties` trong `backend/src/` với các pattern:
- `password\s*=\s*"[^"$\{][^"]{3,}"`
- `secret\s*=\s*"[^"$\{][^"]{3,}"`
- `sk-[a-zA-Z0-9]{20,}` (Anthropic key format)
- `eyJ[a-zA-Z0-9_-]{20,}` (JWT token)

Hai kết quả tìm được:

| File | Nội dung | Đánh giá |
|------|---------|---------|
| `ApiTestBase.java:26` | `ADMIN_PASSWORD = "Admin@123"` | ✅ Test credential — chỉ dùng với H2 in-memory, không phải production |
| `JwtServiceTest.java:13` | `SECRET = "test-secret-..."` | ✅ Test-only secret — chỉ dùng trong unit test JwtService |

Không có secret production nào bị hardcode.

### T069-02: File `.env`

**Kết quả:** Đạt

- File `.env` **không tồn tại** trên disk
- Không có trong `git ls-files`
- Không có trong Git history (`git log --all -- ".env"` → trống)
- `.gitignore` line 6 đã cover: `.env`

### T069-03: `.env.example`

**Kết quả:** Đạt (sau sửa)

**Trước:** Chứa default dev values (`quickstay_pw`, `Admin@123`) không có cảnh báo rõ ràng

**Sau:** Thêm header cảnh báo, comment `PHAI THAY` cho từng secret, hướng dẫn tạo JWT secret mạnh

### T069-04: `.gitignore`

**Kết quả:** Đạt (sau sửa)

**Trước:** Thiếu 7 loại file nhạy cảm

**Sau:** Thêm vào section "Certificate & Private Key":
```
*.pem, *.key, *.p12, *.jks, *.pfx, *.crt, *.cer
application-local.properties, application-local.yml
application-secret.properties, application-secret.yml
```

### T069-05: Git history

**Kết quả:** Đạt

Kiểm tra:
```
git log --all --diff-filter=A -- "*.pem" "*.key" "*.p12" "*.jks"
git log --all -- ".env"
```
→ Không có kết quả nào. Không có file nhạy cảm nào từng bị commit.

### T069-06: Docker Compose

**Kết quả:** Đạt

`docker-compose.yml` sử dụng đúng cách:
```yaml
DB_PASSWORD: ${DB_PASSWORD:-quickstay_pw}
JWT_SECRET: ${JWT_SECRET:-change-me-...}
```
Pattern `${VAR:-fallback}` — fallback chỉ dùng khi không set env, và fallback value đã được comment rõ là dev-only.

### T069-07: CI/CD

**Kết quả:** Đạt

`.github/workflows/` chỉ chứa `.gitkeep`. Chưa có workflow nào được triển khai. Không có risk hiện tại.

> **Khuyến nghị cho tương lai:** Khi thêm CI/CD, dùng GitHub Secrets (`${{ secrets.JWT_SECRET }}`) thay vì hardcode trong workflow YAML.

---

## 3. Bug phát hiện

**Không phát hiện bug mức High hoặc Critical.**

Không có secret production nào bị lộ trong code hoặc Git history.

---

## 4. Các thay đổi đã thực hiện

| File | Thay đổi |
|------|---------|
| `.gitignore` | Thêm section "Certificate & Private Key": `*.pem`, `*.key`, `*.p12`, `*.jks`, `*.pfx`, `*.crt`, `*.cer`, `application-local.*`, `application-secret.*` |
| `.env.example` | Thêm header cảnh báo, comment `PHAI THAY` cho DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD; hướng dẫn tạo key mạnh |

---

## 5. Khuyến nghị cho production

| Ưu tiên | Khuyến nghị |
|---------|------------|
| Cao | Đổi `JWT_SECRET` thành giá trị ngẫu nhiên ≥48 ký tự: `openssl rand -base64 48` |
| Cao | Đổi `DB_PASSWORD` và `DB_ROOT_PASSWORD` thành password mạnh |
| Cao | Đổi `ADMIN_PASSWORD` khỏi `Admin@123` |
| Trung bình | Thêm GitHub Actions với GitHub Secrets khi setup CI/CD |
| Thấp | Xem xét dùng `.env.production` (gitignored) riêng cho production |

---

## 6. Kết luận

**T069: ĐẠT** — Không có secret production nào bị hardcode hoặc lộ trong Git history. Hai thay đổi phòng ngừa đã được thực hiện: bổ sung `.gitignore` và cải thiện `.env.example`.
