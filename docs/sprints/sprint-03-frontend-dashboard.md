# Sprint 03 — Frontend & dashboard

| | |
|---|---|
| **Period** | 2026-07-19 → 2026-07-26 (closed) |
| **Status** | Complete |
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
| DEV-92 | Interactive world map with React Leaflet | Done |
| DEV-93 | Confirmed cases time-series chart | Done |
| DEV-94 | Freshness footer, loading and error states | Done |
| DEV-95 | Frontend acceptance, ci-web, and Sprint 03 close | Done |

---

## Deliverables

### Documentation & shell

- [x] Sprint 03 record and index updated ([docs/sprints/README.md](./README.md))
- [x] Dashboard page shell replaces Next.js starter in `web/` ([ARCHITECTURE.md](../ARCHITECTURE.md) §7.1)
- [x] Reserved regions for map, KPIs, and chart
- [x] English UI copy; responsive layout baseline (REQ-F-50, REQ-F-53)
- [x] `NEXT_PUBLIC_API_URL` documented in `web/.env.example`

### Dashboard features

- [x] Typed client `web/lib/api/` (API_SPEC §10) — merged to `develop` (DEV-89)
- [x] Selection context — global vs country ISO2, `selectCountry` / `clearSelection` (DEV-90)
- [x] KPI panel — confirmed cases, deaths, new cases daily (REQ-F-30–33; G-01 fallback) (DEV-91)
- [x] Country selection drives KPIs, map, and chart (REQ-F-22, REQ-F-41)
- [x] React Leaflet map — **choropleth** by `casesTotal` (REQ-F-20–23, ADR-005)
- [x] Time-series chart — confirmed cases (REQ-F-40–43) (DEV-93)
- [x] Loading, error states, sync freshness footer (REQ-F-51–52) (DEV-94)
- [x] `ci-web.yml` and M4 acceptance gate (REQ-NF-05) (DEV-95)

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

## Acceptance checklist (DEV-95)

Evidence from local verification (2026-07-26) and Vitest suite on `develop` + this branch.

