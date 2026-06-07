# ✅ Đã chuyển sang Supabase Local

## Cấu hình hiện tại

- **Supabase URL**: `http://localhost:54321`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Studio URL**: `http://localhost:54323`

## Đã thực hiện

1. ✅ Lấy thông tin Supabase Local
2. ✅ Cập nhật Dockerfile với build args
3. ✅ Cập nhật docker-compose.yml với Supabase Local URL và key
4. ✅ Rebuild container với cấu hình mới

## Kiểm tra

### 1. Kiểm tra Supabase Local đang chạy

```powershell
docker ps --filter "name=supabase"
```

Tất cả containers phải có status "Up" và "healthy".

### 2. Test Supabase Local API

**Trong Browser Console (F12):**

```javascript
// Test Supabase Local connection
fetch('http://localhost:54321/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
})
.then(r => console.log('✅ Supabase Local OK:', r.status))
.catch(e => console.error('❌ Supabase Local Error:', e));
```

**Kết quả mong đợi:**
- ✅ Status 200 hoặc 401 (401 là bình thường, chỉ cần kết nối được)

### 3. Kiểm tra ứng dụng

1. Truy cập: https://life.hoanong.com
2. Mở Console (F12)
3. Kiểm tra:
   - Có log `"Auth using: External Supabase"` không?
   - Có lỗi kết nối Supabase không?
   - Ứng dụng có load được không?

### 4. Kiểm tra trong code

**Trong Browser Console:**

```javascript
// Kiểm tra environment variables
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
```

**Kết quả mong đợi:**
- `VITE_SUPABASE_URL`: `http://localhost:54321`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Bắt đầu với `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Lưu ý quan trọng

### ⚠️ Từ Browser

- Browser chạy trên máy local, nên có thể truy cập `http://localhost:54321` trực tiếp
- Nếu không truy cập được, kiểm tra:
  - Supabase Local có đang chạy không?
  - Firewall có block port 54321 không?

### ⚠️ Từ Docker Container

- Container không thể truy cập `localhost:54321` của host
- Nếu app cần truy cập từ container, dùng `host.docker.internal:54321`
- Hiện tại app chạy trong browser (không phải trong container), nên dùng `localhost:54321` là đúng

## Quản lý Supabase Local

### Xem status

```powershell
.\scripts\supabase-local.ps1 status
```

### Mở Studio

```powershell
.\scripts\supabase-local.ps1 studio
```

Hoặc truy cập: http://localhost:54323

### Xem logs

```powershell
.\scripts\supabase-local.ps1 logs
```

### Reset database

```powershell
.\scripts\supabase-local.ps1 reset
```

⚠️ **Cảnh báo**: Sẽ xóa tất cả dữ liệu!

## Troubleshooting

### Lỗi: "Failed to fetch" khi test Supabase

**Nguyên nhân:**
- Supabase Local chưa chạy
- Port 54321 bị block

**Giải pháp:**
```powershell
# Kiểm tra Supabase có chạy không
docker ps --filter "name=supabase"

# Nếu chưa chạy, start Supabase
.\scripts\supabase-local.ps1 start
```

### Lỗi: "CORS" khi test từ browser

**Nguyên nhân:**
- Supabase Local không cho phép CORS từ domain khác

**Giải pháp:**
- Kiểm tra Supabase config
- Hoặc test từ `http://localhost` thay vì `https://life.hoanong.com`

### Ứng dụng vẫn dùng Supabase Cloud

**Nguyên nhân:**
- Build chưa có env vars mới
- Cache browser

**Giải pháp:**
1. Rebuild container: `docker-compose build --no-cache lifeos-app`
2. Restart: `docker-compose up -d --force-recreate lifeos-app`
3. Clear browser cache: `Ctrl + Shift + Delete`

