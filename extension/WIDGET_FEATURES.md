# 🎯 Tính năng Widget LifeOS

## ✨ Tổng quan

Widget LifeOS hiển thị trên **mọi trang web** bạn truy cập, cho phép bạn:
- Xem nhanh thông tin từ LifeOS
- Quản lý habits, tasks, goals ngay trên trang web đang xem
- Thu gọn/mở rộng widget
- Kéo thả để di chuyển widget
- Tùy chỉnh thông tin hiển thị

## 🎨 Tính năng chính

### 1. Hiển thị trên mọi trang web
- Widget tự động xuất hiện ở góc dưới bên phải (mặc định)
- Có thể thay đổi vị trí: góc trên/trên, góc dưới/trái, góc trên/phải, góc dưới/phải
- Không ảnh hưởng đến nội dung trang web

### 2. Thu gọn/Mở rộng
- Click nút **Thu gọn** (X) để thu gọn widget
- Khi thu gọn, chỉ hiển thị header với icon
- Click lại để mở rộng

### 3. Kéo thả
- Click và giữ vào header widget
- Kéo để di chuyển widget
- Tự động giới hạn trong viewport
- Hỗ trợ cả mouse và touch

### 4. Thông tin hiển thị

#### 📊 Tổng quan (Quick Stats)
- Số lượng Habits
- Số lượng Tasks
- Số lượng Goals
- Số lượng hoàn thành hôm nay

#### ✅ Thói quen hôm nay
- Danh sách 5 habits đang active
- Checkbox để đánh dấu hoàn thành
- Hiển thị trạng thái completed

#### 📝 Công việc hôm nay
- Danh sách 5 tasks cần làm
- Hiển thị priority (urgent nếu cần)
- Status của task

#### 🎯 Mục tiêu đang thực hiện
- Danh sách 3 goals đang active
- Hiển thị % progress

### 5. Tùy chỉnh

#### Cài đặt Widget
- **Hiển thị thông tin**: Bật/tắt từng section
  - Tổng quan
  - Thói quen hôm nay
  - Công việc hôm nay
  - Mục tiêu đang thực hiện

- **Vị trí widget**: Chọn góc màn hình
  - Góc dưới phải (mặc định)
  - Góc dưới trái
  - Góc trên phải
  - Góc trên trái

- **Tự động làm mới**: Cài đặt interval (phút)
  - Mặc định: 5 phút
  - Tối thiểu: 1 phút
  - Tối đa: 60 phút

### 6. Làm mới dữ liệu
- Click nút **Refresh** để làm mới ngay lập tức
- Tự động làm mới theo interval đã cài đặt
- Loading indicator khi đang tải

### 7. Đăng nhập
- Nếu chưa đăng nhập, hiển thị nút "Đăng nhập"
- Click để mở LifeOS trong tab mới
- Sau khi đăng nhập, widget tự động load dữ liệu

### 8. Mở LifeOS
- Click nút **"Mở LifeOS"** ở footer
- Mở LifeOS trong tab mới
- Giữ nguyên trang web hiện tại

## 🎮 Cách sử dụng

### Lần đầu sử dụng

1. **Cài extension** (xem INSTALL.md)
2. **Mở bất kỳ trang web nào**
3. **Widget xuất hiện** ở góc dưới bên phải
4. **Đăng nhập** nếu chưa có (click "Đăng nhập")
5. **Cài đặt** widget theo ý thích (click nút Settings)

### Sử dụng hàng ngày

1. **Xem thông tin nhanh**: Widget tự động hiển thị
2. **Thu gọn**: Click nút X khi không cần
3. **Kéo thả**: Di chuyển widget đến vị trí thuận tiện
4. **Làm mới**: Click nút Refresh hoặc đợi auto-refresh
5. **Mở LifeOS**: Click "Mở LifeOS" để quản lý chi tiết

## ⚙️ Cài đặt nâng cao

### Tắt widget trên một số trang

Hiện tại widget hiển thị trên mọi trang. Để tắt tạm thời:
1. Click icon extension
2. Toggle "Hiển thị widget trên mọi trang" = OFF

### Thay đổi vị trí

1. Click nút **Settings** trong widget
2. Chọn **Vị trí widget**
3. Click **Lưu**

### Tùy chỉnh thông tin hiển thị

1. Click nút **Settings** trong widget
2. Bật/tắt các section muốn hiển thị
3. Click **Lưu**

## 🔧 Troubleshooting

### Widget không hiển thị

1. **Kiểm tra extension đã bật chưa:**
   - Vào `chrome://extensions/`
   - Tìm "LifeOS - New Tab & Widget"
   - Đảm bảo đã bật

2. **Kiểm tra popup settings:**
   - Click icon extension
   - Đảm bảo "Hiển thị widget trên mọi trang" = ON

3. **Reload extension:**
   - Click icon reload trong extension card
   - Reload trang web

### Widget không load dữ liệu

1. **Kiểm tra đăng nhập:**
   - Mở LifeOS trong tab mới
   - Đăng nhập nếu chưa
   - Quay lại trang web, widget sẽ tự động load

2. **Kiểm tra kết nối:**
   - Đảm bảo có internet
   - Kiểm tra LifeOS có truy cập được không

3. **Click Refresh:**
   - Click nút Refresh trong widget
   - Hoặc đợi auto-refresh

### Widget che nội dung trang web

1. **Kéo thả widget:**
   - Click và giữ header
   - Kéo đến vị trí khác

2. **Thu gọn widget:**
   - Click nút X để thu gọn
   - Chỉ hiển thị header

3. **Thay đổi vị trí:**
   - Vào Settings
   - Chọn vị trí khác

## 💡 Ý tưởng sử dụng

### 1. Productivity Mode
- Hiển thị tất cả sections
- Auto-refresh mỗi 5 phút
- Đặt ở góc dưới phải

### 2. Minimal Mode
- Chỉ hiển thị Quick Stats
- Thu gọn khi không dùng
- Đặt ở góc trên phải

### 3. Focus Mode
- Chỉ hiển thị Today's Tasks
- Auto-refresh mỗi 10 phút
- Đặt ở góc dưới trái

### 4. Habit Tracker Mode
- Chỉ hiển thị Today's Habits
- Auto-refresh mỗi 1 phút
- Đặt ở góc trên trái

## 🚀 Tính năng tương lai (Có thể bổ sung)

- [ ] Quick actions (complete habit, task ngay trong widget)
- [ ] Notifications khi có task/habit sắp đến hạn
- [ ] Dark mode
- [ ] Custom themes
- [ ] Widget size tùy chỉnh
- [ ] Pin widget (luôn hiển thị trên top)
- [ ] Multiple widgets (nhiều widget cùng lúc)
- [ ] Widget templates
- [ ] Export/Import settings

## 📝 Lưu ý

- Widget sử dụng Supabase API để lấy dữ liệu
- Cần đăng nhập LifeOS để xem dữ liệu
- Session được lưu trong localStorage
- Widget không lưu dữ liệu local, chỉ hiển thị
- Tất cả actions (complete, edit) phải làm trong LifeOS

