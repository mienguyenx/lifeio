# 🚀 Quick Start - Deploy với Traefik Tunnel

## Bước 1: Kiểm tra Traefik Network

```bash
# Xem network Traefik đang dùng
docker inspect traefik --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}'

# Hoặc xem tất cả networks
docker network ls | grep traefik
```

Cập nhật tên network trong `docker-compose.yml` nếu khác `affine_traefik-network`.

## Bước 2: Cấu hình Domain (Tùy chọn)

Mở `docker-compose.yml` và cập nhật:

```yaml
# Cách 1: Subdomain tự động
environment:
  - TUNNEL_SUBDOMAIN=lifeos

# Cách 2: Domain tùy chỉnh
environment:
  - TUNNEL_DOMAIN=lifeos.yourdomain.com
```

Và cập nhật Traefik router rule:
```yaml
- "traefik.http.routers.lifeos.rule=Host(`lifeos.yourdomain.com`)"
```

## Bước 3: Build và Deploy

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f lifeos-app
```

## Bước 4: Kiểm tra

- Truy cập qua Traefik tunnel URL
- Hoặc trực tiếp: http://localhost:3222

## Các lệnh hữu ích

```bash
# Dừng
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build --force-recreate

# Xem logs
docker-compose logs -f
```

## Troubleshooting

### Network không tìm thấy
```bash
# Tạo network nếu chưa có
docker network create affine_traefik-network
```

### Port conflict
Thay đổi port trong `docker-compose.yml`:
```yaml
ports:
  - "3223:80"  # Thay 3222
```

Xem `DEPLOY_TRAEFIK.md` để biết thêm chi tiết.

