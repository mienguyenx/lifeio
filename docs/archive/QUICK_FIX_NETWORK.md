# ⚡ Quick Fix: Network Issue

## Vấn đề

Cloudflare Tunnel không thể kết nối đến Supabase:
```
dial tcp: lookup supabase_kong_Supabase on 127.0.0.11:53: no such host
```

## Giải pháp đã thực hiện

1. ✅ Đã thêm Supabase Kong vào `affine_traefik-network`
2. ✅ Đã restart Cloudflare Tunnel

## Kiểm tra

### Test 1: Ping từ Cloudflare Tunnel

```powershell
docker exec cloudflared-lifeos ping -c 2 supabase_kong_Supabase
```

**Kết quả mong đợi:** Ping thành công

### Test 2: Kiểm tra IP Address

```powershell
docker inspect supabase_kong_Supabase | Select-String "IPAddress"
```

Lấy IP address và test kết nối trực tiếp.

### Test 3: Test từ Browser

1. Mở https://life.hoanong.com
2. F12 > Console
3. Thử đăng nhập
4. Kiểm tra:
   - Không còn "no such host" error
   - Có thể có CORS error (cần fix tiếp)
   - Hoặc đăng nhập thành công

## Nếu vẫn không được

### Option 1: Dùng IP thay vì hostname trong Cloudflare Tunnel

1. Lấy IP của Supabase Kong:
   ```powershell
   docker inspect supabase_kong_Supabase | Select-String "IPAddress" -Context 1
   ```

2. Vào Cloudflare Dashboard:
   - Zero Trust > Networks > Tunnels
   - Configure > Public Hostname > `supabase.hoanong.com`
   - Thay `http://supabase_kong_Supabase:8000`
   - Bằng `http://<IP_ADDRESS>:8000`
   - Save

### Option 2: Thêm Cloudflare Tunnel vào Supabase network

```powershell
docker network connect supabase_network_Supabase cloudflared-lifeos
docker restart cloudflared-lifeos
```

## Sau khi fix network

Sau khi network issue được fix, vẫn cần fix CORS:

1. Vào Cloudflare Dashboard
2. Zero Trust > Networks > Tunnels
3. Configure > Public Hostname > `supabase.hoanong.com`
4. Thêm HTTP Headers:
   ```
   Access-Control-Allow-Origin: https://life.hoanong.com
   Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
   Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info
   Access-Control-Allow-Credentials: true
   ```

## Test cuối cùng

Sau khi fix cả network và CORS:

1. Mở https://life.hoanong.com
2. Thử đăng nhập
3. Kiểm tra console:
   - ✅ Không còn "no such host" error
   - ✅ Không còn CORS error
   - ✅ Có thể đăng nhập (hoặc lỗi invalid credentials - đó là OK)

