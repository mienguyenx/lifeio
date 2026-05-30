# ⚡ Quick Fix: Expose Supabase Local ra ngoài

## Vấn đề

Ứng dụng đang dùng `http://localhost:54321` → User từ bên ngoài không thể đăng nhập.

## Giải pháp nhanh

### Bước 1: Thêm Supabase vào Cloudflare Tunnel

**Trong Cloudflare Dashboard:**

1. Vào **Zero Trust** > **Networks** > **Tunnels**
2. Chọn tunnel của bạn (tunnel đang dùng cho `life.hoanong.com`)
3. Click **Configure**
4. Vào tab **Public Hostname**
5. Click **Add a public hostname**
6. Điền:
   - **Subdomain**: `supabase`
   - **Domain**: `hoanong.com`
   - **Service**: `http://supabase_kong_Supabase:8000`
   - **Path**: (để trống)
7. Click **Save hostname**

### Bước 2: Đảm bảo Supabase trong network

```powershell
# Kiểm tra
docker network inspect affine_traefik-network | Select-String "supabase_kong"

# Nếu không có, thêm vào
docker network connect affine_traefik-network supabase_kong_Supabase
```

### Bước 3: Cập nhật docker-compose.yml

Thay đổi `VITE_SUPABASE_URL` từ `http://localhost:54321` sang `https://supabase.hoanong.com`:

```yaml
args:
  VITE_SUPABASE_URL: https://supabase.hoanong.com
  VITE_SUPABASE_PUBLISHABLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Bước 4: Rebuild và deploy

```powershell
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

### Bước 5: Test

1. Đợi vài phút để Cloudflare Tunnel cập nhật config
2. Test Supabase:
   ```javascript
   // Trong Browser Console
   fetch('https://supabase.hoanong.com/rest/v1/', {
     headers: {'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
   }).then(r => console.log('Status:', r.status));
   ```
3. Test đăng nhập: https://life.hoanong.com

---

## Lưu ý

- ⏱️ Cloudflare Tunnel cần vài phút để cập nhật config
- 🔍 Kiểm tra logs: `docker-compose logs cloudflared | Select-String "supabase"`
- ✅ Sau khi cập nhật, user từ bên ngoài có thể đăng nhập được

