# Triển khai LifeOS lên Coolify (Production)

Hướng dẫn deploy LifeOS lên server thông qua **Coolify** (hoặc bất kỳ host Docker-compose nào).

## 1. Tổng quan luồng deploy

```
   Code push lên main / tag v*
         ↓
   GitHub Actions (build-images.yml)
     • Build image backend  → ghcr.io/<owner>/lifeio/backend:<tag>
     • Build image frontend → ghcr.io/<owner>/lifeio/frontend:<tag>
     • Đóng gói extension   → artifact lifeos-extension.zip
         ↓
   Coolify pull image từ GHCR
     • docker-compose.yml (PostgreSQL + backend + frontend)
     • Backend tự chạy migration lúc khởi động
```

## 2. Chuẩn bị domain

Bạn cần **2 domain** (hoặc subdomain) trỏ về IP server Coolify:

| Domain | Dùng cho | Ví dụ |
|--------|----------|-------|
| Frontend | Web app static | `life.example.com` |
| Backend API | REST API | `api.life.example.com` |

Tạo DNS A record (hoặc CNAME nếu qua Cloudflare/proxy) cho cả 2 → IP server.

## 3. Cấu hình GitHub Actions

Trong repo setting → **Variables** (không phải Secrets trừ key thật sự nhạy cảm):

| Tên | Giá trị | Ghi chú |
|-----|---------|---------|
| `VITE_API_URL` | `https://api.life.example.com/api/v1` | Bake vào bundle frontend |
| (tùy chọn) `VITE_GOOGLE_CLIENT_ID` | | Google login/OAuth |

Secret (nếu cần):

| Tên | Ghi chú |
|-----|---------|
| `VITE_GOOGLE_API_KEY` | Google Maps / Places (nếu app dùng) |

Workflow sẽ tự chạy khi push `main` hoặc tạo tag `v*`.

## 4. Tạo stack Coolify

1. Trong Coolify, tạo **Docker Compose** resource.
2. Copy nội dung `deploy/coolify/docker-compose.yml` vào.
3. Cấu hình biến môi trường (theo mẫu `deploy/coolify/.env.example`):

```ini
# Images
IMAGE_NAMESPACE=ghcr.io/mienguyenx/lifeio
IMAGE_TAG=latest

# Database
POSTGRES_USER=lifeos
POSTGRES_PASSWORD=<mật-khẩu-mạnh>
POSTGRES_DB=lifeos

# Auth secrets
JWT_ACCESS_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>

# CORS
CORS_ORIGINS=https://life.example.com

# AI
GEMINI_API_KEY=<your-key>
AI_MODEL=gemini-2.5-flash

# (tùy chọn) Email
RESEND_API_KEY=<...>
EMAIL_FROM=noreply@life.example.com
```

4. **Gán domain** trong Coolify:
   - Service `frontend` → `life.example.com` (port 8080)
   - Service `backend` → `api.life.example.com` (port 4000)

5. Coolify sẽ tự tạo SSL cert (Let's Encrypt) và proxy.

## 5. Deploy lần đầu

Sau khi cấu hình xong, bấm **Deploy** trên Coolify. Backend sẽ:
1. Chạy `npm run start:prod` (gọi `db:migrate` trước khi listen).
2. Tạo toàn bộ 18 bảng trong PostgreSQL.
3. Listen trên port 4000.

Frontend: serve static file trên port 8080 (nginx image).

Kiểm tra: `curl https://api.life.example.com/api/v1/health`

## 6. Migrate dữ liệu cũ (tùy chọn)

Nếu có dump Supabase, chạy trên server (hoặc máy có kết nối đến Postgres):

```bash
export DATABASE_URL=postgres://lifeos:<password>@<host>:5432/lifeos
scripts/migrate-supabase-dump.sh db/backups/<dump-file>.sql
```

Script sẽ nạp users + profiles + tasks + habits + goals + journal + notes, idempotent (ON CONFLICT DO NOTHING).

> **Lưu ý:** Mật khẩu cũ (bcrypt) không tương thích verify mới (argon2). Người dùng cần đặt lại mật khẩu sau khi migrate.

## 7. Cập nhật (CI/CD)

Push code → GitHub Actions tự build + push image mới. Trên Coolify:
- Nếu đã bật **Auto Deploy** → tự pull image mới khi GHCR có tag mới.
- Nếu không, vào Coolify bấm **Redeploy**.

## 8. Extension

Extension không deploy lên server — bạn phân phối qua:
1. Chrome Web Store: upload `lifeos-extension.zip` (artifact từ CI).
2. Hoặc tự load unpacked cho internal use.

Extension đọc `config.js` để biết `appUrl` + `apiUrl`. Mặc định đã trỏ production. Người dùng dev có thể override qua `chrome.storage.local`.

## 9. Checklist trước khi go-live

- [ ] DNS cho frontend + backend trỏ đúng IP server
- [ ] Biến `CORS_ORIGINS` = domain frontend
- [ ] `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` đã thay bằng giá trị random mạnh
- [ ] `POSTGRES_PASSWORD` mạnh, không dùng default
- [ ] (Nếu dùng AI) `GEMINI_API_KEY` hoặc `AI_GATEWAY_API_KEY` đã set
- [ ] Đã test đăng ký/đăng nhập/tạo task/AI coach trên production URL
- [ ] **Rotate** Google API key & Cloudflare Tunnel token cũ (vẫn còn trong git history)
- [ ] (Nếu migrate) Thông báo user cũ đặt lại mật khẩu

Xem thêm: [SETUP.md](./SETUP.md) (dev local), [USAGE.md](./USAGE.md) (hướng dẫn sử dụng), [ARCHITECTURE.md](./ARCHITECTURE.md) (kiến trúc).
