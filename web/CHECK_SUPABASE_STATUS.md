# 🔍 Kiểm tra trạng thái Supabase

## ⚠️ Vấn đề

Ứng dụng có thể vẫn đang dùng `localhost:54321` thay vì `https://supabase.hoanong.com` vì:
- Container chưa được rebuild sau khi cập nhật `docker-compose.yml`
- Built code vẫn chứa URL cũ

## ✅ Các bước kiểm tra

### 1. Kiểm tra cấu hình hiện tại

```powershell
# Xem docker-compose.yml
cat docker-compose.yml | Select-String "VITE_SUPABASE_URL"
```

**Kết quả mong đợi:**
```yaml
VITE_SUPABASE_URL: https://supabase.hoanong.com
```

### 2. Kiểm tra Cloudflare Tunnel

```powershell
docker-compose logs cloudflared | Select-String "supabase.hoanong.com"
```

**Kết quả mong đợi:**
```
"hostname":"supabase.hoanong.com","service":"http://supabase_kong_Supabase:8000"
```

### 3. Test Supabase URL

```powershell
# Test từ máy local
Invoke-WebRequest -Uri "https://supabase.hoanong.com/rest/v1/" -Method Head -UseBasicParsing
```

**Kết quả mong đợi:**
- Status: 200 hoặc 401 (401 là OK vì chưa có auth)

### 4. Kiểm tra trong Browser

1. Mở https://life.hoanong.com
2. Mở Developer Tools (F12)
3. Vào tab **Console**
4. Tìm log: `Using local Supabase:` hoặc `Using external Supabase:`
5. Vào tab **Network**
6. Tìm request đến Supabase
7. Xem URL trong request headers

**Nếu thấy:**
- `http://localhost:54321` → ❌ Vẫn dùng local
- `https://supabase.hoanong.com` → ✅ Đã chuyển sang public

## 🔧 Cách sửa

### Bước 1: Rebuild container

```powershell
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### Bước 2: Kiểm tra lại

```powershell
# Xem logs
docker-compose logs lifeos-app | Select-String "SUPABASE"

# Test trong browser
# Mở https://life.hoanong.com và kiểm tra Console
```

### Bước 3: Clear browser cache (nếu cần)

1. Mở Developer Tools (F12)
2. Right-click vào nút Refresh
3. Chọn **Empty Cache and Hard Reload**

## 📋 Checklist

- [ ] `docker-compose.yml` có `VITE_SUPABASE_URL: https://supabase.hoanong.com`
- [ ] Cloudflare Tunnel có route `supabase.hoanong.com`
- [ ] Container đã được rebuild sau khi cập nhật config
- [ ] `https://supabase.hoanong.com` có thể truy cập được
- [ ] Browser Console không có lỗi CORS
- [ ] Network tab hiển thị request đến `https://supabase.hoanong.com`

## 🎯 Kết quả mong đợi

Sau khi rebuild:
- ✅ Browser Console: `Using external Supabase: https://supabase.hoanong.com`
- ✅ Network tab: Request đến `https://supabase.hoanong.com`
- ✅ Không có lỗi CORS
- ✅ Đăng nhập hoạt động từ bên ngoài

