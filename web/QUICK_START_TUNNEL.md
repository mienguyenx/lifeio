# 🚀 Quick Start - Cloudflare Tunnel

## Domain: life.hoanong.com

### Bước 1: Tạo Tunnel trong Cloudflare Dashboard

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Chọn domain `hoanong.com`
3. Vào **Zero Trust** > **Networks** > **Tunnels**
4. Click **Create a tunnel** > **Cloudflared**
5. Đặt tên: `lifeos-tunnel`
6. Click **Save tunnel**

### Bước 2: Lấy Tunnel Token

1. Vào tunnel vừa tạo
2. Click **Configure** > **Quick Tunnel Config**
3. Copy **Tunnel Token** (bắt đầu với `eyJ...`)

### Bước 3: Cấu hình Public Hostname

1. Trong tunnel, click **Configure** > **Public Hostname**
2. Thêm hostname:
   - **Subdomain**: `life`
   - **Domain**: `hoanong.com`
   - **Service**: `http://lifeos-app:80`
3. Click **Save hostname**

### Bước 4: Tạo file .env

Tạo file `.env` trong thư mục dự án:
```env
CLOUDFLARE_TUNNEL_TOKEN=eyJ...your-token-here
```

### Bước 5: Deploy

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f cloudflared
```

### Bước 6: Kiểm tra

Truy cập: https://life.hoanong.com

## Các lệnh hữu ích

```bash
# Restart tunnel
docker-compose restart cloudflared

# Xem logs
docker-compose logs -f cloudflared

# Rebuild
docker-compose up -d --build --force-recreate
```

## Troubleshooting

### Tunnel không kết nối
- Kiểm tra token trong `.env`
- Xem logs: `docker-compose logs cloudflared`

### DNS không hoạt động
- Kiểm tra public hostname trong Cloudflare Dashboard
- Đợi vài phút để DNS propagate

Xem `CLOUDFLARE_TUNNEL_SETUP.md` để biết thêm chi tiết.

