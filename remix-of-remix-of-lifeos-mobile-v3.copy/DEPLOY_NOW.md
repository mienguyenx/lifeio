# 🚀 Deploy ngay bây giờ

## Bước 1: Cập nhật file .env

Thêm hoặc cập nhật token trong file `.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiNWYzYjIyMjQ1MDBkODEwNDY1MTMxMGNiMGVkNjFiZTUiLCJ0IjoiYWNmYzMyNDQtMTY1ZC00MDUwLTk0YTUtMmFjYzBkYjc1NDM2IiwicyI6Ik5URmpPREZqWXpjdE5qY3pPQzAwT0RBMkxXSTBZVFV0WmpGa1pUY3laREV3T1RsayJ9
```

## Bước 2: Cấu hình Public Hostname trong Cloudflare

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Chọn domain `hoanong.com`
3. Vào **Zero Trust** > **Networks** > **Tunnels**
4. Chọn tunnel của bạn
5. Click **Configure** > **Public Hostname**
6. Thêm hostname:
   - **Subdomain**: `life`
   - **Domain**: `hoanong.com`
   - **Service**: `http://lifeos-app:80`
7. Click **Save hostname**

## Bước 3: Build và Deploy

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f cloudflared
docker-compose logs -f lifeos-app
```

## Bước 4: Kiểm tra

Truy cập: https://life.hoanong.com

## Troubleshooting

### Token không hoạt động
- Kiểm tra token trong file `.env`
- Xem logs: `docker-compose logs cloudflared`

### Service không kết nối
- Kiểm tra container đang chạy: `docker ps`
- Kiểm tra network: `docker network inspect affine_traefik-network`

### DNS không resolve
- Kiểm tra public hostname trong Cloudflare Dashboard
- Đợi vài phút để DNS propagate

