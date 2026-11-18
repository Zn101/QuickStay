# T169 – CI Pipeline Report

**Ngày thực hiện:** 11/11/2026  
**Người thực hiện:** Lê Duy Minh  
**Nhánh:** `recovery/clean-dev` (commit `196e23b`)  
**Nhánh đích CI:** `recovery/clean-dev`

---

## 1. Mục tiêu

Xây dựng GitHub Actions CI pipeline cho QuickStay:
- Backend: Java 17 + Gradle test
- Frontend: Node 20 + Vitest + Vite build
- Hai job chạy song song, không `continue-on-error`

---

## 2. Files đã tạo

| File | Mục đích |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline workflow |
| `docs/test-reports/T169-ci-pipeline-report.md` | Báo cáo này |

### Files KHÔNG thay đổi

| File | Lý do |
|------|-------|
| `.github/workflows/cd-docker.yml` | CD workflow trên `main` — giữ nguyên |
| `backend/build.gradle` | Đã đúng, không cần sửa |
| `frontend/package.json` | Đã đúng, `vitest run` là CI mode |

---

## 3. Cấu hình CI

### Trigger

```yaml
on:
  push:
    branches: [recovery/clean-dev]
  pull_request:
    branches: [recovery/clean-dev]
```

### Job Backend

| Bước | Lệnh/Action | Ghi chú |
|------|-------------|---------|
| Checkout | `actions/checkout@v4` | |
| Java 17 | `actions/setup-java@v4` | Temurin distribution |
| Cache Gradle | `actions/cache@v4` | Key theo `*.gradle` hash |
| chmod gradlew | `chmod +x backend/gradlew` | Cần thiết trên Ubuntu runner |
| Test | `./gradlew test --no-daemon` | Chạy trong `backend/` dir |

### Job Frontend

| Bước | Lệnh/Action | Ghi chú |
|------|-------------|---------|
| Checkout | `actions/checkout@v4` | |
| Node 20 | `actions/setup-node@v4` | Cache npm theo `package-lock.json` |
| Install | `npm ci` | Chạy trong `frontend/` dir |
| Test | `npm test` | `vitest run` (CI mode, không watch) |
| Build | `npm run build` | `vite build` |

### Đặc điểm bảo mật

- `permissions: contents: read` — quyền tối thiểu
- Không `continue-on-error` — lỗi test sẽ fail workflow
- Không hardcode secret
- Không deploy VPS
- Không ghi đè `cd-docker.yml`

---

## 4. Kiểm tra cú pháp YAML

```bash
# Kiểm tra bằng Python (có sẵn trên Ubuntu runner)
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
# Expected: no output, exit 0
```

Kết quả kiểm tra local: ✅ Hợp lệ (không có lỗi syntax)

---

## 5. Kiểm tra local

### Backend test (local trên Windows)

```bash
cd backend && .\gradlew.bat test --no-daemon
```

Kết quả: ✅ 260/260 PASSED, BUILD SUCCESSFUL

### Frontend test (local trên Windows)

```bash
cd frontend && npm test
```

Kết quả: ⚠️ Cần kiểm tra — phụ thuộc môi trường Node local

### Frontend build (local)

```bash
cd frontend && npm run build
```

Kết quả: ⚠️ Cần kiểm tra — phụ thuộc môi trường Node local

---

## 6. Kết quả GitHub Actions

| Job | Status | Ghi chú |
|-----|--------|---------|
| Backend Test | ⚠️ Not Run | Cần push để trigger CI trên GitHub |
| Frontend Test & Build | ⚠️ Not Run | Cần push để trigger CI trên GitHub |

> **Lý do Not Run:** Workflow chỉ trigger khi push/PR vào `recovery/clean-dev` trên GitHub. Chưa commit/push trong scope T169.

---

## 7. Biến môi trường cần thiết

### Backend test (H2 in-memory)
- Không cần biến môi trường nào — `application.properties` có default cho test
- H2 in-memory tự động khởi tạo khi chạy test
- Flyway migration chạy trên H2

### Frontend test
- Không cần biến môi trường
- Vitest dùng `jsdom` environment

### GitHub Actions runner
- Không cần GitHub Secrets cho CI
- `GITHUB_TOKEN` không cần (chỉ `contents: read`)

---

## 8. Hướng dẫn chạy lại trên máy khác

### Yêu cầu môi trường

| Công cụ | Phiên bản |
|---------|---------|
| Java | 17 |
| Node.js | 20+ |
| npm | 10+ |
| Gradle | Wrapper có sẵn trong repo |

### Lệnh chạy Backend

```bash
cd backend
chmod +x gradlew          # Linux/Mac only
./gradlew test --no-daemon
```

### Lệnh chạy Frontend

```bash
cd frontend
npm ci                    # Cài dependency từ lock file
npm test                  # vitest run (CI mode)
npm run build             # vite build
```

### Kiểm tra CI trên GitHub

1. Push code lên nhánh `recovery/clean-dev`
2. Vào tab **Actions** trên GitHub repository
3. Workflow "CI" tự động chạy
4. Kiểm tra log từng job: Backend Test, Frontend Test & Build
5. Cả hai job phải có dấu tích xanh (✅)

---

## 9. Vấn đề còn tồn tại

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|----------|
| CI chưa chạy thực tế trên GitHub | Medium | Cần commit + push để trigger |
| `origin/dev` đóng băng, CI target là `recovery/clean-dev` | Info | Cần nhóm xác nhận nhánh tích hợp |
| Frontend test cần kiểm tra local | Low | Chạy `npm test` trong `frontend/` để xác nhận |

---

## 10. Kết luận

**T169: CI pipeline đã tạo xong — chờ push để chạy thực tế trên GitHub Actions**

- ✅ `ci.yml` tạo với 2 job song song (Backend + Frontend)
- ✅ YAML syntax hợp lệ
- ✅ Backend test local: 260/260 PASSED
- ✅ Không ảnh hưởng `cd-docker.yml`
- ⚠️ GitHub Actions: Not Run (chưa push)
