# TenantKit Frontend — Checklist

Spec: `requirements/PROJECT_REQUIREMENTS.md` (full product spec; this repo covers the web app).
Companion repo: `tenantkit-backend`. Legend: `[ ]` pending · `[~]` in progress · `[x]` done & verified · `[!]` blocked.

### Phase 1 — Scaffold
- [x] Next.js 15 App Router, TypeScript, Tailwind v4, pnpm, ESLint/Prettier
- [x] Theme tokens (light/dark), providers (TanStack Query, next-themes, sonner)
- [x] `/api/health` route; `/api/v1/*` proxied to the backend
- [x] Dockerfile (standalone output, non-root, healthcheck) + compose joining `tenantkit-net`
- [x] `.env.example`, GitHub Actions CI (lint, typecheck, test, build, Docker build)

### Phase 8 — Auth & shell
- [x] API client with access-token refresh, auth context
- [x] `/login`, `/signup`, `/forgot`, `/reset`, `/verify`, `/invite/[token]`
- [x] Dashboard layout: sidebar, workspace switcher, user menu, dark mode toggle

### Phase 9 — Features
- [x] `/[workspace]/projects`, `/[workspace]/projects/[id]` Kanban (drag & drop)
- [x] Settings: general (logo), members (+ invites), billing (upgrade prompt), audit log (filters)
- [x] `/admin`, `/dev/mailbox`
- [x] Permission-aware UI (hide disallowed actions)

### Phase 10 — Polish & delivery
- [x] Mock checkout/portal pages, read-only impersonation UI, unit tests (Vitest)
- [x] CI e2e job (runs when repos are public or a token is configured)
- [x] Playwright: signup→project→task; invite→accept; upgrade via mock checkout
- [x] Empty states, skeletons, toasts, responsive to 375 px
- [x] Lighthouse ≥ 90 performance + accessibility (dashboard)
- [x] README with screenshot and architecture

## Acceptance (spec §13, frontend items)
- [x] Whole app works via Docker with no API keys
- [x] UI shows upgrade prompt at plan limits
- [x] Lighthouse ≥ 90 perf + a11y
- [x] README complete
