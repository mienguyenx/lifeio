# 🔧 Cấu hình Google Cloud Console để Fix Lỗi idpiframe_initialization_failed

## ⚠️ Lỗi hiện tại

Lỗi `idpiframe_initialization_failed` và `origins don't match` xảy ra vì domain `https://life.hoanong.com` chưa được thêm vào **Authorized JavaScript origins** trong Google Cloud Console.

## ✅ Cách sửa

### Bước 1: Truy cập Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Chọn project của bạn

### Bước 2: Vào OAuth 2.0 Client Settings

1. Vào **APIs & Services → Credentials**
2. Tìm OAuth 2.0 Client ID của bạn: `977885052084-qveo8i7crckfrrg2br5kv4c3cet9o71e.apps.googleusercontent.com`
3. Click vào để edit

### Bước 3: Thêm Authorized JavaScript origins

Trong phần **Authorized JavaScript origins**, thêm:

```
https://life.hoanong.com
```

**Lưu ý:**
- Phải có `https://` ở đầu
- Không có dấu `/` ở cuối
- Nếu đang test local, có thể thêm `http://localhost:3000` (nhưng production phải dùng HTTPS)

### Bước 4: Thêm Authorized redirect URIs (nếu chưa có)

Trong phần **Authorized redirect URIs**, đảm bảo có:

```
https://life.hoanong.com
```

### Bước 5: Save và đợi vài phút

1. Click **Save**
2. Đợi 2-3 phút để Google cập nhật cấu hình
3. Clear browser cache hoặc dùng Incognito mode để test

## 🔍 Kiểm tra sau khi cấu hình

1. Refresh trang Admin Panel: `https://life.hoanong.com/admin/backup`
2. Click "Kết nối Google Drive"
3. Nếu vẫn lỗi, kiểm tra:
   - Console không còn lỗi `idpiframe_initialization_failed`
   - Không còn lỗi `origins don't match`
   - Popup Google OAuth hiện lên để chọn tài khoản

## 📝 Checklist

- [ ] Đã thêm `https://life.hoanong.com` vào **Authorized JavaScript origins**
- [ ] Đã thêm `https://life.hoanong.com` vào **Authorized redirect URIs**
- [ ] Đã click **Save**
- [ ] Đã đợi 2-3 phút sau khi save
- [ ] Đã clear browser cache hoặc dùng Incognito mode
- [ ] Đã test lại kết nối Google Drive

## 🚨 Nếu vẫn lỗi

1. **Kiểm tra Client ID:**
   - Đảm bảo Client ID đúng: `977885052084-qveo8i7crckfrrg2br5kv4c3cet9o71e.apps.googleusercontent.com`
   - Kiểm tra trong Admin Panel → Backup → Settings

2. **Kiểm tra Domain:**
   - Đảm bảo domain trong Google Cloud Console khớp chính xác với domain thực tế
   - Không có trailing slash
   - Phải là HTTPS (không phải HTTP)

3. **Kiểm tra Google Drive API:**
   - Đảm bảo Google Drive API đã được bật
   - Vào **APIs & Services → Library** → Tìm "Google Drive API" → Bật nếu chưa bật

4. **Clear cache và test lại:**
   - Hard refresh: Ctrl+Shift+R (Windows) hoặc Cmd+Shift+R (Mac)
   - Hoặc dùng Incognito mode

