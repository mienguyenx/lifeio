# LifeIO

Personal life management platform — track habits, tasks, goals, journals, and more.

## Project Structure

```
lifeio/
├── web/              # Main web app (Vite + React + TypeScript + shadcn-ui)
│   ├── src/          # Application source code
│   ├── extension/    # Chrome extension
│   ├── supabase/     # Supabase functions & migrations
│   ├── Dockerfile    # Multi-stage Docker build (Node → nginx)
│   └── docker-compose.yml
├── api/              # REST API backend (Express + TypeScript)
│   ├── src/          # API source code
│   ├── Dockerfile    # Docker build for API service
│   └── supabase/     # API-specific migrations
└── mobile/           # Mobile app (Expo / React Native)
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **API**: Express, TypeScript, JWT + API Key auth, Swagger
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment**: Docker, nginx, Coolify, Traefik, Cloudflare Tunnel

## Quick Start

### Web App (Local Development)

```bash
cd web
cp env.example .env    # Configure your Supabase credentials
npm install
npm run dev            # http://localhost:3222
```

### API Backend (Local Development)

```bash
cd api
cp env.example .env    # Configure Supabase service key
npm install
npm run dev            # http://localhost:3001
```

API docs available at `http://localhost:3001/docs` (Swagger UI).

### Docker Build

```bash
# Web app
cd web
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  -t lifeos-app .

# API
cd api
docker build -t lifeos-api .
```

### Docker Compose (with Traefik + Cloudflare Tunnel)

```bash
cd web
cp env.example .env    # Fill in all values
docker compose up -d
```

## API Authentication

The API supports two authentication methods:

### 1. Supabase JWT Token

```bash
curl -H "Authorization: Bearer <supabase-jwt-token>" \
  http://localhost:3001/api/tasks
```

### 2. API Key (for AI agents)

Generate an API key via the API:

```bash
# Create API key (requires Supabase JWT)
curl -X POST http://localhost:3001/api/auth/api-keys \
  -H "Authorization: Bearer <supabase-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My AI Agent", "scopes": ["read", "write"]}'

# Use the API key
curl -H "X-API-Key: lio_..." http://localhost:3001/api/tasks
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get task details |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Soft-delete a task |
| GET | `/api/habits` | List habits |
| POST | `/api/habits` | Create a habit |
| PATCH | `/api/habits/:id` | Update a habit |
| DELETE | `/api/habits/:id` | Soft-delete a habit |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create a goal |
| PATCH | `/api/goals/:id` | Update a goal |
| DELETE | `/api/goals/:id` | Soft-delete a goal |
| GET | `/api/journal` | List journal entries |
| POST | `/api/journal` | Create journal entry |
| PATCH | `/api/journal/:id` | Update journal entry |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/auth/api-keys` | List API keys |
| POST | `/api/auth/api-keys` | Create API key |
| DELETE | `/api/auth/api-keys/:id` | Revoke API key |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes (web) | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes (web) | Supabase anon/public key |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `VITE_GOOGLE_API_KEY` | No | Google API key |
| `SUPABASE_URL` | Yes (api) | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes (api) | Supabase service role key |
| `CLOUDFLARE_TUNNEL_TOKEN` | No | Cloudflare Tunnel token |

## License

Private project.
