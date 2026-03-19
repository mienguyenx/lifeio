# 🌐 LifeOS Browser Extension

Extension trình duyệt để hiển thị LifeOS trong tab mới mặc định với tính năng thu nhỏ thành mobile view.

## ✨ Tính năng

- ✅ Hiển thị LifeOS khi mở tab mới
- ✅ **Thu nhỏ thành mobile view** (375x667px) sát bên phải màn hình
- ✅ **Kéo thả** mobile view để di chuyển
- ✅ **Phóng to/Thu nhỏ** dễ dàng với nút điều khiển
- ✅ Loading screen đẹp mắt
- ✅ Error handling
- ✅ Tự động lưu trạng thái (minimized/fullscreen)
- ✅ Keyboard shortcuts (phím `M` để toggle minimize)

## 📦 Cài đặt

### Chrome / Edge (Chromium)

1. **Mở Chrome/Edge:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. **Bật Developer mode:**
   - Toggle "Developer mode" ở góc trên bên phải

3. **Load extension:**
   - Click "Load unpacked"
   - Chọn thư mục `extension/`

4. **Kiểm tra:**
   - Mở tab mới (Ctrl+T hoặc Cmd+T)
   - LifeOS sẽ hiển thị! 🎉

### Firefox

Firefox cần Manifest V2. Có thể cần chỉnh sửa `manifest.json` (đổi `manifest_version` từ 3 sang 2).

## 🎮 Cách sử dụng

### Thu nhỏ thành Mobile View

1. **Click nút Minimize** (góc trên bên phải)
   - LifeOS sẽ thu nhỏ thành 375x667px (kích thước mobile)
   - Hiển thị sát bên phải màn hình
   - Có thể kéo thả để di chuyển

2. **Kéo thả Mobile View:**
   - Click và giữ vào mobile view
   - Kéo để di chuyển
   - Thả để đặt vị trí mới

3. **Phóng to lại:**
   - Click nút Maximize
   - Hoặc nhấn phím `M`

### Keyboard Shortcuts

- **`M`**: Toggle minimize/maximize
- **`Esc`**: Đóng error message (nếu có)

## 🎨 Tùy chỉnh

### Thay đổi kích thước Mobile View

Sửa trong `newtab.js`:

```javascript
const MOBILE_WIDTH = 375;  // Đổi width
const MOBILE_HEIGHT = 667; // Đổi height
```

### Thay đổi URL

Sửa trong `newtab.html` và `newtab.js`:

```html
<iframe src="https://your-custom-url.com" ...></iframe>
```

```javascript
const LIFEOOS_URL = 'https://your-custom-url.com';
```

### Thay đổi Icons

Thay thế các file trong thư mục `icons/`:
- `icon-16.png` (16x16)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

**Cách tạo icons từ favicon.svg:**

Có thể dùng online tool hoặc ImageMagick:
```bash
# Cần cài ImageMagick trước
convert public/favicon.svg -resize 16x16 extension/icons/icon-16.png
convert public/favicon.svg -resize 48x48 extension/icons/icon-48.png
convert public/favicon.svg -resize 128x128 extension/icons/icon-128.png
```

Hoặc dùng online converter: https://convertio.co/svg-png/

## 🔧 Troubleshooting

### Extension không hoạt động

1. **Kiểm tra permissions:**
   - Vào `chrome://extensions/`
   - Tìm LifeOS extension
   - Kiểm tra "Site access" permissions

2. **Kiểm tra console:**
   - Right-click extension icon > "Inspect popup"
   - Xem Console tab

3. **Kiểm tra CORS:**
   - LifeOS phải allow iframe embedding
   - Kiểm tra `nginx.conf` đã comment `X-Frame-Options` chưa

### Iframe không tải được

Nếu LifeOS block iframe embedding:

1. **Kiểm tra nginx.conf:**
   ```nginx
   # Phải comment hoặc xóa dòng này:
   # add_header X-Frame-Options "SAMEORIGIN" always;
   ```

2. **Rebuild container:**
   ```bash
   docker-compose build --no-cache lifeos-app
   docker-compose up -d --force-recreate lifeos-app
   ```

### Mobile view không kéo được

- Kiểm tra console errors
- Đảm bảo JavaScript đã load đầy đủ
- Thử reload extension

### Loading không ẩn

- Kiểm tra console (F12)
- Tăng `LOADING_TIMEOUT` trong `newtab.js`
- Kiểm tra network tab xem LifeOS có load không

## 📝 Files

- `manifest.json` - Extension manifest (Manifest V3)
- `newtab.html` - New tab page HTML
- `newtab.css` - Styles cho extension
- `newtab.js` - JavaScript logic với minimize/drag
- `icons/` - Extension icons (cần tạo)
- `README.md` - Documentation này

## 🚀 Publish (Tùy chọn)

Nếu muốn publish lên Chrome Web Store:

1. **Tạo icons:**
   - 16x16, 48x48, 128x128 PNG
   - 512x512 PNG (cho store)

2. **Tạo screenshots:**
   - 1280x800 hoặc 640x400
   - Chụp cả fullscreen và mobile view

3. **Zip extension:**
   ```bash
   cd extension
   zip -r ../lifeos-extension.zip . -x "*.md" "*.git*"
   ```

4. **Upload lên Chrome Web Store:**
   - https://chrome.google.com/webstore/devconsole

## ✅ Kết quả

Sau khi cài đặt:
- ✅ Mở tab mới → LifeOS hiển thị tự động
- ✅ Click Minimize → Thu nhỏ thành mobile view sát bên phải
- ✅ Kéo thả mobile view để di chuyển
- ✅ Click Maximize → Phóng to toàn màn hình
- ✅ Trạng thái được lưu tự động

## 🎯 Tính năng nổi bật

### Mobile View
- Kích thước: 375x667px (iPhone standard)
- Border radius: 20px
- Shadow đẹp mắt
- Có thể kéo thả tự do
- Responsive trên màn hình nhỏ

### Drag & Drop
- Click và giữ để kéo
- Hỗ trợ cả mouse và touch
- Tự động giới hạn trong viewport
- Smooth animation

### State Management
- Tự động lưu trạng thái minimized/fullscreen
- Khôi phục khi mở lại tab mới
- Lưu trong Chrome storage

