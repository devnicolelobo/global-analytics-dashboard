# Sprint 05 — Country insights & peaks

| | |
|---|---|
| **Period** | 2026-08-12 → 2026-08-25 (target) |
| **Status** | Planned |
| **Sprint goal** | Surface **critical moments** per country — peak daily deaths and cases — with API-backed insights and chart annotations |
| **Milestone** | Post-MVP product |
| **Phase** | Post-MVP |
| **Depends on** | [Sprint 04](./sprint-04-analytics-discovery-ux.md) (selection UX stable) |

---

## Problem statement

Users want to know *“when did it hurt most?”* — not only cumulative totals. Daily series exists in DB for **12 priority countries**; peaks must be computed server-side from persisted data and shown as **one-line insight + chart marker**.

---

## Scope

| Card | Title | Status |
|------|-------|--------|
| DEV-102 | Open Sprint 05 record | Planned |
| DEV-103 | `GET /covid/countries/:code/insights` + API_SPEC | Planned |
| DEV-104 | Peak insight card in dashboard UI | Planned |
| DEV-105 | Chart annotation (ReferenceLine/Dot) + deaths metric toggle | Planned |
| DEV-106 | Sprint 05 close and acceptance | Planned |

---

## Deliverables

### API ([API_SPEC.md](../API_SPEC.md) update required)

- [ ] **`GET /covid/countries/:code/insights`**
  - `coverage`: `{ from, to, pointCount, hasFullSeries }`
  - `peaks`: `{ deathsNew: { date, value } | null, casesNew: { date, value } | null }`
  - Computed from persisted daily metrics only (no live upstream)
- [ ] Unit tests for peak calculation pure functions in `api/src/covid/`
- [ ] e2e: known fixture country returns expected peak dates

### Web

- [ ] Typed client in `web/lib/api/`
- [ ] **Insight card** beside chart when country selected (or below KPIs)
- [ ] Recharts marker on peak day; toggle **Cases | Deaths** on chart (deaths series already ingested for priority set)
- [ ] Global view: hide insight card or show global peaks from `GET /covid/series` aggregation (optional — country-only acceptable for MVP of this sprint)

### Documentation

- [ ] EXTERNAL_APIS note: peaks derived from API Ninjas daily `new` fields

---

## Out of scope

- Expanding countries with series (Sprint 06)
- Monthly rollup (Sprint 07)
- Compare two countries on one chart

---

## Technical notes

```typescript
// Peak algorithm (pure)
// For each day in series: track max(deathsNew), max(casesNew)
// Ignore nulls; tie-break: earliest date
```

| Risk | Mitigation |
|------|------------|
| Country with 0–1 series points | Return `hasFullSeries: false`; UI defers to Sprint 04 empty state |
| Large series | Reuse existing series query; compute in service layer |

---

## Acceptance criteria

- [ ] Brazil (BR) shows peak deaths date matching manual spot-check on series API
- [ ] Country without series returns 200 with `hasFullSeries: false` (or 404 per API_SPEC convention — document choice)
- [ ] Chart toggles deaths/cases without breaking selection
- [ ] API + web CI green

---

## Verification

```bash
cd api && npm run lint && npm test && npm run test:e2e && npm run build
cd web && npm run lint && npm test && npm run build
curl http://localhost:3001/covid/countries/BR/insights
```

---

## Retrospective

*To be completed at sprint close.*
