# LifeOS Backend API

Standalone REST API for LifeOS, replacing Supabase (GoTrue auth, PostgREST, RLS).
Built with **Fastify + TypeScript + Drizzle ORM + PostgreSQL**. It serves both the
LifeOS frontend/extension and external **AI agents**.

> Phase 1 of the re-architecture. See the repo root `README.md` for the full roadmap.

## Stack

- **Fastify 4** — HTTP server, JSON-schema request validation
- **Drizzle ORM** — typed schema + SQL migrations (`drizzle-kit`)
- **PostgreSQL** — standalone database (table/enum names match the old Supabase schema for data compatibility)
- **argon2** — password hashing
- **jsonwebtoken** — short-lived JWT access tokens + opaque, hashed, rotating refresh tokens
- **@fastify/swagger(+ui)** — OpenAPI docs at `/documentation`

## Getting started

```bash
cp .env.example .env          # fill in DATABASE_URL + JWT secrets
npm install
npm run db:generate           # generate SQL migrations from the Drizzle schema (already committed)
npm run db:migrate            # apply migrations to the database
npm run dev                   # start with hot reload (http://localhost:4000)
```

OpenAPI UI: http://localhost:4000/documentation

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server (`node dist/index.js`) |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint (`no-explicit-any` enforced) |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate` | Apply pending migrations |

## Authentication

Two ways to authenticate, both via `Authorization: Bearer <token>`:

1. **Users (JWT)** — `POST /api/v1/auth/signup` / `login` return an `accessToken`
   (15 min) and a `refreshToken` (30 days, rotated on every `/auth/refresh`).
2. **AI agents** — long-lived tokens of the form `lifeos_<prefix>_<secret>`, created
   by an authenticated user via `POST /api/v1/agent-tokens`. Only the prefix and a
   sha256 hash are stored; the raw token is shown once.

Authorization is enforced per-request (every query is scoped to the authenticated
`user_id`), which replaces the old Supabase RLS policies.

## API surface (Phase 1)

All routes are under `/api/v1`.

- `auth`: `signup`, `login`, `refresh`, `logout`, `me`, `update`, `reset-password/request`, `reset-password/confirm`
- `agent-tokens`: list / create / revoke
- `profile`, `settings`: get / update
- `tasks`: list / get / create / update / delete (+ subtasks read)
- `habits`: CRUD + `:id/completions`
- `goals`: CRUD + `:id/milestones`
- `journal`: list / create / update / delete
- `notes`: list / create / update / delete

Remaining tables (~30) and AI/edge-function endpoints are intentionally deferred to
later phases so each PR stays reviewable.

## Docker

```bash
docker build -t lifeos-backend .
docker run --rm -p 4000:4000 --env-file .env lifeos-backend
```

Run migrations in the container with `node dist/db/migrate.js`.
