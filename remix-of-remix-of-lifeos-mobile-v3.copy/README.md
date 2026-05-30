# LifeOS Web (Vite + React + Tailwind)

Ứng dụng LifeOS web, build bằng Vite/React/TypeScript/shadcn-ui. Hướng dẫn dưới đây dùng cho local dev, build Docker image và deploy trên Coolify (kéo image từ GitHub Container Registry để máy chủ nhẹ).

## 1) Yêu cầu
- Node.js 20+ và npm 10+
- (Tùy chọn) Docker 24+

## 2) Thiết lập môi trường
Tạo file `.env` (hoặc export biến khi build Docker):

```
VITE_SUPABASE_URL=...        # ví dụ: https://life.hoanong.com/supabase
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_API_KEY=...
```

> Không commit khóa bí mật. Với build Docker, truyền qua `--build-arg` hoặc biến CI.

## 3) Chạy local
```bash
npm ci
npm run dev
# mở http://localhost:5173
```

Build production để kiểm tra:
```bash
npm run build
npm run preview
```

## 4) Docker build (image nhẹ, serve bằng nginx)
Dockerfile đã có sẵn multi-stage:
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://life.hoanong.com/supabase \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=xxx \
  --build-arg VITE_GOOGLE_CLIENT_ID=xxx \
  --build-arg VITE_GOOGLE_API_KEY=xxx \
  -t ghcr.io/<your-org>/lifeos-web:latest .

docker run -p 8080:80 ghcr.io/<your-org>/lifeos-web:latest
```

### Push lên GitHub Container Registry (GHCR)
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-username> --password-stdin
docker push ghcr.io/<your-org>/lifeos-web:latest
```

## 5) Triển khai trên Coolify (kéo image từ GHCR)
1. Tạo **Container > Docker Registry** trong Coolify.
2. Image: `ghcr.io/<your-org>/lifeos-web:latest`.
3. Port: `80` (container port).
4. Env lúc build đã bake sẵn trong image (qua build-arg). Nếu muốn đổi Supabase URL/key → rebuild/push image.
5. Gán domain trong Coolify, bật HTTPS (qua Traefik nội bộ của Coolify).

### Tùy chọn: build trong Coolify
Nếu muốn Coolify tự build từ repo thay vì image sẵn:
- Repository: GitHub `https://github.com/huynhlongdai/LifeOS.git` (thư mục: `remix-of-remix-of-lifeos-mobile-v3.copy`).
- Dockerfile: `Dockerfile` ở thư mục này.
- Build args: giống mục 4.

## 6) Dọn dẹp
- Không commit `node_modules/`, `dist/`, hoặc file `.env`. Đã có `.gitignore`.
- Backups/zip giữ ngoài repo nếu không cần deploy.

## 7) Scripts chính
- `npm run dev` — Dev server
- `npm run build` — Build production
- `npm run preview` — Serve build
- `npm run lint` — ESLint

## 8) Công nghệ
- Vite 5, React 18, TypeScript 5
- TailwindCSS, shadcn-ui
- Zustand, React Query, Supabase JS

## 9) Ghi chú bảo mật
- Không để lộ PUBLISHABLE_KEY nếu private; dùng repo secret/GH Actions để build image và push GHCR.
- Nếu chạy sau proxy (Coolify/Traefik), domain phải khớp VITE_SUPABASE_URL để tránh CORS.
