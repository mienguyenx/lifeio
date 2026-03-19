# 🔧 Update Cloudflare Tunnel cho Supabase

## Vấn đề

Bạn đúng - IP address có thể thay đổi khi container restart. Các service khác đều route qua Traefik (`http://traefik:80`), nên Supabase cũng nên route qua Traefik để nhất quán.

## Giải pháp: Route qua Traefik

### Bước 1: Thêm Traefik labels cho Supabase

Chạy script:
```powershell
.\add-traefik-labels-supabase.ps1
```

Hoặc thủ công:
```powershell
docker update --label-add "traefik.enable=true" supabase_kong_Supabase
docker update --label-add "traefik.docker.network=affine_traefik-network" supabase_kong_Supabase
docker update --label-add "traefik.http.routers.supabase.rule=Host(\`supabase.hoanong.com\`)" supabase_kong_Supabase
docker update --label-add "traefik.http.routers.supabase.entrypoints=web" supabase_kong_Supabase
docker update --label-add "traefik.http.routers.supabase.service=supabase" supabase_kong_Supabase
docker update --label-add "traefik.http.services.supabase.loadbalancer.server.port=8000" supabase_kong_Supabase
```

### Bước 2: Update Cloudflare Tunnel Config

1. Vào Cloudflare Dashboard: https://dash.cloudflare.com
2. Zero Trust > Networks > Tunnels
3. Chọn tunnel của bạn
4. Vào tab **Published application routes**
5. Tìm route: `supabase.hoanong.com`
6. Click vào menu (3 chấm) > **Edit**
7. **Thay đổi Service:**
   ```
   Từ: http://supabase_kong_Supabase:8000
   Thành: http://traefik:80
   ```
8. **Thêm HTTP Headers** (nếu chưa có):
   - `Access-Control-Allow-Origin: https://life.hoanong.com`
   - `Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info`
   - `Access-Control-Allow-Credentials: true`
9. Click **Save**

### Bước 3: Đợi Cloudflare cập nhật (30-60 giây)

### Bước 4: Test

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

## Ưu điểm của cách này

- ✅ **Nhất quán**: Giống các service khác (`life.hoanong.com`, `note.hoanong.com`, v.v.)
- ✅ **Không phụ thuộc IP**: Traefik tự động resolve hostname
- ✅ **Dễ quản lý**: Tất cả routing qua Traefik
- ✅ **Có thể thêm middleware**: SSL, headers, rate limiting, v.v.

## Kiểm tra Traefik routing

```powershell
# Xem Traefik dashboard (nếu có)
# Hoặc kiểm tra logs
docker logs traefik | Select-String "supabase"
```

## Troubleshooting

### Traefik không route được

1. Kiểm tra labels:
   ```powershell
   docker inspect supabase_kong_Supabase --format '{{range $key, $value := .Config.Labels}}{{if contains $key "traefik"}}{{$key}}={{$value}}{{println}}{{end}}{{end}}'
   ```

2. Kiểm tra network:
   ```powershell
   docker network inspect affine_traefik-network | Select-String "supabase"
   ```

3. Restart Traefik (nếu cần):
   ```powershell
   docker restart traefik
   ```

### Cloudflare Tunnel vẫn không hoạt động

1. Kiểm tra logs:
   ```powershell
   docker-compose logs cloudflared | Select-String "supabase"
   ```

2. Đợi thêm 1-2 phút để Cloudflare sync

3. Thử restart Cloudflare Tunnel:
   ```powershell
   docker restart cloudflared-lifeos
   ```