| Requirement | Evidence |
|-------------|----------|
| REQ-F-20–23 — Interactive map, country-level choropleth, click selection | `WorldMapPanel` + `web/lib/map/`; Vitest join/scale tests; manual UI flow in [SETUP.md §9](../SETUP.md#dashboard-acceptance-smoke-dev-95) |
| REQ-F-30–33 — KPI panel ≥3 metrics, global + country | `KpiPanel` + `web/lib/kpis/`; 124 Vitest tests pass |
| REQ-F-40–42 — Time-series confirmed cases | `CasesTimeSeriesPanel` + Recharts; selection-driven fetch |
| REQ-F-22, REQ-F-24 — Selection drives KPIs/chart; clear → global | `DashboardSelectionProvider`; selection unit tests |
| REQ-F-51 — Loading + error states | `LoadingState`, `ErrorState`, shared fetch helpers |
| REQ-F-52 — Footer data source + last sync | `DashboardFooter` → `GET /sync/status` |
| REQ-F-53 — English UI | All dashboard copy in English |
| REQ-F-50 — Responsive ≥375px | Tailwind layout; no horizontal scroll at mobile breakpoint |
| REQ-NF-01, REQ-NF-02 — No upstream secrets in `web/` | Only `NEXT_PUBLIC_API_URL` in client config |
| REQ-NF-05 — Web CI quality gate | `.github/workflows/ci-web.yml` (lint / test / build) |

### API smoke (local, synced DB)

All endpoints returned **200** against running API on `localhost:3001`:

```
200 /health
200 /covid/summary
200 /covid/countries
200 /covid/series?metric=casesTotal
200 /sync/status
200 /covid/countries/US
200 /covid/countries/US/series?metric=casesTotal
```

### Web CI (local)

```
cd web && npm run lint && npm test && npm run build
```

- Lint: pass  
- Test: 19 files, 124 tests pass  
- Build: Next.js production build pass  

---

## Outcomes

### Shipped

- Dashboard shell (`web/components/dashboard/`, `web/app/page.tsx`) — DEV-88
- Typed internal API client (`web/lib/api/`) + Vitest unit tests — DEV-89
- Dashboard selection context (`web/lib/dashboard/selection.ts`, `DashboardSelectionProvider`, `SelectionChrome`) — DEV-90
- KPI panel (`web/components/kpis/`, `web/lib/kpis/`) — global/country fetch, loading/error, abort on selection change — DEV-91
- World map (`web/components/map/`, `web/lib/map/`, `public/geo/countries-110m.geojson`) — choropleth, pan/zoom, tooltips, click → selection, `dynamic` SSR off — DEV-92
- Confirmed cases time-series chart (`web/components/charts/`, `web/lib/charts/`, Recharts) — global/country series, empty state, selection-driven fetch — DEV-93
- Freshness footer + shared loading/error UX (`web/lib/sync/`, `web/components/ui/`, `DashboardFooter` → `GET /sync/status`) — DEV-94
- GitHub Actions `ci-web.yml` (lint / unit / build) + sprint closure docs — DEV-95

### M4 criteria

| Criterion | Evidence |
|-----------|----------|
| Map country-level viz | Choropleth map on dashboard; `GET /covid/countries` |
| KPI panel ≥3 metrics | Confirmed cases, deaths, new cases daily — global + country |
| Minimum time-series chart | Confirmed cases line chart — global + country |
| Dashboard MVP on **develop** | Full stack smoke documented in SETUP.md |
| Staging URL | **Deferred** to Phase 5 / M5 deploy — product surface proven locally |

### Verification commands

```bash
cd web
npm run lint
npm test
npm run build
```

Full-stack smoke: [SETUP.md §9 — Dashboard acceptance smoke](../SETUP.md#dashboard-acceptance-smoke-dev-95).

### Deferred / next

- Phase 5 — staging/production hosting, DNS, deploy workflows, `v0.1.0` (M5)
- Staging URL in DEPLOYMENT.md §14 (M4 deploy gap)
- Daily production sync cron (REQ-F-04) — HTTP trigger only through Sprint 03
- Optional: enable `web` as required GitHub status check after first green CI run on `develop`

---

## Release

Feature work merges to `develop`. Production release remains at milestone M5 (`v0.1.0`).

| Item | Value |
|------|-------|
| Integration branch | `develop` |
| Feature PR | DEV-95 → `develop` (this card) |
| Promote PR | Optional sprint ritual — `develop` → `main` when team chooses |
| Release tag | N/A (Sprint 03) |
| Staging / production deploy | Deferred to Phase 5 |

Prior feature PRs (DEV-88–94) merged to `develop` before this close card.

---

## Retrospective

- **Went well:** Clear split between pure logic in `web/lib/` (Vitest-friendly, CI-fast) and Leaflet/Recharts panels loaded via `dynamic()`; selection context kept map, KPIs, and chart in sync without prop drilling; reusing Sprint 02 API contract meant frontend cards could ship in parallel once DEV-89 landed.
- **Improve:** Add visual/regression tests or Playwright smoke for map click + clear-selection before staging deploy. Coordinate branch protection for `web` job only after Actions is green on `develop`. Consider `turbopack.root` in Next config if root-level lockfiles appear outside `web/`.
- **Schedule / risk changes:** M4 **product criteria met on `develop`**; staging URL remains open until Phase 5. Phase 5 (CI/CD deploy, staging + production, `v0.1.0`) is next per [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md).

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) | Phases, milestones |
| [sprint-02-backend-data-layer.md](./sprint-02-backend-data-layer.md) | Previous sprint |
| [REQUIREMENTS.md](../REQUIREMENTS.md) | REQ-F-20–53, REQ-NF-05 |
| [SETUP.md](../SETUP.md) | Local + acceptance smoke |
| [DEPLOYMENT.md](../DEPLOYMENT.md) | CI/CD target state |
