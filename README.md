# TenantKit — Frontend (Web)

Next.js 15 dashboard for **TenantKit**, a multi-tenant SaaS starter: workspaces, members and
invites, Kanban projects, billing, audit log and a super-admin panel.

> Work in progress — see [`PROGRESS.md`](PROGRESS.md) and [`docs/CHECKLIST.md`](docs/CHECKLIST.md).
> The API lives in the separate `tenantkit-backend` repository.

## Quick start (Docker)

Start the backend first (it creates the shared `tenantkit-net` Docker network), then:

```bash
docker compose up -d --build   # web on http://localhost:3000
```

The web server proxies `/api/v1/*` to the backend container (`API_INTERNAL_URL`, default `http://api:4000`).

## Local development

```bash
pnpm install
API_INTERNAL_URL=http://localhost:4000 pnpm dev
```
