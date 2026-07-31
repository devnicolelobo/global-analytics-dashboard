# Dashboard client modules (`web/lib/dashboard/`)

Shared **dashboard selection state** for Sprint 03 (DEV-90). KPI (DEV-91), map (DEV-92), and chart (DEV-93) consume this context — do not duplicate country/global state in leaf components.

## Model

| Value | Meaning |
|-------|---------|
| `selectedCountry === null` | Global view (default on load) |
| `selectedCountry === 'BR'` | Country-scoped view (uppercase ISO 3166-1 alpha-2) |

## Files

| File | Role |
|------|------|
| `selection.ts` | Pure helpers: parse, apply select/clear, `isGlobal`, `toSelectionState` |
| `constants.ts` | Chart-ready country count (mirrors ingest priority list until Sprint 06) |
| `format-coverage-banner.ts` | Pure coverage copy + `resolveMapCountryCount` |
| `load-sync-reference-label.ts` | Best-effort sync reference date fetch (abort-safe) |
| `use-coverage-banner-data.ts` | Hook for coverage banner data |
| `top-countries-metrics.ts` | Sort metric options for top-countries panel |
| `rank-top-countries.ts` | Pure top-N ranking (null last, name tie-break) |
| `use-top-countries-panel-data.ts` | Hook for top-countries panel |
| `filter-countries-by-query.ts` | Pure client search filter (name + ISO2 prefix) |
| `map-explorer-country-rows.ts` | Map API countries to explorer rows (dedupe, sanitize) |
| `use-country-explorer-data.ts` | Hook for country explorer panel |
| `../country-code.ts` | Shared shape validation for API URLs and selection (single boundary) |

## React integration

- `components/dashboard/dashboard-selection-provider.tsx` — `DashboardSelectionProvider`, `useDashboardSelection()`
- `components/dashboard/selection-chrome.tsx` — visible global/country UI + link to explorer
- `components/dashboard/coverage-banner.tsx` — map vs chart scope banner (Sprint 04 / DEV-97)
- `components/dashboard/top-countries-panel.tsx` — global top-10 ranking table (Sprint 04 / DEV-98)
- `components/dashboard/country-explorer-panel.tsx` — searchable full country list (Sprint 04 / DEV-99)

Provider wraps the dashboard shell (`dashboard-shell-inner.tsx`). Root `app/layout.tsx` stays a Server Component.

## Coverage banner (Sprint 04 / DEV-97)

Explains **map/KPI country count** (from `GET /covid/countries`), **chart-ready count** (client constant aligned with `PRIORITY_SERIES_COUNTRIES`), and **reference date** (from `GET /sync/status`).

## Top countries panel (Sprint 04 / DEV-98)

Ranks countries from `GET /covid/countries?metric=…` (default `casesTotal`). **Multi-column table** shows cases, deaths, and new cases together; pill control re-orders rows by selected metric (highlighted column). Row activation calls `selectCountry` (REQ-F-22). Re-fetch uses **stale-while-revalidate**: prior rows stay visible while the sort metric changes.

**Known trade-off:** banner, top-10, country explorer, map, and footer may each fetch `/covid/countries` or `/sync/status` independently in MVP — acceptable at ~196 countries; consolidate via shared providers if profiling warrants it later.

## Country explorer (Sprint 04 / DEV-99)

Lists all countries from `GET /covid/countries` with debounced client search (name or ISO2 prefix). Rows show cases, deaths, and new cases; row activation calls `selectCountry` (REQ-F-22). Default sort A→Z; empty query shows full list.

## Security & robustness

- **Untrusted input** (map clicks, top-10 rows, explorer rows, future URL sync) must go through `selectCountry(unknown)` → `applySelectCountry` → `normalizeCountryCodeInput`.
- Invalid codes are **ignored** (no throw, no state change). No auto-uppercase — matches API (lowercase → 400).
- **Max input length** (`COUNTRY_CODE_INPUT_MAX_LENGTH`) rejects oversized strings before trim.
- **No secrets** in context. Country code is a UI filter key only; display uses React text nodes.
- Country **names** sanitized via `sanitizeDisplayText` before ranking/display.
- **No persistence** in MVP (no `localStorage` / URL) — avoids stale country after deploy (URL sync: Card 5).
- Map (DEV-92), top-10, and country explorer must still validate via `selectCountry`.

## Tests

```bash
cd web
npm test -- lib/dashboard lib/__tests__/country-code.test.ts lib/api/__tests__/query.test.ts
```

Critical cases: invalid types, injection-like strings, oversized input, idempotent re-select, clear → global, top-N ranking ties and null metrics.

## References

- REQ-F-22, REQ-F-24 — `docs/REQUIREMENTS.md`
- ARCHITECTURE §7.2 — `docs/ARCHITECTURE.md`
- API country paths — `docs/API_SPEC.md` §6.3–6.5
