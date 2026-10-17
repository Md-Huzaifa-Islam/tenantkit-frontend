# Upwork portfolio kit — TenantKit

## Title
TenantKit: Multi-Tenant SaaS Platform | Next.js, NestJS, PostgreSQL RLS, Stripe

## Case study

**Problem:** Every SaaS MVP needs teams, roles, billing and strict data isolation. Building these per project is slow and error-prone.

**Approach:** I built a reusable foundation with Postgres row-level security, a central permission matrix, idempotent Stripe webhooks and a full audit log, all covered by an automated isolation test suite.

**Result:** 181 automated backend tests, including 53 cross-tenant attack cases (20 at the database layer, 33 through the API), all passing, plus Playwright end-to-end flows and Lighthouse scores of 100 / 100 / 100 on desktop. New SaaS projects start with auth, teams and billing done on day one.

## Skills to tag
Next.js · NestJS · TypeScript · PostgreSQL · Row-Level Security · Prisma · Stripe · Docker · RBAC · Multi-tenant SaaS · Playwright

## Loom script (≈75 s)
1. **Sign up** → a workspace is created (show the welcome email in `/dev/mailbox`).
2. **Invite a teammate** → open the invite from the dev mailbox in a private window → they join as a member (the "New project" button is hidden for them).
3. **Kanban**: drag a task across columns; open a task, assign it, set a due date.
4. **Hit the Free limit** (4th project) → upgrade prompt → **mock Stripe checkout** → Pro → limit lifted.
5. **Audit log**: show `billing.plan_changed`, `member.invited`, `member.joined` with actor and IP; filter by action.
6. **Admin panel** (`admin@tenantkit.dev`): MRR, workspaces, suspend one, "View as owner" (read-only banner).
7. **Terminal**: `pnpm test` in the backend → isolation and RLS suites passing.

## Still needed from you
- A live demo URL (nothing is deployed yet), the Loom recording, and uploading the screenshots in `docs/screenshots/`.
