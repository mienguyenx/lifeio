# 🚀 Quick Start - Deploy với Cloudflare

## Domain: life.hoanong.com

### Bước 1: Cấu hình DNS trong Cloudflare

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Chọn domain `hoanong.com`
3. Vào **DNS** > **Records**
4. Thêm record:
   - **Type**: `A` hoặc `CNAME`
   - **Name**: `life`
   - **Content/Target**: IP server hoặc domain Traefik
   - **Proxy**: 🟠 Proxied (BẬT)
   - **TTL**: Auto

### Bước 2: Cấu hình SSL/TLS

1. Vào **SSL/TLS** > **Overview**
2. Set mode: **Full (strict)** hoặc **Full**
3. Vào **SSL/TLS** > **Edge Certificates**
   - Bật **Always Use HTTPS**

### Bước 3: Deploy ứng dụng

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f lifeos-app
```

### Bước 4: Kiểm tra

Truy cập: https://life.hoanong.com

## Các lệnh hữu ích

```bash
# Restart
docker-compose restart lifeos-app

# Rebuild
docker-compose up -d --build --force-recreate

# Xem logs
docker-compose logs -f
```

## Troubleshooting

### DNS không hoạt động
- Đợi vài phút để DNS propagate
- Kiểm tra proxy status là 🟠 Proxied

### SSL lỗi
- Kiểm tra SSL mode trong Cloudflare
- Xem Traefik logs: `docker logs traefik`

Xem `CLOUDFLARE_SETUP.md` để biết thêm chi tiết.

