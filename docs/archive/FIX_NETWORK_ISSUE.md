# 🔧 Fix Network Issue: Cloudflare Tunnel không kết nối được Supabase

## Vấn đề

Cloudflare Tunnel logs cho thấy:
```
Unable to reach the origin service: dial tcp: lookup supabase_kong_Supabase on 127.0.0.11:53: no such host
```

## Nguyên nhân

- `cloudflared-lifeos` đang ở network: `affine_traefik-network`
- `supabase_kong_Supabase` đang ở network: `supabase_network_Supabase`
- Chúng không cùng network → Cloudflare Tunnel không thể resolve hostname

## Giải pháp

### Đã thực hiện

Đã thêm Supabase Kong vào `affine_traefik-network`:
```powershell
docker network connect affine_traefik-network supabase_kong_Supabase
```

### Kiểm tra

1. **Kiểm tra network connection:**
   ```powershell
   docker inspect supabase_kong_Supabase | Select-String "affine_traefik-network"
   ```
   Kết quả mong đợi: Thấy `affine_traefik-network` trong Networks

2. **Test từ Cloudflare Tunnel:**
   ```powershell
   docker exec cloudflared-lifeos ping -c 2 supabase_kong_Supabase
   ```
   Kết quả mong đợi: Ping thành công

3. **Test từ browser:**
   - Mở https://life.hoanong.com
   - Thử đăng nhập
   - Kiểm tra console - không còn "no such host" error

## Nếu vẫn không được

### Option 1: Dùng IP address thay vì hostname

1. Lấy IP của Supabase Kong:
   ```powershell
   docker inspect supabase_kong_Supabase | Select-String "IPAddress" -Context 1
   ```

2. Update Cloudflare Tunnel config:
   - Thay `http://supabase_kong_Supabase:8000` 
   - Bằng `http://<IP_ADDRESS>:8000`

### Option 2: Thêm tất cả Supabase containers vào traefik network

```powershell
# Thêm các containers quan trọng
docker network connect affine_traefik-network supabase_kong_Supabase
docker network connect affine_traefik-network supabase_auth_Supabase
docker network connect affine_traefik-network supabase_rest_Supabase
docker network connect affine_traefik-network supabase_db_Supabase
```

### Option 3: Tạo network bridge giữa 2 networks

Không khuyến nghị vì phức tạp và có thể gây vấn đề bảo mật.

## Kiểm tra sau khi fix

1. **Test CORS trong browser console:**
   ```javascript
   fetch('https://supabase.hoanong.com/auth/v1/token?grant_type=password', {
     method: 'OPTIONS',
     headers: { 'Origin': 'https://life.hoanong.com' }
   })
   .then(r => console.log('CORS:', r.headers.get('Access-Control-Allow-Origin')))
   ```

2. **Test đăng nhập:**
   - Mở https://life.hoanong.com
   - Thử đăng nhập
   - Xem console logs

3. **Kiểm tra Cloudflare Tunnel logs:**
   ```powershell
   docker-compose logs --tail=20 cloudflared | Select-String "supabase"
   ```
   Không còn "no such host" errors

## Lưu ý

- Network connection sẽ mất khi container restart
- Cần thêm vào docker-compose hoặc script startup để tự động connect
- Hoặc config Supabase containers để join `affine_traefik-network` từ đầu

