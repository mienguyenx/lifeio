# 🔧 Fix Supabase Routing - Route qua Traefik

## Vấn đề

Bạn đúng - IP address có thể thay đổi. Các service khác đều route qua Traefik (`http://traefik:80`), nên Supabase cũng nên route qua Traefik để nhất quán.

## Giải pháp: Dùng hostname thay vì IP

Vì cả Cloudflare Tunnel và Supabase đều trong cùng network `affine_traefik-network`, có thể dùng **hostname** `supabase_kong_Supabase:8000` trực tiếp trong Cloudflare Tunnel (không cần IP).

### Cách 1: Route trực tiếp qua hostname (Đơn giản nhất) ⭐

**Trong Cloudflare Dashboard:**
1. Zero Trust > Networks > Tunnels
2. Chọn tunnel của bạn
3. Published application routes > `supabase.hoanong.com`
4. **Service**: `http://supabase_kong_Supabase:8000` (đã đúng!)
5. **Thêm HTTP Headers** (nếu chưa có):
   - `Access-Control-Allow-Origin: https://life.hoanong.com`
   - `Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info`
   - `Access-Control-Allow-Credentials: true`

**Lý do hoạt động:**
- Cloudflare Tunnel và Supabase đều trong `affine_traefik-network`
- Docker network có DNS resolution tự động
- Hostname `supabase_kong_Supabase` sẽ được resolve thành IP trong network

### Cách 2: Route qua Traefik (Nhất quán với các service khác)

Nếu muốn route qua Traefik như các service khác:

**Bước 1: Cấu hình Traefik file-based config**

Tạo file config cho Traefik (nếu có quyền truy cập):
```yaml
# traefik-dynamic.yml
http:
  routers:
    supabase:
      rule: "Host(`supabase.hoanong.com`)"
      service: supabase
      entryPoints:
        - web
  services:
    supabase:
      loadBalancer:
        servers:
          - url: "http://supabase_kong_Supabase:8000"
```

**Bước 2: Update Cloudflare Tunnel**
- Service: `http://traefik:80`

**Nhưng:** Cách này phức tạp hơn và cần quyền truy cập Traefik config.

## Khuyến nghị: Dùng Cách 1

**Lý do:**
- ✅ Đơn giản, không cần cấu hình thêm
- ✅ Hostname không thay đổi (khác IP)
- ✅ Docker network tự động resolve DNS
- ✅ Hoạt động ngay

## Vấn đề trước đó: "no such host"

Nếu trước đó có lỗi "no such host", có thể do:
1. Cloudflare Tunnel chưa trong network `affine_traefik-network` (đã fix)
2. Supabase container chưa trong network (đã fix)
3. DNS resolution chậm (đợi vài giây)

## Test

```javascript
// Trong Browser Console
fetch('https://supabase.hoanong.com/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
})
.then(r => console.log('✅ Status:', r.status))
.catch(e => console.error('❌ Error:', e));
```

## Kết luận

**Dùng: `http://supabase_kong_Supabase:8000`** trong Cloudflare Tunnel

- Hostname không thay đổi (khác IP)
- Docker network tự động resolve
- Đơn giản và hoạt động tốt

