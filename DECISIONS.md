# Decisions

One line per decision, with the reason.

- Frontend and backend are separate repositories that share no code: the owner's standard layout. Shared definitions (permission matrix, plans, Zod schemas) are duplicated in `src/lib/shared/` and must be kept in sync with `tenantkit-backend/src/shared/`.
- The spec lives at `requirements/PROJECT_REQUIREMENTS.md` (not `SPEC.md`): the owner's standard layout.
- Next.js 15 (fixed by spec) with React 19, Tailwind v4 and hand-written shadcn/ui-style components on Radix primitives: avoids the interactive shadcn CLI while keeping the same component model.
- The browser only talks to the web origin; Next rewrites proxy `/api/v1/*` and `/uploads/*` to the backend. This keeps the httpOnly refresh cookie first-party and removes browser CORS concerns.
- Rewrites are resolved at build time, so `API_INTERNAL_URL` is a Docker build argument (default `http://api:4000`).
- The frontend compose joins the external `tenantkit-net` network created by the backend compose, so the two repos run together without sharing files.
- Access token is held in memory only; on page load the app calls `/auth/refresh` (cookie) to obtain one, so no token is ever stored in localStorage.
