# LifeOS

**Hệ điều hành cuộc sống** — ứng dụng quản lý mục tiêu, thói quen, công việc, nhật ký và phát triển bản thân, kèm AI Coach đồng hành hằng ngày. Gồm: web app, browser extension và backend API.

Kiến trúc: **PostgreSQL + REST API (Fastify)** + **Frontend (Vite/React)** + **Chrome Extension (MV3)**. Build image bằng **GitHub Actions** → deploy lên **Coolify** (hoặc bất kỳ host Docker-compose nào). Đã loại bỏ hoàn toàn phụ thuộc Supabase.

## Tính năng chính

- **Tasks**: tạo/quản lý công việc với deadline, độ ưu tiên, lĩnh vực, subtasks.
- **Habits**: xây dựng thói quen tích cực, theo dõi streak, tần suất linh hoạt.
- **Goals & Milestones**: lập mục tiêu dài hạn, chia nhỏ thành cột mốc.
- **Journal**: nhật ký hằng ngày, gắn tag, theo dõi tâm trạng.
- **Notes**: ghi chú tự do, tag, thùng rác + khôi phục.
- **AI Coach**: trợ lý AI cá nhân hóa (dùng ngữ cảnh task/habit/năng lượng…), stream real-time.
- **Life Areas & Life Wheel**: cân bằng 10 lĩnh vực cuộc sống (sức khỏe, sự nghiệp, tài chính…).
- **Review cycle**: Weekly / Monthly / Yearly review & planning (hỗ trợ AI auto-draft).
- **Focus / Pomodoro**: làm việc tập trung theo phiên.
- **Browser Extension**: side panel, new tab, widget, text-selector (bôi đen → lưu note / dịch AI).

## Tài liệu

| Tài liệu | Mô tả |
|-----------|--------|
| [docs/SETUP.md](docs/SETUP.md) | Hướng dẫn cài đặt & chạy local (PostgreSQL + backend + frontend) |
| [docs/USAGE.md](docs/USAGE.md) | Hướng dẫn sử dụng app (từng tính năng) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Kiến trúc hệ thống, schema DB, API endpoints, so sánh cũ/mới |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Triển khai production (GitHub Actions → GHCR → Coolify) |

## Quick Start (local)

```bash
# 1. Khởi động PostgreSQL
docker run -d --name lifeos-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lifeos \
  -p 5432:5432 postgres:16

# 2. Backend
cd backend && npm install && cp .env.example .env
# Sửa .env: điền JWT secrets & (tùy chọn) GEMINI_API_KEY
npm run db:migrate && npm run dev    # API @ http://localhost:4000

# 3. Frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:4000/api/v1" > .env
npm run dev -- --host --port 3222    # App @ http://localhost:3222
```

Chi tiết: [docs/SETUP.md](docs/SETUP.md)

## Cấu trúc repo

```
.
├── frontend/      # Web app (Vite + React + TypeScript + shadcn/ui + Tailwind)
├── backend/       # REST API (Fastify + Drizzle ORM + PostgreSQL)
├── extension/     # Chrome extension (MV3): side panel, new tab, widget, content script
├── mobile/        # Mobile app (Expo / React Native) — track riêng
├── db/            # Schema gốc, seed, fixes, backups (nguồn migrate)
├── deploy/        # Cấu hình Coolify (docker-compose + .env.example)
├── docs/          # Tài liệu hướng dẫn
├── legacy/        # Thành phần cũ (edge-functions, Supabase config) lưu tham chiếu
└── scripts/       # Script tiện ích (migrate dump, v.v.)
```

## Build & Deploy

- **CI**: `.github/workflows/build-images.yml` build + push 2 image (backend, frontend) lên GHCR khi push `main` / tag `v*`. Extension đóng gói thành artifact.
- **Coolify**: `deploy/coolify/docker-compose.yml` + `.env.example`. Backend tự chạy migration lúc start.
- **Migrate dữ liệu cũ**: `scripts/migrate-supabase-dump.sh` (idempotent, ON CONFLICT DO NOTHING).

Chi tiết: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Lộ trình tái kiến trúc — Hoàn thành

| Phase | Nội dung | PR |
|-------|----------|-----|
| 0 | Cleanup & restructure repo | [#3](https://github.com/mienguyenx/lifeio/pull/3) |
| 1 | Backend: PostgreSQL + auth JWT + CRUD + agent tokens | [#4](https://github.com/mienguyenx/lifeio/pull/4) |
| 2 | Frontend data layer: gỡ Supabase, query builder shim + data gateway | [#5](https://github.com/mienguyenx/lifeio/pull/5) |
| 3 | AI endpoints: port 7 edge functions, proxy server-side, SSE streaming | [#6](https://github.com/mienguyenx/lifeio/pull/6) |
| 4 | Extension: gỡ Supabase/anon key, dùng REST API | [#7](https://github.com/mienguyenx/lifeio/pull/7) |
| 5 | Build & Deploy: Dockerfile, GitHub Actions → GHCR, Coolify compose, migrate data | [#8](https://github.com/mienguyenx/lifeio/pull/8) |

## Bảo mật

Một số secret từng được commit (Google API key, Cloudflare Tunnel token) đã được gỡ khỏi file cấu hình hiện tại nhưng **vẫn còn trong git history**. Hãy **rotate** (thu hồi & tạo mới) các secret này trước khi go-live.
