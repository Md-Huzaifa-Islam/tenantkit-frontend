# Progress

## Phase 1 — Scaffold (2026-10-17)
- Done: Next.js 15 skeleton, theme tokens with dark mode, providers, health route, API proxy rewrites, Dockerfile (standalone), compose on `tenantkit-net`, CI.
- Verified: `pnpm lint`, `pnpm typecheck`, `docker compose up` → web healthy; `GET /api/v1/health/ready` through the web origin reaches the backend container and its database.
- Next: Phase 8 (after backend phases 2–7) — API client, auth pages, dashboard shell.
