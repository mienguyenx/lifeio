# 📥 Hướng dẫn cài đặt Extension

## Chrome / Edge (Chromium)

### Bước 1: Chuẩn bị

1. Mở Chrome hoặc Edge
2. Vào `chrome://extensions/` (hoặc `edge://extensions/`)
3. Bật **Developer mode** (toggle ở góc trên bên phải)

### Bước 2: Load Extension

1. Click **"Load unpacked"** (Tải tiện ích đã giải nén)
2. Chọn thư mục `extension/` trong project
3. Extension sẽ xuất hiện trong danh sách

### Bước 3: Tạo Icons (Quan trọng!)

Extension cần 3 file icons. Có 2 cách:

**Cách 1: Tạo từ favicon.svg (Khuyến nghị)**

1. Mở https://convertio.co/svg-png/ hoặc tool tương tự
2. Upload `public/favicon.svg`
3. Convert thành PNG với các kích thước:
   - 16x16 → Lưu vào `extension/icons/icon-16.png`
   - 48x48 → Lưu vào `extension/icons/icon-48.png`
   - 128x128 → Lưu vào `extension/icons/icon-128.png`

**Cách 2: Dùng ImageMagick (nếu đã cài)**

```bash
cd remix-of-remix-of-lifeos-mobile-v3.copy
convert public/favicon.svg -resize 16x16 extension/icons/icon-16.png
convert public/favicon.svg -resize 48x48 extension/icons/icon-48.png
convert public/favicon.svg -resize 128x128 extension/icons/icon-128.png
```

**Cách 3: Tạo icons đơn giản**

Nếu không có favicon, có thể tạo icons đơn giản:
- Màu nền: #667eea (tím)
- Chữ "L" màu trắng
- Kích thước: 16x16, 48x48, 128x128

### Bước 4: Kiểm tra

1. Mở tab mới (Ctrl+T hoặc Cmd+T)
2. LifeOS sẽ hiển thị! 🎉

### Bước 5: Test tính năng Minimize

1. Di chuột lên góc trên bên phải → Thấy nút Minimize
2. Click nút Minimize → LifeOS thu nhỏ thành mobile view
3. Kéo thả mobile view để di chuyển
4. Click nút Maximize → Phóng to lại

---

## Firefox

### Bước 1: Chuẩn bị

1. Mở Firefox
2. Vào `about:debugging#/runtime/this-firefox`

### Bước 2: Load Extension

1. Click **"Load Temporary Add-on"**
2. Chọn file `manifest.json` trong thư mục `extension/`

**Lưu ý:** Firefox dùng Manifest V2, có thể cần chỉnh sửa `manifest.json`:
- Đổi `manifest_version` từ `3` sang `2`
- Đổi `chrome_url_overrides` thành `chrome_url_overrides` (giữ nguyên)
- Có thể cần điều chỉnh permissions

### Bước 3: Kiểm tra

1. Mở tab mới
2. LifeOS sẽ hiển thị!

---

## Safari (macOS)

Safari cần extension được sign và publish qua App Store. Không hỗ trợ load unpacked.

---

## ⚠️ Lưu ý quan trọng

### 1. Sửa nginx.conf để cho phép iframe

Extension cần LifeOS cho phép iframe embedding. Đã tự động sửa trong `nginx.conf`:

```nginx
# Đã comment dòng này:
# add_header X-Frame-Options "SAMEORIGIN" always;
```

**Cần rebuild container sau khi sửa:**

```bash
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### 2. Icons là bắt buộc

Extension sẽ không load được nếu thiếu icons. Đảm bảo có đủ 3 file:
- `extension/icons/icon-16.png`
- `extension/icons/icon-48.png`
- `extension/icons/icon-128.png`

---

## Troubleshooting

### Extension không hiển thị trong tab mới

1. **Kiểm tra permissions:**
   - Vào `chrome://extensions/`
   - Tìm "LifeOS - New Tab"
   - Kiểm tra "Site access" → Phải là "On all sites" hoặc "On click"

2. **Kiểm tra errors:**
   - Click "Errors" button trong extension card
   - Xem console errors

3. **Reload extension:**
   - Click icon reload trong extension card
   - Hoặc disable/enable lại

### Iframe không tải được

Nếu thấy error về iframe hoặc CORS:

1. **Kiểm tra nginx.conf:**
   - Phải comment dòng `X-Frame-Options`
   - Rebuild container

2. **Kiểm tra LifeOS có load không:**
   - Mở https://life.hoanong.com trực tiếp
   - Nếu không load được → Vấn đề với LifeOS, không phải extension

### Loading không ẩn

- Kiểm tra console (F12)
- Tăng timeout trong `newtab.js`
- Kiểm tra network tab xem LifeOS có load không

### Mobile view không kéo được

- Kiểm tra console errors
- Đảm bảo JavaScript đã load
- Thử reload extension

---

## 🎯 Kết quả mong đợi

Sau khi cài đặt thành công:

- ✅ Mở tab mới → LifeOS hiển thị tự động
- ✅ Click Minimize → Thu nhỏ thành mobile view (375x667px)
- ✅ Mobile view hiển thị sát bên phải màn hình
- ✅ Có thể kéo thả mobile view để di chuyển
- ✅ Click Maximize → Phóng to toàn màn hình
- ✅ Trạng thái được lưu tự động
- ✅ Có thể đăng nhập và sử dụng bình thường

---

## 🎮 Hướng dẫn sử dụng

### Thu nhỏ thành Mobile View

1. Di chuột lên góc trên bên phải → Thấy nút điều khiển
2. Click nút **Minimize** (icon vuông nhỏ)
3. LifeOS thu nhỏ thành 375x667px, hiển thị sát bên phải
4. Có thể kéo thả để di chuyển mobile view

### Phóng to lại

1. Click nút **Maximize** (icon vuông lớn)
2. Hoặc nhấn phím **`M`**
3. LifeOS phóng to toàn màn hình

### Kéo thả Mobile View

1. Click và giữ vào mobile view
2. Kéo để di chuyển
3. Thả để đặt vị trí mới
4. Tự động giới hạn trong viewport

---

## 📝 Checklist cài đặt

- [ ] Đã tạo thư mục `extension/icons/`
- [ ] Đã tạo 3 file icons (16x16, 48x48, 128x128)
- [ ] Đã sửa `nginx.conf` (comment X-Frame-Options)
- [ ] Đã rebuild container LifeOS
- [ ] Đã load extension trong Chrome/Edge
- [ ] Đã test mở tab mới
- [ ] Đã test tính năng minimize
- [ ] Đã test kéo thả mobile view

