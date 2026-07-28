# Sprint 04 — Analytics discovery UX

| | |
|---|---|
| **Period** | 2026-07-28 → 2026-08-11 (target) |
| **Status** | Planned |
| **Sprint goal** | Make the global dataset understandable on entry — all countries visible, clickable, and searchable; replace confusing QA-only controls with honest coverage messaging |
| **Milestone** | Post-MVP product (no new M-id; supports M4 narrative) |
| **Phase** | Post-MVP (see [ROADMAP-POST-MVP.md](./ROADMAP-POST-MVP.md)) |

---

## Problem statement

New users see ~196 countries on the map but only **5 countries** in the QA dropdown and full charts for **12**. Without explanation this feels broken. Sprint 04 fixes **discovery and trust** without expanding upstream ingest yet.

---

## Scope

Work is tracked in **Linear** (`DEV-XX`). Feature branches target `develop`.

| Card | Title | Status |
|------|-------|--------|
| DEV-96 | Open Sprint 04 record and roadmap index | Planned |
| DEV-97 | Data coverage banner (map vs chart scope) | Planned |
| DEV-98 | Global top-10 countries panel (cases/deaths) | Planned |
| DEV-99 | Searchable country list synced with map selection | Planned |
| DEV-100 | URL country selection (`?country=ISO2`) | Planned |
| DEV-101 | Sprint 04 close and acceptance | Planned |

---

## Deliverables

### Documentation

- [ ] [ROADMAP-POST-MVP.md](./ROADMAP-POST-MVP.md) and sprint index updated
- [ ] Copy guidelines in header/footer for historical data cutoff (~2023-03)

### UX — global clarity

- [ ] **Coverage banner** — e.g. “Map & KPIs: {N} countries · Full daily chart: {M} countries · Reference: {date}”
- [ ] Remove or demote QA-only `<select>`; replace with production country picker fed by `GET /covid/countries`
- [ ] **Top 10 panel** — sortable table or cards (cases total, deaths total, new cases) from country list API
- [ ] Map click + list click + search share one selection context ([REQ-F-22](../REQUIREMENTS.md))

### UX — shareable state

- [ ] `?country=BR` in URL ↔ `DashboardSelectionProvider` (read on load, write on change)
- [ ] Invalid ISO2 in URL → global view + non-blocking message

### Empty states (no ingest change)

- [ ] Country with snapshot only → KPIs work; chart shows explicit “No daily series ingested for {country}” with link to list of chart-ready countries

---

## Out of scope (Sprint 04)

- Peak-day insights API (Sprint 05)
- Expanding `PRIORITY_SERIES_COUNTRIES` (Sprint 06)
- Monthly aggregation / date range UI (Sprint 07)
- Production deploy

---

## Technical notes

| Area | Approach |
|------|----------|
| Country list | Reuse `GET /covid/countries`; client-side sort/filter for top 10 |
| URL state | `useSearchParams` + `router.replace` (shallow) in App Router |
| Tests | Vitest for sort/filter helpers; no new API e2e required |
| a11y | Listbox/combobox pattern; keyboard select country |

---

## Acceptance criteria

- [ ] First-time user can explain global vs country view in < 30 s (informal test)
- [ ] All ~196 API countries selectable via map **or** search/list
- [ ] Top 10 visible without selecting a country
- [ ] Coverage banner numbers match API responses
- [ ] `cd web && npm run lint && npm test && npm run build` pass
- [ ] No secrets in `web/`

---

## Verification

```bash
cd web && npm run lint && npm test && npm run build
# Manual: open / → top 10 visible → search Peru → KPIs update → chart empty state honest
# Manual: open /?country=BR → Brazil selected → refresh keeps selection
```

---

## Release

| Item | Value |
|------|-------|
| Integration branch | `develop` |
| Release tag | N/A (post-MVP iteration) |
| Promote PR | Optional `develop` → `main` at sprint close |

---

## Retrospective

*To be completed at sprint close.*

- **Went well:** …
- **Improve:** …
- **Schedule / risk changes:** …
