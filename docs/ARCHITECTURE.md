# Kiến trúc hệ thống LifeOS

Tài liệu mô tả kiến trúc kỹ thuật sau khi **tái kiến trúc toàn bộ (Phase 0–5)** nhằm loại bỏ Supabase, chuyển sang hệ thống tự host trên Coolify.

## 1. Tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Extension                                        │
│  ┌──────────────┐    ┌───────────────────────┐              │
│  │  Frontend    │    │  Chrome Extension     │              │
│  │  (Vite/React)│    │  (MV3 Side-panel,     │              │
│  │  Static SPA  │    │   New Tab, Widget,    │              │
│  │              │    │   Text-selector)      │              │
│  └──────┬───────┘    └──────────┬────────────┘              │
│         │  REST + SSE (JWT)     │  REST (JWT)               │
└─────────┼───────────────────────┼───────────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Fastify + TypeScript)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/v1/auth    Auth (signup/login/refresh/logout)  │   │
│  │  /api/v1/db/*    Data Gateway (query/insert/update/  │   │
│  │                  delete), user-scoped                 │   │
│  │  /api/v1/tasks|habits|goals|journal|notes  CRUD      │   │
│  │  /api/v1/functions/*  AI endpoints (proxy, SSE)      │   │
│  │  /api/v1/agent-tokens  API key cho AI agent          │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐    ┌────────────────────┐                  │
│  │ PostgreSQL  │    │  AI Gateway        │                  │
│  │ (Drizzle)   │    │  (Gemini/OpenAI)   │                  │
│  │ 18 tables   │    │  server-side key   │                  │
│  └─────────────┘    └────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Stack công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | Vite 5 + React 18 + TypeScript + Tailwind + shadcn/ui |
| State management | Zustand + localStorage (local-first) |
| Backend | Fastify 4 + TypeScript + Drizzle ORM |
| Database | PostgreSQL 16 |
| AI | OpenAI-compatible gateway (mặc định Gemini 2.5 Flash) |
| Auth | JWT access (15 phút) + refresh token (30 ngày, hash sha256, xoay vòng) |
| Hashing password | argon2 |
| Container | Docker (multi-stage build) |
| CI/CD | GitHub Actions → GHCR |
| Hosting | Coolify (docker-compose) |

## 3. Database — 18 bảng

```
users, refresh_tokens, password_reset_tokens, agent_tokens,
profiles, user_settings, user_roles,
tasks, subtasks, task_tags,
habits, habit_completions,
goals, goal_milestones,
journal_entries, journal_tags,
notes, note_tags
```

Enum: `app_role`, `life_area`, `task_priority`, `task_status`, `recurring_frequency`, `habit_frequency`, `goal_status`.

Tên bảng & cột giữ nguyên từ schema Supabase cũ (trừ auth) → script migrate dump dữ liệu cũ khớp thẳng.

## 4. Authentication & phân quyền

- **Đăng ký/đăng nhập** qua `/api/v1/auth/signup|login` → trả `accessToken` + `refreshToken`.
- **Refresh** qua `/api/v1/auth/refresh` → xoay token mới, vô hiệu token cũ (hash sha256 trong DB).
- **Mọi endpoint** (trừ auth) yêu cầu `Authorization: Bearer <accessToken>`.
- **Phân quyền**: mọi query auto-scope theo `user_id` từ JWT (thay thế RLS cũ). User A **không thể** đọc/sửa dữ liệu của User B.
- **API key cho AI agent**: dạng `lifeos_<prefix>_<secret>`, dùng chung header Bearer. Chỉ lưu prefix + hash, không lưu plaintext.

## 5. Data Gateway (thay PostgREST + RLS)

Backend expose `/api/v1/db/query|insert|update|delete` — gateway tổng quát:
- Nhận tham số: `table`, `select` (cột), `filters`, `data`, `order`, `limit`…
- Tự thêm điều kiện `user_id = <jwt.sub>` phía server (thay RLS).
- Chỉ cho phép các bảng đã đăng ký trong `dbRegistry` → tránh truy cập bảng hệ thống.
- Bảng chưa port (admin, phụ) → trả `{data: [], error: null}` (no-op) để app không crash.

Frontend gọi gateway qua **query builder shim** (`queryBuilder.ts`) có API giống Supabase (`supabase.from('tasks').select('*').eq('status','active')`), nội bộ convert sang POST request.

## 6. AI endpoints (thay Edge Functions)

7 endpoint đã port:

| Endpoint | Mô tả | Kỹ thuật |
|----------|--------|----------|
| `/functions/ai-coach` | Chat với AI Coach, stream (SSE) | `text/event-stream`, dùng userContext |
| `/functions/ai-suggest` | Gợi ý task/habit/routine | JSON (tool-calling) |
| `/functions/ai-template-generate` | Tạo template cho note/habit | JSON |
| `/functions/ai-translate` | Dịch văn bản | JSON |
| `/functions/vision-values-suggest` | Gợi ý tầm nhìn & giá trị | JSON |
| `/functions/ai-theme-suggest` | Gợi ý theme UI | JSON |
| `/functions/send-email` | Gửi email (cần provider) | Resend / SMTP |

**An toàn**: API key AI nằm ở server (`AI_GATEWAY_API_KEY` / `GEMINI_API_KEY`). Client không bao giờ giữ key. Đổi provider chỉ cần thay env (Gemini → OpenAI → Lovable…).

## 7. Extension (Chrome MV3)

- Side-panel, New tab, Widget, Text-selector.
- Đã gỡ hẳn Supabase anon key & PostgREST. Giờ gọi REST API qua `extension/api.js` (Bearer JWT từ `lifeos.session` storage).
- `config.js` chứa `appUrl` + `apiUrl` (mặc định production; dev local override qua `chrome.storage.local`).

## 8. Frontend — kiến trúc sau refactor

```
src/
├── integrations/api/     # client shim (auth, queryBuilder, functions/rpc)
├── hooks/sync/           # sync nền (Zustand + REST API)
├── pages/                # React Router (dashboard, tasks, habits, goals, journal, notes, ai…)
├── components/           # shadcn/ui components, AI chat, sidebars…
└── stores/               # Zustand stores (local-first, sync lên backend)
```

- `client.ts` khởi tạo API client (`API_URL` = `VITE_API_URL`).
- `queryBuilder.ts` giả lập interface Supabase (`from().select().eq().insert()…`).
- `functions.invoke()` / `rpc()` gọi backend `/functions/*` và `/rpc/:fn`.
- Không còn import Supabase JS library nào (`@supabase/supabase-js` đã xóa).

## 9. Tóm tắt các Phase đã triển khai

| Phase | Nội dung | PR |
|-------|----------|-----|
| 0 | Dọn dẹp repo, restructure (frontend/ extension/ db/ legacy/ docs/) | #3 |
| 1 | Backend: schema 18 bảng, auth JWT + refresh, CRUD, agent tokens, Swagger | #4 |
| 2 | Frontend data layer: gỡ Supabase, viết query builder shim + data gateway, no-op bảng chưa port | #5 |
| 3 | AI endpoints: port 7 edge functions, proxy AI server-side, SSE streaming | #6 |
| 4 | Extension: gỡ Supabase/anon key, dùng REST API + config.js | #7 |
| 5 | Build & Deploy: Dockerfile, GitHub Actions → GHCR, Coolify compose, migrate data dump | #8 |

## 10. So sánh kiến trúc cũ vs. mới

| Khía cạnh | Cũ (Supabase) | Mới |
|-----------|---------------|-----|
| Auth | GoTrue (Supabase Auth) | JWT tự quản (argon2 + refresh xoay) |
| Database access | PostgREST + RLS (187 policies) | Data gateway + server-side user_id scope |
| AI | Edge Functions (giữ key ở Deno Deploy) | REST endpoint server-side proxy |
| Deployment | Supabase local (Kong/GoTrue/PostgREST/Studio…) | Postgres + 1 backend container |
| Tài nguyên server | ~1.5GB RAM cho bộ Supabase | ~256MB (Postgres + backend + static frontend) |
| Extension auth | anon key + PostgREST trực tiếp | JWT + REST API |
| Frontend bundle | import `@supabase/supabase-js` (50KB+) | 0 external auth lib |

Xem thêm: [SETUP.md](./SETUP.md) (cài đặt), [USAGE.md](./USAGE.md) (sử dụng), [DEPLOYMENT.md](./DEPLOYMENT.md) (triển khai).
