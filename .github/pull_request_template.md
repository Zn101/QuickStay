## 📋 Mô tả

<!-- Tóm tắt ngắn gọn những thay đổi trong PR này và lý do thực hiện. Liên kết issue nếu có. -->

Fixes # (issue)

---

## 🔧 Loại thay đổi

<!-- Đánh dấu X vào ô phù hợp -->

- [ ] 🐛 Bug fix (sửa lỗi, không phá vỡ tính năng hiện có)
- [ ] ✨ New feature (thêm tính năng mới, không phá vỡ tính năng hiện có)
- [ ] 💥 Breaking change (sửa lỗi hoặc tính năng làm thay đổi hoạt động hiện tại)
- [ ] 📝 Docs / chore (cập nhật tài liệu, refactor, cấu hình — không ảnh hưởng logic)
- [ ] 🧪 Test (thêm hoặc sửa test)

---

## ✅ Checklist trước khi tạo PR

### Code

- [ ] Code tự review trước khi push
- [ ] Không có `console.log`, `System.out.println`, hoặc debug output còn sót lại
- [ ] Không có thông tin nhạy cảm (API key, mật khẩu) được commit
- [ ] Tuân thủ code style của project (Java: Google Java Style / FE: ESLint config)

### Test

- [ ] Đã viết hoặc cập nhật unit test cho logic mới
- [ ] Tất cả test hiện có vẫn pass: `./gradlew test` (backend) và `npm test` (frontend)
- [ ] Đã kiểm tra thủ công trên trình duyệt (nếu có thay đổi UI)

### Database

- [ ] Không có thay đổi schema phá vỡ dữ liệu cũ
- [ ] Nếu thay đổi entity JPA: đã cập nhật `QuickStay-ERD.md`

### Tài liệu

- [ ] Đã cập nhật `README.md` hoặc tài liệu liên quan (nếu cần)
- [ ] Đã cập nhật `QuickStay-API.md` nếu thêm / sửa endpoint

---

## 🧪 Cách kiểm tra

<!-- Mô tả các bước reviewer cần thực hiện để kiểm tra PR này -->

1. Pull branch này: `git checkout <branch-name>`
2. Chạy backend: `cd backend && ./gradlew bootRun`
3. Chạy frontend: `cd frontend && npm install && npm run dev`
4. …

---

## 📸 Screenshots (nếu có thay đổi UI)

<!-- Kéo thả ảnh chụp màn hình vào đây -->

| Trước | Sau |
|---|---|
| _(ảnh cũ)_ | _(ảnh mới)_ |

---

## 📌 Ghi chú thêm cho reviewer

<!-- Bất kỳ thông tin bổ sung nào giúp reviewer hiểu ngữ cảnh hoặc điểm cần chú ý đặc biệt -->
