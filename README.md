# LifeOS

Ứng dụng quản lý cuộc sống cá nhân (life management) gồm web app, browser extension và backend API. Repo đang trong quá trình chuyển từ kiến trúc cũ (Supabase local + Cloudflare Tunnel + Traefik) sang **PostgreSQL + API riêng**, build Docker image bằng **GitHub Actions** và deploy lên **Coolify**.

## Cấu trúc repo

```
.
├── frontend/      # Web app (Vite + React + TypeScript + shadcn/ui + Tailwind)
├── extension/     # Chrome extension (MV3): side panel, new tab, widget, content script
├── mobile/        # Mobile app (Expo / React Native) — track riêng
├── db/            # Cơ sở dữ liệu
│   ├── schema/    #   Lịch sử schema (migrations gốc, nguồn để port sang Postgres mới)
│   ├── seed/      #   Dữ liệu mẫu / seed (templates, AI models, translations...)
│   ├── fixes/     #   Script SQL vá/bảo trì thủ công trước đây
│   └── backups/   #   Bản dump DB cũ (nguồn để migrate dữ liệu)
├── docs/          # Tài liệu
│   └── archive/   #   Báo cáo/ghi chú debug & fix cũ (lưu trữ)
├── legacy/        # Thành phần sẽ loại bỏ dần sau khi migrate xong
│   ├── deploy/    #   docker-compose, proxy Supabase, Cloudflare, Vercel cũ
│   ├── edge-functions/  # Supabase Edge Functions (sẽ port thành API endpoint)
│   ├── supabase/  #   config.toml của Supabase cũ
│   └── dev-tests/ #   Script test/debug rời
└── scripts/       # Script tiện ích (.ps1/.sh) — chủ yếu cho môi trường local cũ
```

## Frontend

```bash
cd frontend
npm install
cp .env.example .env   # điền VITE_API_URL (mặc định http://localhost:4000/api/v1)
npm run dev            # chạy dev server
npm run build          # build production -> dist/
npm run lint
```

Frontend đọc URL backend qua `VITE_API_URL` lúc build (bao gồm hậu tố `/api/v1`).

## Build & Deploy (GitHub Actions → GHCR → Coolify)

- **CI build images**: `.github/workflows/build-images.yml` build và push 2 image
  lên GHCR (`ghcr.io/<owner>/lifeio/backend`, `.../frontend`) khi push lên `main`
  hoặc tạo tag `v*`, đồng thời đóng gói extension thành artifact `lifeos-extension.zip`.
  - Đặt repo **Variable** `VITE_API_URL` = URL API production (vd
    `https://api.life.example.com/api/v1`); tùy chọn `VITE_GOOGLE_CLIENT_ID` và
    **Secret** `VITE_GOOGLE_API_KEY` (được bake vào bundle frontend lúc build).
- **Coolify**: dùng `deploy/coolify/docker-compose.yml` (Postgres + backend +
  frontend, backend tự chạy migration khi khởi động qua `npm run start:prod`).
  Khai báo biến môi trường theo `deploy/coolify/.env.example`.
- **Migrate dữ liệu cũ**: `scripts/migrate-supabase-dump.sh` nạp dump Supabase cũ
  (`db/backups/*.sql`) vào schema Postgres mới (users + các bảng nghiệp vụ, idempotent).
  Xem header của script để biết cách dùng. Lưu ý: hash mật khẩu cũ là **bcrypt**
  còn backend mới verify **argon2** → người dùng cần reset mật khẩu sau khi migrate.

## Lộ trình tái kiến trúc (đang thực hiện)

1. **Phase 0 — Cleanup & restructure** (PR hiện tại): dọn repo, gom tài liệu/script, tách `frontend`/`extension`/`db`/`legacy`, không đổi logic app.
2. **Phase 1 — Backend**: PostgreSQL + API riêng (auth JWT, CRUD, API key cho AI agent).
3. **Phase 2 — Frontend data layer**: thay client Supabase bằng SDK gọi API mới.
4. **Phase 3 — AI endpoints**: port các Edge Function trong `legacy/edge-functions/`.
5. **Phase 4 — Extension**: trỏ extension sang API mới.
6. **Phase 5 — Build & Deploy**: Docker image qua GitHub Actions (GHCR) → Coolify, migrate dữ liệu cũ.

## ⚠️ Bảo mật

Một số secret từng được commit (Google API key, Cloudflare Tunnel token) đã được gỡ khỏi các file cấu hình hiện tại nhưng **vẫn còn trong git history và trong bản dump `db/backups/`**. Hãy **rotate (thu hồi & tạo mới)** các secret này.
