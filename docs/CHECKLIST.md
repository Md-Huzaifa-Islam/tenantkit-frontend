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
- [ ] API client with access-token refresh, auth context
- [ ] `/login`, `/signup`, `/forgot`, `/reset`, `/verify`, `/invite/[token]`
- [ ] Dashboard layout: sidebar, workspace switcher, user menu, dark mode toggle

### Phase 9 — Features
- [ ] `/[workspace]/projects`, `/[workspace]/projects/[id]` Kanban (drag & drop)
- [ ] Settings: general (logo), members (+ invites), billing (upgrade prompt), audit log (filters)
- [ ] `/admin`, `/dev/mailbox`
- [ ] Permission-aware UI (hide disallowed actions)

### Phase 10 — Polish & delivery
- [ ] Playwright: signup→project→task; invite→accept; upgrade via mock checkout
- [ ] Empty states, skeletons, toasts, responsive to 375 px
- [ ] Lighthouse ≥ 90 performance + accessibility (dashboard)
- [ ] README with screenshot and architecture

## Acceptance (spec §13, frontend items)
- [ ] Whole app works via Docker with no API keys
- [ ] UI shows upgrade prompt at plan limits
- [ ] Lighthouse ≥ 90 perf + a11y
- [ ] README complete
