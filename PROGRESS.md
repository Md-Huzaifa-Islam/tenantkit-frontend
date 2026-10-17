# Progress

## Phase 1 — Scaffold (2026-10-17)
- Done: Next.js 15 skeleton, theme tokens with dark mode, providers, health route, API proxy rewrites, Dockerfile (standalone), compose on `tenantkit-net`, CI.
- Verified: `pnpm lint`, `pnpm typecheck`, `docker compose up` → web healthy; `GET /api/v1/health/ready` through the web origin reaches the backend container and its database.
- Next: Phase 8 (after backend phases 2–7) — API client, auth pages, dashboard shell.

## Phase 8 — Auth & shell (2026-10-17)
- Done: API client (in-memory token, single-flight refresh, error mapping), AuthProvider (session restore via refresh cookie + `tk_session` hint), login/signup/forgot/reset/verify/invite pages, shadcn-style UI kit, dashboard shell (sidebar, switcher, user menu, theme, mobile drawer, banners, upgrade prompt).

## Phase 9 — Features (2026-10-17)
- Done: projects list, Kanban (dnd-kit, keyboard support, optimistic + rollback), task dialog, settings (general/logo/transfer/delete, members/invites, billing with usage meters, audit log with filters), mock checkout/portal, super-admin panel with read-only impersonation, dev mailbox.

## Phase 10 — Polish & delivery (2026-10-17)
- Verified: lint, typecheck, 13 Vitest tests, production build; Docker web container healthy against the backend stack; Playwright 3/3 flows (9/9 over 3 repeats); Lighthouse dashboard desktop 100/100/100, mobile 94/100/100 (`docs/lighthouse.md`); visual check of desktop, dark mode and 375 px screenshots.
- Done: README with screenshots and architecture, `docs/architecture.md`, `docs/PORTFOLIO.md` (Upwork title, case study with real numbers, Loom script), CI e2e job.
- Remaining (needs the owner): live demo URL, Loom recording.
