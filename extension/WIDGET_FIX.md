# 🔧 Sửa lỗi Widget Hiển thị

## ✅ Các vấn đề đã sửa

### 1. Iframe Background
- **Vấn đề**: Iframe có background không trong suốt
- **Sửa**: Thêm `background: transparent` và `allowtransparency="true"`

### 2. Z-index
- **Vấn đề**: Widget bị che bởi các element khác
- **Sửa**: Đặt z-index cao nhất (2147483647) và kiểm tra định kỳ

### 3. Position Handling
- **Vấn đề**: Position được xử lý ở cả widget.js và content.js
- **Sửa**: Chỉ xử lý position trong content.js (iframe level)

### 4. Drag Functionality
- **Vấn đề**: Drag không hoạt động trong iframe
- **Sửa**: Sử dụng postMessage để giao tiếp với parent window

### 5. CSS Overflow
- **Vấn đề**: Widget bị overflow
- **Sửa**: Đảm bảo overflow: hidden và sizing đúng

### 6. Body Ready Check
- **Vấn đề**: Widget inject trước khi body sẵn sàng
- **Sửa**: Thêm check và retry mechanism

## 🎯 Cách test

1. **Reload extension:**
   - Vào `chrome://extensions/`
   - Click reload icon

2. **Reload trang web:**
   - F5 hoặc Ctrl+R

3. **Kiểm tra:**
   - Widget hiển thị ở góc dưới bên phải
   - Có thể kéo thả
   - Không bị che bởi element khác
   - Background trong suốt

## 🔍 Troubleshooting

### Widget vẫn không hiển thị

1. **Kiểm tra console:**
   - F12 → Console
   - Xem có errors không

2. **Kiểm tra extension:**
   - Vào `chrome://extensions/`
   - Đảm bảo extension đã bật
   - Xem "Errors" button

3. **Kiểm tra permissions:**
   - Đảm bảo có permission `<all_urls>`

### Widget bị che

1. **Kiểm tra z-index:**
   - F12 → Elements
   - Tìm `#lifeos-widget-iframe`
   - Xem z-index có phải 2147483647 không

2. **Kiểm tra CSS:**
   - Đảm bảo không có `!important` override

### Drag không hoạt động

1. **Kiểm tra postMessage:**
   - F12 → Console
   - Xem có errors về postMessage không

2. **Kiểm tra iframe:**
   - Đảm bảo iframe có thể nhận messages

## 📝 Lưu ý

- Widget sử dụng iframe để isolate context
- Position được xử lý ở iframe level (content.js)
- Drag sử dụng postMessage để giao tiếp
- Z-index được đặt cao nhất và kiểm tra định kỳ

