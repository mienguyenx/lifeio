# 🔧 Fix Network và Revert về trạng thái ban đầu

## Nguyên nhân

Ban đầu login hoạt động vì:
1. **Có thể đã dùng Lovable Cloud Supabase** (fallback) - không cần network config
2. **Hoặc dùng localhost** - chỉ hoạt động khi truy cập từ cùng máy

Bây giờ không hoạt động vì:
1. Đã chuyển sang `https://supabase.hoanong.com` qua Cloudflare Tunnel
2. Cloudflare Tunnel không thể resolve `supabase_kong_Supabase` hostname
3. CORS chưa được config

## Giải pháp: Dùng IP Address thay vì Hostname

### Bước 1: Lấy IP của Supabase Kong

```powershell
docker inspect supabase_kong_Supabase | Select-String "IPAddress" -Context 1
```

Hoặc:
```powershell
docker network inspect affine_traefik-network --format '{{range $key, $value := .Containers}}{{if eq $value.Name "supabase_kong_Supabase"}}{{$value.IPv4Address}}{{end}}{{end}}'
```

**Kết quả mong đợi:** IP như `172.23.0.5` hoặc `172.27.0.3`

### Bước 2: Update Cloudflare Tunnel Config

1. Vào Cloudflare Dashboard: https://dash.cloudflare.com
2. Zero Trust > Networks > Tunnels
3. Chọn tunnel của bạn
4. Configure > Public Hostname
5. Tìm hostname: `supabase.hoanong.com`
6. **Thay đổi Service:**
   - Từ: `http://supabase_kong_Supabase:8000`
   - Thành: `http://<IP_ADDRESS>:8000` (ví dụ: `http://172.23.0.5:8000`)
7. **Thêm HTTP Headers:**
   ```
   Access-Control-Allow-Origin: https://life.hoanong.com
   Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
   Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info
   Access-Control-Allow-Credentials: true
   ```
8. Save

### Bước 3: Đợi Cloudflare Tunnel update (30-60 giây)

### Bước 4: Test lại

1. Mở https://life.hoanong.com
2. Thử đăng nhập
3. Kiểm tra console - không còn "no such host" error

## Giải pháp thay thế: Revert về Lovable Cloud (nếu có)

Nếu bạn có Lovable Cloud Supabase và muốn revert về đó:

### Option 1: Không set VITE_SUPABASE_URL

Trong `docker-compose.yml`, comment out hoặc xóa:
```yaml
# args:
#   VITE_SUPABASE_URL: https://supabase.hoanong.com
#   VITE_SUPABASE_PUBLISHABLE_KEY: ...
```

Khi không có `VITE_SUPABASE_URL`, code sẽ fallback về Lovable Cloud Supabase.

### Option 2: Set về localhost (chỉ cho local access)

```yaml
args:
  VITE_SUPABASE_URL: http://localhost:54321
  VITE_SUPABASE_PUBLISHABLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Lưu ý:** Chỉ hoạt động khi truy cập từ cùng máy server.

## Kiểm tra sau khi fix

1. **Test network:**
   ```powershell
   docker-compose logs --tail=10 cloudflared | Select-String "supabase|error"
   ```
   Không còn "no such host" errors

2. **Test trong browser:**
   ```javascript
   // Trong console
   fetch('https://supabase.hoanong.com/auth/v1/token?grant_type=password', {
     method: 'OPTIONS',
     headers: { 'Origin': 'https://life.hoanong.com' }
   })
   .then(r => console.log('CORS:', r.headers.get('Access-Control-Allow-Origin')))
   ```

3. **Thử đăng nhập:**
   - Không còn CORS error
   - Không còn network error
   - Có thể đăng nhập (hoặc lỗi invalid credentials - đó là OK)



