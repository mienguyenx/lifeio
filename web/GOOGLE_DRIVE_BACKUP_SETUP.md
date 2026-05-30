# 📦 Hướng dẫn Setup Google Drive Backup - Admin Panel

## ✅ Đã hoàn thành

Chức năng **Sao lưu Google Drive** đã được di chuyển từ Settings Page sang **Admin Panel** với các tính năng:

- ✅ **Quản lý tiến trình backup** - Real-time progress tracking
- ✅ **Lịch sử backup** - Xem tất cả backup đã tạo
- ✅ **Cài đặt backup** - Cấu hình frequency, retention, etc.
- ✅ **Hướng dẫn setup** - Step-by-step guide trong admin panel
- ✅ **Quản lý cho tất cả users** - Admin có thể backup cho bất kỳ user nào

## 🗄️ Database Migration

### Bước 1: Chạy Migration

Chạy file migration để tạo các bảng cần thiết:

```sql
-- File: supabase/migrations/20251227000000_add_backup_tables.sql
```

Hoặc chạy trực tiếp trong Supabase SQL Editor:

```bash
# Nếu dùng Supabase CLI
supabase migration up

# Hoặc copy nội dung file và chạy trong Supabase Dashboard
```

### Bảng được tạo:

1. **`backup_history`** - Lưu lịch sử các backup đã tạo
2. **`backup_progress`** - Lưu tiến trình real-time của mỗi backup
3. **`backup_settings`** - Lưu cài đặt backup (admin configuration)

## 🔧 Cấu hình Google Drive API

### Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn project hiện có

### Bước 2: Bật Google Drive API

1. Vào **APIs & Services → Library**
2. Tìm và bật **Google Drive API**

### Bước 3: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Cấu hình:
   - **Application type**: Web application
   - **Name**: LifeOS Backup (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**: 
     ```
     https://life.hoanong.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://life.hoanong.com
     ```

### Bước 4: Tạo API Key (Optional nhưng khuyến nghị)

1. Trong **Credentials**, click **Create Credentials → API Key**
2. Restrict API Key (khuyến nghị):
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: `https://life.hoanong.com/*`
   - **API restrictions**: Chỉ chọn **Google Drive API**

### Bước 5: Lấy Client ID và API Key

- Copy **Client ID** từ OAuth 2.0 Client
- Copy **API Key** (nếu đã tạo)

## ⚙️ Cấu hình trong Admin Panel

### Bước 1: Truy cập Admin Panel

1. Đăng nhập với tài khoản admin
2. Vào **Admin Panel → System → Google Drive Backup**

### Bước 2: Cấu hình Settings

1. Click tab **Cài đặt**
2. Nhập **Google Client ID** và **API Key**
3. Cấu hình:
   - **Tần suất backup tự động**: daily/weekly/manual
   - **Bật backup tự động**: Enable/Disable
   - **Số ngày giữ backup**: Retention period
4. Click **Lưu cài đặt**

### Bước 3: Kết nối Google Drive

1. Click **Kết nối Google Drive**
2. Chọn tài khoản Google và cấp quyền
3. Xác nhận kết nối thành công

## 🔐 Environment Variables

Thêm vào file `.env` hoặc Docker build args:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

### Docker Compose

Nếu dùng Docker, thêm vào `docker-compose.yml`:

```yaml
services:
  lifeos-app:
    build:
      args:
        VITE_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
        VITE_GOOGLE_API_KEY: ${GOOGLE_API_KEY}
```

Hoặc trong `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_API_KEY=your_api_key_here
```

## 🚀 Rebuild và Deploy

Sau khi cấu hình xong:

```bash
# Rebuild Docker container
docker-compose build --no-cache lifeos-app

# Restart container
docker-compose up -d --force-recreate lifeos-app
```

## 📋 Sử dụng

### Tạo Backup

1. Vào **Admin Panel → Google Drive Backup**
2. Click tab **Tạo Backup**
3. Click **Tạo Backup Ngay**
4. Xem tiến trình real-time trong progress bar

### Xem Lịch sử

1. Click tab **Lịch sử**
2. Xem tất cả backup đã tạo
3. Có thể:
   - **Download/Restore** backup
   - **Xóa** backup cũ
   - **Xem tiến trình** của backup đang chạy

### Quản lý Settings

1. Click tab **Cài đặt**
2. Cấu hình:
   - Google Client ID/API Key
   - Backup frequency
   - Auto backup
   - Retention days
3. Click **Lưu cài đặt**

## 🔍 Troubleshooting

### Lỗi: "Google Client ID not configured"

- Kiểm tra environment variables đã được set chưa
- Rebuild container sau khi thêm env vars
- Kiểm tra trong Admin Panel → Settings đã nhập Client ID chưa

### Lỗi: "Not authenticated with Google Drive"

- Click **Kết nối Google Drive** trong Admin Panel
- Kiểm tra OAuth redirect URIs đã đúng chưa
- Clear browser cache và thử lại

### Lỗi: "Failed to upload file"

- Kiểm tra Google Drive API đã được bật chưa
- Kiểm tra API Key restrictions
- Kiểm tra OAuth scopes có `drive.file` permission

### Backup không hiển thị trong History

- Kiểm tra database migration đã chạy chưa
- Kiểm tra RLS policies
- Kiểm tra user có quyền admin không

## 📝 Notes

- Backup được lưu trong Google Drive với format: `LifeOS-Backup-{userId}-{date}.json`
- Admin có thể backup cho bất kỳ user nào
- Progress tracking được lưu real-time trong database
- Backup history được giữ theo retention days setting

## 🎯 Next Steps

Sau khi setup xong:

1. ✅ Test tạo backup thủ công
2. ✅ Test restore từ backup
3. ✅ Cấu hình auto backup (nếu cần)
4. ✅ Monitor backup history
5. ✅ Setup retention policy

