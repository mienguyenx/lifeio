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
└── mobile/           # Mobile app (Expo / React Native)
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
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

### Docker Build

```bash
cd web
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  -t lifeos-app .
docker run -p 80:80 lifeos-app
```

### Docker Compose (with Traefik + Cloudflare Tunnel)

```bash
cd web
cp env.example .env    # Fill in all values
docker compose up -d
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `VITE_GOOGLE_API_KEY` | No | Google API key |
| `CLOUDFLARE_TUNNEL_TOKEN` | No | Cloudflare Tunnel token (for docker-compose) |

## License

Private project.
