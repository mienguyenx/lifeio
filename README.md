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
cp .env.example .env   # điền VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (tạm thời)
npm run dev            # chạy dev server
npm run build          # build production -> dist/
npm run lint
```

Frontend đọc cấu hình backend qua biến môi trường `VITE_*` lúc build (xem `frontend/.env.example`).

## Lộ trình tái kiến trúc (đang thực hiện)

1. **Phase 0 — Cleanup & restructure** (PR hiện tại): dọn repo, gom tài liệu/script, tách `frontend`/`extension`/`db`/`legacy`, không đổi logic app.
2. **Phase 1 — Backend**: PostgreSQL + API riêng (auth JWT, CRUD, API key cho AI agent).
3. **Phase 2 — Frontend data layer**: thay client Supabase bằng SDK gọi API mới.
4. **Phase 3 — AI endpoints**: port các Edge Function trong `legacy/edge-functions/`.
5. **Phase 4 — Extension**: trỏ extension sang API mới.
6. **Phase 5 — Build & Deploy**: Docker image qua GitHub Actions (GHCR) → Coolify, migrate dữ liệu cũ.

## ⚠️ Bảo mật

Một số secret từng được commit (Google API key, Cloudflare Tunnel token) đã được gỡ khỏi các file cấu hình hiện tại nhưng **vẫn còn trong git history và trong bản dump `db/backups/`**. Hãy **rotate (thu hồi & tạo mới)** các secret này.
