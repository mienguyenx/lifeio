# 🔀 Hướng dẫn: Route Supabase qua Cloudflare Tunnel

## ⚠️ Câu hỏi: Service là gì?

Có **2 cách** để route Supabase qua Cloudflare Tunnel:

---

## ✅ Cách 1: Route TRỰC TIẾP đến Supabase (Khuyến nghị) ⭐

### Service trong Cloudflare Dashboard:
```
http://supabase_kong_Supabase:8000
```

### Ưu điểm:
- ✅ Đơn giản, không cần cấu hình thêm
- ✅ Supabase đã trong network `affine_traefik-network`
- ✅ Cloudflare Tunnel có thể route trực tiếp
- ✅ Không cần cấu hình Traefik labels

### Cách làm:
1. Trong Cloudflare Dashboard > **Published application routes**
2. Click **+ Add a published application route**
3. Điền:
   - **Published application routes**: `supabase.hoanong.com`
   - **Path**: `*` (hoặc để trống)
   - **Service**: `http://supabase_kong_Supabase:8000`
4. Click **Save**

---

## 🔄 Cách 2: Route qua Traefik (Nhất quán với các service khác)

### Service trong Cloudflare Dashboard:
```
http://traefik:80
```

### Ưu điểm:
- ✅ Nhất quán với các service khác (`note.hoanong.com`, `life.hoanong.com`, v.v.)
- ✅ Traefik xử lý routing dựa trên domain
- ✅ Có thể thêm middleware, headers, SSL

### Nhược điểm:
- ⚠️ Cần cấu hình Traefik labels cho Supabase container
- ⚠️ Phức tạp hơn một chút

### Cách làm:

#### Bước 1: Thêm Traefik labels cho Supabase

Cần thêm labels vào Supabase container (nếu có docker-compose cho Supabase):

```yaml
services:
  supabase-kong:
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=affine_traefik-network"
      - "traefik.http.routers.supabase.rule=Host(`supabase.hoanong.com`)"
      - "traefik.http.routers.supabase.entrypoints=web"
      - "traefik.http.routers.supabase.service=supabase"
      - "traefik.http.services.supabase.loadbalancer.server.port=8000"
```

Hoặc dùng `docker update`:
```powershell
docker update --label-add "traefik.enable=true" supabase_kong_Supabase
docker update --label-add "traefik.docker.network=affine_traefik-network" supabase_kong_Supabase
docker update --label-add "traefik.http.routers.supabase.rule=Host(\`supabase.hoanong.com\`)" supabase_kong_Supabase
docker update --label-add "traefik.http.routers.supabase.entrypoints=web" supabase_kong_Supabase
docker update --label-add "traefik.http.routers.supabase.service=supabase" supabase_kong_Supabase
docker update --label-add "traefik.http.services.supabase.loadbalancer.server.port=8000" supabase_kong_Supabase
```

#### Bước 2: Thêm route trong Cloudflare Dashboard

1. **Published application routes**: `supabase.hoanong.com`
2. **Path**: `*`
3. **Service**: `http://traefik:80`
4. Click **Save**

---

## 🎯 Khuyến nghị

### Cho trường hợp này: **Cách 1 - Route trực tiếp** ⭐

**Lý do:**
- Supabase đã trong network traefik
- Không cần cấu hình thêm Traefik labels
- Đơn giản và nhanh nhất
- Cloudflare Tunnel có thể route trực tiếp đến bất kỳ container nào trong network

### Khi nào dùng Cách 2?

- Khi muốn nhất quán với các service khác
- Khi cần Traefik xử lý SSL, headers, middleware
- Khi có nhiều service cần routing phức tạp

---

## 📋 Các bước thực hiện (Cách 1 - Khuyến nghị)

### 1. Thêm route trong Cloudflare Dashboard

1. Vào **Zero Trust** > **Networks** > **Tunnels**
2. Chọn tunnel `note_tunnel` (hoặc tunnel của bạn)
3. Vào tab **Published application routes**
4. Click **+ Add a published application route**
5. Điền:
   - **Published application routes**: `supabase.hoanong.com`
   - **Path**: `*` (hoặc để trống)
   - **Service**: `http://supabase_kong_Supabase:8000`
6. Click **Save**

### 2. Đợi 2-3 phút để Cloudflare cập nhật

### 3. Test

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

### 4. Rebuild container (nếu chưa)

```powershell
docker-compose build --no-cache lifeos-app
docker-compose up -d --force-recreate lifeos-app
```

---

## ✅ Kết luận

**Dùng: `http://supabase_kong_Supabase:8000`** (Cách 1)

Đơn giản, nhanh, và hoạt động tốt! 🚀

