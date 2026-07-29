# Sprint 04 — Analytics discovery UX

| | |
|---|---|
| **Period** | 2026-07-28 → 2026-08-11 (target) |
| **Status** | In progress |
| **Sprint goal** | Make the global dataset understandable on entry — all countries visible, clickable, and searchable; replace confusing QA-only controls with honest coverage messaging |
| **Milestone** | Post-MVP product (supports M4 narrative; target release **v0.2.0** at Sprint 07) |
| **Phase** | Post-MVP (see [ROADMAP-POST-MVP.md](./ROADMAP-POST-MVP.md)) |

---

## Problem statement

New users see ~196 countries on the map but only **5 countries** in the QA dropdown and full daily charts for **12** priority countries. Without explanation this feels broken. Sprint 04 fixes **discovery and trust** without expanding upstream ingest yet.

---

## Scope

Work is tracked in **Linear** (`DEV-XX`). Feature branches target `develop` per [CONTRIBUTING.md](../../CONTRIBUTING.md).

| Card (Linear) | Title | Status |
|---------------|-------|--------|
| DEV-96 | Open Sprint 04 record and mark sprint in progress | Done |
| DEV-97 | Implement data coverage banner (map vs chart scope) | Done |
| DEV-98 | Implement global top-10 countries panel | Done |
| — | Implement searchable country list synced with map selection | Planned |
| — | Implement shareable country selection via URL query param | Planned |
| — | Implement honest empty state when country has no daily series | Planned |
| — | Close Sprint 04 with acceptance checklist and retrospective | Planned |

*Replace remaining `—` with Linear card IDs when assigned.*

---

## Quality and test strategy (Sprint 04)

Canonical bar for implementation cards 2–6. Reviewers use this section; close card (7) verifies compliance.

### Unit tests (Vitest — `web/lib/`)

- Pure helpers only: country sort/filter, top-N ranking, ISO2 URL parse/validate, coverage copy formatters
- Feed untrusted API-shaped fixtures; no DOM in unit tests
- Abort/timeout patterns stay in existing hooks — new code adds helpers, not duplicate fetch logic

### Edge and boundary tests (Vitest)

| Case | Expected behaviour |
|------|-------------------|
| Empty `/covid/countries` list | Top 10 + picker degrade gracefully (empty state, no throw) |
| API returns fewer than 10 countries | Top N shows available count only |
| Invalid `?country=` (lowercase, `BRA`, script tags, empty) | Global view; sanitized message; no fetch with raw param |
| Country with 0 vs 1 vs full series points | Chart empty state copy differs; KPIs still from snapshot |
| Missing/null metric fields | Existing `sanitizeDisplayText` paths; no NaN in rankings |

### Integration / component

- Prefer unit tests for Sprint 04; manual smoke for cross-panel selection sync
- Map click + list click + URL load must converge on same `DashboardSelectionProvider` state

### End-to-end

