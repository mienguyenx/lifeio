# Hướng dẫn cấu hình Cloudflare Tunnel cho life.hoanong.com

## Bước 1: Tạo Cloudflare Tunnel

### Cách 1: Qua Cloudflare Dashboard (Khuyến nghị)

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Chọn domain `hoanong.com`
3. Vào **Zero Trust** > **Networks** > **Tunnels**
4. Click **Create a tunnel**
5. Chọn **Cloudflared**
6. Đặt tên tunnel: `lifeos-tunnel` (hoặc tên bạn muốn)
7. Click **Save tunnel**

### Cách 2: Qua Cloudflare CLI

```bash
# Cài đặt cloudflared (nếu chưa có)
# Windows: winget install --id Cloudflare.cloudflared
# Hoặc download từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Đăng nhập
cloudflared tunnel login

# Tạo tunnel
cloudflared tunnel create lifeos-tunnel
```

## Bước 2: Lấy Tunnel Token

### Qua Dashboard:
1. Vào tunnel vừa tạo
2. Click **Configure** > **Quick Tunnel Config**
3. Copy **Tunnel Token** (bắt đầu với `eyJ...`)

### Hoặc lấy Tunnel ID và Account ID:
- **Tunnel ID**: Hiển thị trong tunnel details
- **Account ID**: Vào domain overview, copy Account ID

## Bước 3: Cấu hình Tunnel

### Tạo file credentials.json:

1. Tạo file `cloudflared/credentials.json`:
```json
{
  "AccountTag": "YOUR_ACCOUNT_ID",
  "TunnelSecret": "YOUR_TUNNEL_SECRET",
  "TunnelID": "YOUR_TUNNEL_ID",
  "TunnelName": "lifeos-tunnel"
}
```

**Lưu ý**: 
- `TunnelSecret` chỉ có khi tạo tunnel qua CLI
- Nếu tạo qua Dashboard, chỉ cần dùng `TUNNEL_TOKEN`

### Cập nhật config.yml:

File `cloudflared/config.yml` đã được tạo sẵn với cấu hình:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: life.hoanong.com
    service: http://lifeos-app:80
  - service: http_status:404
```

## Bước 4: Cấu hình Route trong Cloudflare Dashboard

1. Vào tunnel vừa tạo
2. Click **Configure** > **Public Hostname**
3. Thêm public hostname:
   - **Subdomain**: `life`
   - **Domain**: `hoanong.com`
   - **Service**: `http://lifeos-app:80` (hoặc `http://localhost:3222` nếu chạy local)
   - **Path**: (để trống)
4. Click **Save hostname**

## Bước 5: Cấu hình Environment Variables

Tạo file `.env` trong thư mục dự án:
```env
# Cloudflare Tunnel Token (khuyến nghị - dùng token thay vì credentials.json)
CLOUDFLARE_TUNNEL_TOKEN=eyJ...your-token-here

# Hoặc nếu dùng credentials.json, không cần token
# CLOUDFLARE_TUNNEL_ID=your-tunnel-id
```

**Lưu ý**: 
- Nếu dùng `TUNNEL_TOKEN`, không cần `credentials.json`
- Nếu dùng `credentials.json`, không cần `TUNNEL_TOKEN`

## Bước 6: Cập nhật docker-compose.yml

File đã được cấu hình sẵn. Nếu dùng credentials.json thay vì token, cập nhật:

```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  container_name: cloudflared-lifeos
  restart: unless-stopped
  command: tunnel --config /etc/cloudflared/config.yml run
  volumes:
    - ./cloudflared:/etc/cloudflared
  # Không cần TUNNEL_TOKEN nếu dùng credentials.json
```

## Bước 7: Deploy

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f cloudflared
docker-compose logs -f lifeos-app
```

## Bước 8: Kiểm tra

1. **Kiểm tra tunnel đang chạy:**
```bash
docker logs cloudflared-lifeos
```

Bạn sẽ thấy:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it: https://xxxx-xxxx-xxxx.trycloudflare.com  |
+--------------------------------------------------------------------------------------------+
```

2. **Kiểm tra từ browser:**
- Truy cập: https://life.hoanong.com
- Kiểm tra SSL certificate (sẽ tự động có từ Cloudflare)

## Cấu hình nâng cao

### Thêm nhiều subdomain:

Cập nhật `cloudflared/config.yml`:
```yaml
ingress:
  - hostname: life.hoanong.com
    service: http://lifeos-app:80
  - hostname: api.life.hoanong.com
    service: http://api-service:8080
  - service: http_status:404
```

### Sử dụng với Traefik:

Nếu muốn route qua Traefik thay vì trực tiếp:
```yaml
ingress:
  - hostname: life.hoanong.com
    service: http://traefik:80
  - service: http_status:404
```

Và cấu hình Traefik router như bình thường.

## Troubleshooting

### Tunnel không kết nối

1. **Kiểm tra token/credentials:**
```bash
docker logs cloudflared-lifeos
```

2. **Kiểm tra config:**
```bash
docker exec cloudflared-lifeos cat /etc/cloudflared/config.yml
```

3. **Test tunnel local:**
```bash
cloudflared tunnel --config ./cloudflared/config.yml run
```

### DNS không resolve

1. Kiểm tra public hostname trong Cloudflare Dashboard
2. Đảm bảo subdomain đã được thêm vào tunnel
3. Đợi vài phút để DNS propagate

### 502 Bad Gateway

1. Kiểm tra container `lifeos-app` đang chạy:
```bash
docker ps | grep lifeos-app
```

2. Kiểm tra service URL trong config.yml đúng không
3. Kiểm tra network:
```bash
docker network inspect affine_traefik-network
```

### SSL lỗi

- Cloudflare Tunnel tự động cung cấp SSL
- Không cần cấu hình SSL certificate riêng
- Đảm bảo SSL/TLS mode trong Cloudflare là **Full** hoặc **Full (strict)**

## Lưu ý quan trọng

1. **Tunnel Token vs Credentials:**
   - **Token** (khuyến nghị): Dễ dùng, tự động quản lý
   - **Credentials**: Cần quản lý file credentials.json

2. **Security:**
   - Không commit `credentials.json` hoặc `.env` vào git
   - File đã có trong `.gitignore`

3. **Performance:**
   - Cloudflare Tunnel tự động optimize traffic
   - Không cần cấu hình thêm

4. **Cost:**
   - Cloudflare Tunnel miễn phí
   - Không giới hạn bandwidth cho personal use

## Tham khảo

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Tunnel Docker](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/run-tunnel/trycloudflare/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/)

