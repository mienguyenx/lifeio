# Hướng dẫn cấu hình Cloudflare cho life.hoanong.com

## Bước 1: Cấu hình DNS trong Cloudflare

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Chọn domain `hoanong.com`
3. Vào **DNS** > **Records**

### Thêm DNS Record:

**Nếu sử dụng Cloudflare Tunnel (Khuyến nghị):**
- Không cần thêm DNS record, Cloudflare Tunnel sẽ tự động tạo

**Nếu sử dụng DNS A Record:**
- **Type**: `A` hoặc `CNAME`
- **Name**: `life`
- **Content**: IP của server Traefik (hoặc `@` nếu dùng CNAME)
- **Proxy status**: 🟠 Proxied (bật Cloudflare proxy)
- **TTL**: Auto

**Nếu sử dụng CNAME:**
- **Type**: `CNAME`
- **Name**: `life`
- **Target**: Domain của Traefik tunnel hoặc server IP
- **Proxy status**: 🟠 Proxied
- **TTL**: Auto

## Bước 2: Cấu hình SSL/TLS

1. Vào **SSL/TLS** > **Overview**
2. Đảm bảo mode là **Full (strict)** hoặc **Full**
3. Vào **SSL/TLS** > **Edge Certificates**
   - Bật **Always Use HTTPS**
   - Bật **Automatic HTTPS Rewrites**
   - Bật **Minimum TLS Version** (khuyến nghị: 1.2)

## Bước 3: Cấu hình Cloudflare Tunnel (Nếu sử dụng)

### Cách 1: Sử dụng Cloudflare Tunnel với Traefik

1. Cài đặt `cloudflared`:
```bash
# Windows
winget install --id Cloudflare.cloudflared

# Hoặc download từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

2. Tạo tunnel:
```bash
cloudflared tunnel create lifeos
```

3. Cấu hình tunnel:
Tạo file `~/.cloudflared/config.yml`:
```yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: life.hoanong.com
    service: http://localhost:3222
  - service: http_status:404
```

4. Chạy tunnel:
```bash
cloudflared tunnel run lifeos
```

### Cách 2: Sử dụng Traefik với Cloudflare DNS Challenge

Nếu Traefik đã được cấu hình với Cloudflare DNS challenge, SSL sẽ tự động được cấp.

Kiểm tra Traefik config có:
```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      dnsChallenge:
        provider: cloudflare
```

## Bước 4: Cấu hình Cloudflare Settings

### Performance:
1. Vào **Speed** > **Optimization**
   - Bật **Auto Minify** (JS, CSS, HTML)
   - Bật **Brotli**
   - Bật **Early Hints**

### Caching:
1. Vào **Caching** > **Configuration**
   - **Caching Level**: Standard
   - **Browser Cache TTL**: Respect Existing Headers

### Page Rules (Tùy chọn):
Tạo rule cho `life.hoanong.com/*`:
- **Cache Level**: Standard
- **Browser Cache TTL**: 4 hours
- **Edge Cache TTL**: 2 hours

## Bước 5: Cấu hình Security

1. Vào **Security** > **WAF**
   - Bật **Web Application Firewall**
   - Cấu hình rules phù hợp

2. Vào **Security** > **Bots**
   - Bật **Bot Fight Mode** hoặc **Super Bot Fight Mode**

3. Vào **Security** > **Settings**
   - **Security Level**: Medium
   - **Challenge Passage**: 30 minutes

## Bước 6: Kiểm tra

1. **Kiểm tra DNS:**
```bash
# Kiểm tra DNS resolution
nslookup life.hoanong.com

# Hoặc
dig life.hoanong.com
```

2. **Kiểm tra SSL:**
```bash
# Kiểm tra SSL certificate
openssl s_client -connect life.hoanong.com:443 -servername life.hoanong.com
```

3. **Kiểm tra từ browser:**
- Truy cập: https://life.hoanong.com
- Kiểm tra SSL certificate
- Kiểm tra Cloudflare headers trong DevTools

## Bước 7: Deploy ứng dụng

```bash
# Build và start
docker-compose up -d --build

# Kiểm tra logs
docker-compose logs -f lifeos-app
```

## Troubleshooting

### DNS không resolve
- Kiểm tra DNS record trong Cloudflare
- Đợi vài phút để DNS propagate
- Xóa DNS cache: `ipconfig /flushdns` (Windows)

### SSL không hoạt động
- Kiểm tra SSL/TLS mode trong Cloudflare
- Kiểm tra Traefik cert resolver
- Xem logs Traefik: `docker logs traefik`

### 502 Bad Gateway
- Kiểm tra container đang chạy: `docker ps`
- Kiểm tra network: `docker network inspect affine_traefik-network`
- Kiểm tra Traefik router config

### Cloudflare Tunnel không kết nối
- Kiểm tra tunnel đang chạy: `cloudflared tunnel list`
- Xem logs: `cloudflared tunnel info lifeos`
- Kiểm tra config file

## Lưu ý quan trọng

1. **Cloudflare Proxy**: Đảm bảo DNS record có proxy status là 🟠 Proxied
2. **SSL Mode**: Sử dụng **Full (strict)** nếu có valid SSL certificate
3. **Origin IP**: Nếu dùng Cloudflare proxy, Traefik sẽ nhận IP của Cloudflare, không phải client IP
4. **Rate Limiting**: Có thể cấu hình rate limiting trong Cloudflare để bảo vệ ứng dụng

## Tham khảo

- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Traefik Cloudflare Documentation](https://doc.traefik.io/traefik/https/acme/#dnschallenge)

