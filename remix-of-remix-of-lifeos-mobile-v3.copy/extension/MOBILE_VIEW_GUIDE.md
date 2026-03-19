# 📱 Mobile View Widget Guide

## ✨ Tính năng mới

Widget giờ đây có 2 chế độ hiển thị:

### 1. 📱 Mobile View (Mặc định)

**Kích thước:**
- Width: 375px (iPhone standard)
- Height: 667px (iPhone standard)
- Giống như màn hình điện thoại thật

**Nội dung hiển thị:**
- 📊 Tổng quan (Stats)
- ✅ Thói quen hôm nay
- 📝 Công việc hôm nay
- 🎯 Mục tiêu đang thực hiện

**Đặc điểm:**
- Full screen như ứng dụng mobile
- Scroll được để xem tất cả nội dung
- Có thể tùy chỉnh sections hiển thị

---

### 2. 📦 Compact View (Khi thu nhỏ)

**Kích thước:**
- Width: 280px
- Height: 400px
- Nhỏ gọn, tiết kiệm không gian

**Nội dung hiển thị:**
- 🍅 **Pomodoro Timer**
  - Hiển thị thời gian còn lại
  - Phase (Làm việc/Nghỉ ngắn/Nghỉ dài)
  - Play/Pause button
  - Reset button
- 📝 **Tasks List**
  - Danh sách 5 tasks hôm nay
  - Click để complete
  - Hiển thị số lượng tasks

**Đặc điểm:**
- Chỉ hiển thị essentials
- Pomodoro timer hoạt động độc lập
- Tasks có thể complete ngay

---

## 🎮 Cách sử dụng

### Chuyển đổi giữa Mobile View và Compact View

1. **Mở Mobile View:**
   - Click nút **Expand** (icon mũi tên lên) ở header
   - Hoặc nhấn phím **`C`**

2. **Thu nhỏ thành Compact View:**
   - Click nút **Collapse** (icon X) ở header
   - Hoặc nhấn phím **`C`**

### Sử dụng Pomodoro Timer

1. **Bắt đầu timer:**
   - Click nút **Play** (▶️)
   - Timer sẽ đếm ngược từ 25:00

2. **Tạm dừng:**
   - Click nút **Pause** (⏸️)
   - Timer dừng lại

3. **Reset:**
   - Click nút **Reset** (↻)
   - Timer về lại 25:00

4. **Tự động chuyển phase:**
   - Sau 25 phút làm việc → Chuyển sang nghỉ ngắn (5 phút)
   - Sau nghỉ ngắn → Chuyển sang làm việc (25 phút)
   - Cứ 4 sessions → Nghỉ dài (15 phút)

### Sử dụng Tasks trong Compact View

1. **Xem tasks:**
   - Danh sách tự động hiển thị
   - Tối đa 5 tasks hôm nay

2. **Complete task:**
   - Click vào task item
   - Hoặc click checkbox
   - Task sẽ được complete ngay

---

## ⚙️ Cài đặt

### Widget Size (chỉ áp dụng cho Mobile View)

- **Small**: 280px (không khuyến nghị cho mobile view)
- **Medium**: 375px (mặc định - iPhone standard) ⭐
- **Large**: 414px (iPhone Plus/Pro Max)

### Tùy chỉnh Sections (Mobile View)

- Bật/tắt từng section trong Settings
- Chỉ áp dụng cho Mobile View
- Compact View luôn hiển thị Pomodoro + Tasks

---

## 🎨 Giao diện

### Mobile View
- Giống ứng dụng mobile thật
- Border radius: 20px
- Shadow đẹp mắt
- Scroll mượt mà

### Compact View
- Nhỏ gọn, tối giản
- Pomodoro timer nổi bật
- Tasks list dễ đọc
- Dễ tương tác

---

## 🔧 Troubleshooting

### Widget không chuyển sang Mobile View

1. **Kiểm tra class:**
   - F12 → Elements
   - Tìm `#lifeos-widget`
   - Đảm bảo không có class `collapsed`

2. **Kiểm tra iframe:**
   - F12 → Elements
   - Tìm `#lifeos-widget-iframe`
   - Width phải là 375px, height 667px

### Pomodoro không hoạt động

1. **Kiểm tra console:**
   - F12 → Console
   - Xem có errors không

2. **Kiểm tra storage:**
   - Pomodoro state được lưu trong Chrome storage
   - Có thể bị clear nếu extension bị disable

### Compact View không hiển thị

1. **Kiểm tra collapse:**
   - Đảm bảo widget đã collapse
   - Class `collapsed` phải có

2. **Kiểm tra display:**
   - F12 → Elements
   - Tìm `#widgetCompactView`
   - Style phải là `display: flex`

---

## 📝 Lưu ý

- Mobile View là default (375x667px)
- Compact View chỉ hiển thị khi collapse
- Pomodoro timer hoạt động độc lập
- Tasks trong compact view có thể complete ngay
- State được lưu tự động

---

## ✅ Kết quả

Sau khi cập nhật:
- ✅ Widget mặc định: Mobile view (375x667px)
- ✅ Thu nhỏ: Compact view (280x400px) với Pomodoro + Tasks
- ✅ Pomodoro timer hoạt động đầy đủ
- ✅ Tasks có thể complete trong compact view
- ✅ Auto-resize iframe theo view

