# ⚡ Quick Start - LifeOS Extension

## Bước 1: Tạo Icons (Bắt buộc)

Extension cần 3 file icons. Chọn 1 trong các cách:

### Cách nhanh nhất: Online Converter

1. Vào https://convertio.co/svg-png/
2. Upload `public/favicon.svg`
3. Convert thành PNG
4. Download và resize thành:
   - 16x16 → `extension/icons/icon-16.png`
   - 48x48 → `extension/icons/icon-48.png`
   - 128x128 → `extension/icons/icon-128.png`

### Hoặc dùng script PowerShell

```powershell
cd extension
.\create-icons.ps1
```

(Cần cài ImageMagick trước)

---

## Bước 2: Sửa nginx.conf (Đã tự động sửa)

File `nginx.conf` đã được sửa để cho phép iframe embedding.

**Cần rebuild container:**

```bash
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

---

## Bước 3: Cài Extension

1. Mở Chrome/Edge: `chrome://extensions/`
2. Bật **Developer mode**
3. Click **"Load unpacked"**
4. Chọn thư mục `extension/`

---

## Bước 4: Test

1. Mở tab mới (Ctrl+T)
2. LifeOS hiển thị! 🎉
3. Click nút **Minimize** (góc trên bên phải)
4. LifeOS thu nhỏ thành mobile view
5. Kéo thả để di chuyển mobile view

---

## ✅ Checklist

- [ ] Đã tạo 3 file icons (16x16, 48x48, 128x128)
- [ ] Đã rebuild container LifeOS
- [ ] Đã load extension trong Chrome/Edge
- [ ] Đã test mở tab mới
- [ ] Đã test minimize/maximize
- [ ] Đã test kéo thả mobile view

---

## 🎮 Tính năng

- ✅ Hiển thị LifeOS trong tab mới
- ✅ Thu nhỏ thành mobile view (375x667px)
- ✅ Kéo thả mobile view
- ✅ Phím tắt: `M` để toggle minimize
- ✅ Tự động lưu trạng thái

---

## 📖 Chi tiết

Xem `README.md` và `INSTALL.md` để biết thêm chi tiết.

