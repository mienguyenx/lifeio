# Troubleshooting - life.hoanong.com không truy cập được

## Vấn đề hiện tại

Từ Traefik dashboard và logs, tôi thấy:
1. ✅ Container `lifeos-app` đang chạy
2. ✅ Container `cloudflared-lifeos` đang chạy  
3. ✅ Cả hai đều trong network `affine_traefik-network`
4. ✅ Cloudflare Tunnel đã kết nối
5. ⚠️ Traefik có lỗi với router `lifeos@docker` (entrypoint websecure không tồn tại)

## Nguyên nhân có thể

### 1. Cloudflare Tunnel Configuration

Cloudflare Tunnel route trực tiếp đến `lifeos-app:80`, không qua Traefik. Cần kiểm tra:

**Trong Cloudflare Dashboard:**
1. Vào **Zero Trust** > **Networks** > **Tunnels**
2. Chọn tunnel của bạn
3. Vào **Configure** > **Public Hostname**
4. Kiểm tra hostname `life.hoanong.com`:
   - **Subdomain**: `life`
   - **Domain**: `hoanong.com`
   - **Service**: `http://lifeos-app:80` (hoặc `http://172.23.0.x:80` với IP của container)

### 2. DNS Propagation

Nếu vừa thêm hostname, đợi vài phút để DNS propagate.

### 3. Container Name Resolution

Cloudflare Tunnel cần resolve được tên `lifeos-app`. Kiểm tra:

```bash
# Test từ cloudflared container
docker exec cloudflared-lifeos nslookup lifeos-app
```

Nếu không resolve được, thử dùng IP thay vì tên container.

## Giải pháp

### Cách 1: Sử dụng IP container (Khuyến nghị)

1. Lấy IP của `lifeos-app`:
```bash
docker inspect lifeos-app --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

2. Cập nhật trong Cloudflare Dashboard:
   - **Service**: `http://<IP>:80` (ví dụ: `http://172.23.0.8:80`)

### Cách 2: Route qua Traefik

Nếu muốn route qua Traefik (như các service khác):

1. Cập nhật Cloudflare Tunnel config:
   - **Service**: `http://traefik:80`

2. Đảm bảo Traefik labels đúng trong `docker-compose.yml`:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=affine_traefik-network"
  - "traefik.http.routers.lifeos.rule=Host(`life.hoanong.com`)"
  - "traefik.http.routers.lifeos.entrypoints=web"
  - "traefik.http.routers.lifeos.service=lifeos"
  - "traefik.http.services.lifeos.loadbalancer.server.port=80"
```

### Cách 3: Kiểm tra và sửa lỗi Traefik

Nếu muốn dùng Traefik với HTTPS:

1. Kiểm tra entrypoints của Traefik:
```bash
docker logs traefik | grep -i entrypoint
```

2. Cập nhật labels để dùng entrypoint đúng (có thể là `web` thay vì `websecure`)

## Kiểm tra nhanh

```bash
# 1. Kiểm tra containers đang chạy
docker ps | grep lifeos

# 2. Kiểm tra network
docker network inspect affine_traefik-network | grep lifeos

# 3. Test kết nối từ cloudflared đến lifeos-app
docker exec cloudflared-lifeos wget -O- http://lifeos-app:80

# 4. Xem logs cloudflared
docker-compose logs -f cloudflared

# 5. Xem logs lifeos-app
docker-compose logs -f lifeos-app
```

## Lưu ý

- Cloudflare Tunnel tự động cung cấp SSL, không cần cấu hình SSL trong Traefik
- Nếu route trực tiếp đến container, không cần Traefik labels
- Nếu route qua Traefik, cần đảm bảo Traefik labels đúng

