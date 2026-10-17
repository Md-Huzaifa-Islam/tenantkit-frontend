# Lighthouse results

Measured on 2026-10-17 against the Docker production build (`docker compose up`), signed in
as the demo owner with seeded data. Lighthouse 12, run by connecting to the Playwright
Chromium after logging in.

| Page | Preset | Performance | Accessibility | Best practices |
|------|--------|:-----------:|:-------------:|:--------------:|
| Dashboard `/acme/projects` | Desktop | **100** | **100** | **100** |
| Dashboard `/acme/projects` | Mobile (throttled 4G, 4× CPU) | **94** | **100** | **100** |
| Kanban `/acme/projects/[id]` | Desktop | **100** | **100** | **100** |
| Kanban `/acme/projects/[id]` | Mobile (throttled 4G, 4× CPU) | **94** | **100** | **100** |

The spec requires ≥ 90 for performance and accessibility on the dashboard.

Notes:
- The remaining mobile opportunity is largest contentful paint (~3.0 s under throttling). The dashboard is client-rendered after the session is restored, so the cards paint after one API round trip.
- Accessibility work included labelled form fields, `aria-current` navigation, a skip link, keyboard-operable drag and drop, labelled meters/progress bars and sufficient contrast in both themes.
