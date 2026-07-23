# Sprint 03 — Frontend & dashboard

| | |
|---|---|
| **Period** | 2026-07-19 → 2026-08-28 (target) |
| **Status** | In progress |
| **Sprint goal** | Deliver the public COVID-19 dashboard in `web/` — map, KPIs, and time-series chart against the internal REST API (M4) |
| **Milestone** | [M4](../PROJECT_MANAGEMENT.md#milestones) — dashboard MVP on staging |
| **Phase** | 4 |

---

## Scope

Work is tracked in **Linear** (`DEV-XX`). Feature branches target `develop` per [CONTRIBUTING.md](../../CONTRIBUTING.md).

| Card | Title | Status |
|------|-------|--------|
| DEV-88 | Open Sprint 03 record and dashboard shell | Done |
| DEV-89 | Typed internal API client for web | Done |
| DEV-90 | Dashboard selection state and global context | Done |
| DEV-91 | KPI panel (global and country) | Done |
| DEV-92 | Interactive world map with React Leaflet | In progress |
| DEV-93 | Confirmed cases time-series chart | Planned |
| DEV-94 | Freshness footer, loading and error states | Planned |
| DEV-95 | Frontend acceptance, ci-web, and Sprint 03 close | Planned |

---

## Deliverables

### Documentation & shell

- [x] Sprint 03 record and index updated ([docs/sprints/README.md](./README.md))
- [x] Dashboard page shell replaces Next.js starter in `web/` ([ARCHITECTURE.md](../ARCHITECTURE.md) §7.1)
- [x] Reserved regions for map, KPIs, and chart (placeholders until cards 4–6)
- [x] English UI copy; responsive layout baseline (REQ-F-50, REQ-F-53)
- [x] `NEXT_PUBLIC_API_URL` documented in `web/.env.example`

### Dashboard features (later cards)

- [x] Typed client `web/lib/api/` (API_SPEC §10) — merged to `develop` (DEV-89)
- [x] Selection context — global vs country ISO2, `selectCountry` / `clearSelection` (DEV-90)
- [x] KPI panel — confirmed cases, deaths, new cases daily (REQ-F-30–33; G-01 fallback) (DEV-91)
- [ ] Country selection drives chart (REQ-F-22 partial — KPIs wired; map/chart DEV-92–93)
- [ ] React Leaflet map — choropleth or markers (REQ-F-20–23, ADR-005)
- [ ] Time-series chart — confirmed cases (REQ-F-40–43)
- [ ] Loading, error states, sync freshness footer (REQ-F-51–52)
- [ ] `ci-web.yml` and M4 acceptance gate (REQ-NF-05)

---

## Prerequisites (from Sprint 02)

| Artifact | Status |
|----------|--------|
| Internal REST API on `develop` (API_SPEC §6–7) | Available |
| [ARCHITECTURE.md](../ARCHITECTURE.md) §7–8 | Available |
| [REQUIREMENTS.md](../REQUIREMENTS.md) Phase 4 (REQ-F-20–53) | Available |
| [SETUP.md](../SETUP.md) — `web/` ports and env | Available |
| `web/` dashboard shell + `web/lib/api/` | Available |

---

## Outcomes

*To be completed at sprint close.*

### Shipped

- Dashboard shell (`web/components/dashboard/`, `web/app/page.tsx`) — DEV-88
- Typed internal API client (`web/lib/api/`) + Vitest unit tests — DEV-89
- Dashboard selection context (`web/lib/dashboard/selection.ts`, `DashboardSelectionProvider`, `SelectionChrome`) — DEV-90
- KPI panel (`web/components/kpis/`, `web/lib/kpis/`) — global/country fetch, loading/error, abort on selection change — DEV-91

### Deferred / next

- Phase 5 deploy (staging/production, `v0.1.0`)

---

## Release

Feature work merges to `develop`. Production release remains at milestone M5 (`v0.1.0`).

| Item | Value |
|------|-------|
| Integration branch | `develop` |
| Release tag | N/A (Sprint 03) |
| Staging / production deploy | N/A (Phase 5) |

---

## Retrospective

*To be completed at sprint close.*

- **Went well:** …
- **Improve:** …
- **Schedule / risk changes:** …