| Layer | Sprint 04 | Later |
|-------|-----------|-------|
| **Manual smoke** (required at sprint close) | Global → top 10 → search country → KPI/chart → `?country=` → clear | Documented in [Verification](#verification) |
| **Playwright in CI** | Out of scope | Sprint 07 |

### Security (REQ-NF-01, REQ-NF-02)

- No secrets in `web/`; URL country param validated as ISO2 before selection — never `dangerouslySetInnerHTML`
- API strings rendered as React text nodes via existing sanitizers
- No open redirect: invalid ISO2 does not change `NEXT_PUBLIC_API_URL` or off-origin navigation

### Robustness

- Reuse `LoadingState` / `ErrorState` and `DashboardRegionErrorBoundary` for new panels
- Preserve `ignoreResult` + `AbortController` in data hooks when adding list/search UI
- Failed country list fetch must not blank map/KPI regions independently

### Scalability (client MVP ~196 countries)

- Debounced search; memoize sorted/filtered list; avoid re-mounting map on each keystroke
- Top-10 computed once per successful countries response
- Full daily series expansion deferred to [Sprint 06](./sprint-06-data-depth-ingest.md) (ingest), not Sprint 04

---

## Deliverables

### Documentation

- [x] [ROADMAP-POST-MVP.md](./ROADMAP-POST-MVP.md) indexed on `main` (pre–Sprint 04)
- [x] Sprint 04 record opened — this file (card 1)
- [x] Copy guidelines in header/footer for historical data cutoff (~2023-03) — header + coverage banner (DEV-97)

### UX — global clarity

- [x] **Coverage banner** — “Map & KPIs: {N} countries · Full daily chart: {M} countries · Reference: {date}” (DEV-97)
- [ ] Remove or demote QA-only `<select>`; replace with production country picker fed by `GET /covid/countries`
- [x] **Top 10 panel** — sortable table (cases total, deaths total, new cases) from country list API (DEV-98)
- [ ] Map click + list click + search share one selection context ([REQ-F-22](../REQUIREMENTS.md)) — partial: map + top-10 panel (DEV-98); search/list (Card 4)

### UX — shareable state

- [ ] `?country=BR` in URL ↔ `DashboardSelectionProvider` (read on load, write on change)
- [ ] Invalid ISO2 in URL → global view + non-blocking message

### Empty states (no ingest change)

- [ ] Country with snapshot only → KPIs work; chart shows explicit “No daily series ingested for {country}” with pointer to chart-ready countries

---

## Out of scope (Sprint 04)

- Peak-day insights API ([Sprint 05](./sprint-05-country-insights-peaks.md))
- Expanding `PRIORITY_SERIES_COUNTRIES` ([Sprint 06](./sprint-06-data-depth-ingest.md))
- Monthly aggregation / date range UI ([Sprint 07](./sprint-07-time-granularity-quality.md))
- Playwright CI job ([Sprint 07](./sprint-07-time-granularity-quality.md))
- Production deploy / M5 (optional DEV-118 in Sprint 07)

---

## Technical notes

| Area | Approach |
|------|----------|
| Country list | Reuse `GET /covid/countries`; client-side sort/filter for top 10 |
| URL state | `useSearchParams` + `router.replace` (shallow) in App Router |
| Chart-ready count (M) | Constant aligned with ingest priority list until Sprint 06 exposes API metadata |
| a11y | Combobox/listbox pattern; keyboard navigation for country picker |

---

## Acceptance criteria (sprint close)

- [ ] First-time user can explain global vs country view in < 30 s (informal test)
- [ ] All ~196 API countries selectable via map **or** search/list
- [ ] Top 10 visible without selecting a country
- [ ] Coverage banner numbers match API responses
- [ ] Manual E2E smoke passed (see [Verification](#verification))
- [ ] `cd web && npm run lint && npm test && npm run build` pass
- [ ] No secrets in `web/`
- [ ] Quality strategy above satisfied for cards 2–6

---

## Verification

```bash
cd web && npm run lint && npm test && npm run build
```

**Manual E2E smoke (sprint close):**

1. Open `/` — top 10 visible; coverage banner shows plausible N / M / date
2. Search **Peru** — KPIs update; chart shows honest empty state (snapshot-only)
3. Search **Brazil** or click on map — chart populated (priority series)
4. Open `/?country=BR` — refresh — Brazil still selected
5. Invalid `/?country=ZZZ` — global view; no crash
6. **Clear selection** — global KPIs and chart restored

---

## Release

| Item | Value |
|------|-------|
| Integration branch | `develop` |
| Release tag | N/A (Sprint 04); **v0.2.0** target at Sprint 07 |
| Promote PR | Optional `develop` → `main` at sprint close |

---

## Retrospective

*To be completed at sprint close.*

- **Went well:** …
- **Improve:** …
- **Schedule / risk changes:** …
