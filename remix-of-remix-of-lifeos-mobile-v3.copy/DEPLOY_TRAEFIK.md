# Hướng dẫn Deploy với Traefik Tunnel Expose

## Yêu cầu

1. **Docker** và **Docker Compose** đã cài đặt
2. **Traefik** đang chạy và có network `traefik`
3. **Traefik Tunnel** đã được cấu hình

## Cấu hình Traefik Network

Đảm bảo Traefik network đã được tạo:

```bash
docker network create traefik
```

Hoặc nếu Traefik đã chạy, kiểm tra network name:
```bash
docker network ls | grep traefik
```

## Cấu hình Domain

### Cách 1: Sử dụng domain/subdomain tự động từ Traefik Tunnel

Cập nhật `docker-compose.yml`:
```yaml
environment:
  - TUNNEL_SUBDOMAIN=lifeos  # Sẽ tạo: lifeos.your-tunnel-domain.com
```

### Cách 2: Sử dụng domain tùy chỉnh

Cập nhật `docker-compose.yml`:
```yaml
environment:
  - TUNNEL_DOMAIN=lifeos.yourdomain.com
```

Và cập nhật Traefik router labels:
```yaml
- "traefik.http.routers.lifeos.rule=Host(`lifeos.yourdomain.com`)"
```

## Deploy

### 1. Build và khởi động

```bash
# Build và start
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Xem logs của app
docker-compose logs -f lifeos-app

# Xem logs của tunnel
docker-compose logs -f traefik-tunnel
```

### 2. Kiểm tra containers

```bash
docker ps | grep lifeos
```

### 3. Kiểm tra kết nối

- Truy cập qua Traefik tunnel URL
- Hoặc trực tiếp: http://localhost:3222

## Cấu hình Environment Variables

Nếu cần cấu hình Supabase hoặc các biến môi trường khác, tạo file `.env`:

```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here
```

Và cập nhật `docker-compose.yml`:
```yaml
services:
  lifeos-app:
    env_file:
      - .env
```

## Các lệnh hữu ích

```bash
# Dừng containers
docker-compose down

# Dừng và xóa volumes
docker-compose down -v

# Rebuild và restart
docker-compose up -d --build --force-recreate

# Xem logs real-time
docker-compose logs -f

# Restart service
docker-compose restart lifeos-app

# Xem status
docker-compose ps
```

## Troubleshooting

### Container không start

```bash
# Kiểm tra logs
docker-compose logs lifeos-app

# Kiểm tra network
docker network inspect traefik

# Kiểm tra Traefik labels
docker inspect lifeos-app | grep -A 20 Labels
```

### Traefik không route được

1. Kiểm tra Traefik network:
```bash
docker network inspect traefik
```

2. Kiểm tra container có trong network không:
```bash
docker inspect lifeos-app | grep Networks
```

3. Kiểm tra Traefik dashboard để xem routers và services

### Build fails

```bash
# Xóa cache và rebuild
docker-compose build --no-cache

# Kiểm tra Dockerfile
docker build -t lifeos-test .
```

### Port conflict

Nếu port 3222 đã được sử dụng, thay đổi trong `docker-compose.yml`:
```yaml
ports:
  - "3223:80"  # Thay 3222 bằng port khác
```

## Cập nhật ứng dụng

```bash
# Pull code mới
git pull

# Rebuild và restart
docker-compose up -d --build

# Hoặc chỉ restart nếu không có thay đổi code
docker-compose restart lifeos-app
```

## Production Tips

1. **Environment Variables**: Không commit file `.env` vào git
2. **SSL/TLS**: Traefik sẽ tự động cấu hình SSL qua Let's Encrypt
3. **Backup**: Đảm bảo backup database nếu sử dụng Supabase local
4. **Monitoring**: Có thể thêm healthcheck trong docker-compose.yml
5. **Resource Limits**: Thêm resource limits cho production:

```yaml
services:
  lifeos-app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Tham khảo

- [Traefik Tunnel Expose Docker Hub](https://hub.docker.com/r/zenkiet/traefik-tunnel-expose)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

