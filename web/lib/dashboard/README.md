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
| `qa-countries.ts` | Whitelisted ISO2 list for the QA `<select>` only |
| `constants.ts` | Chart-ready country count (mirrors ingest priority list until Sprint 06) |
| `format-coverage-banner.ts` | Pure coverage copy + `resolveMapCountryCount` |
| `load-sync-reference-label.ts` | Best-effort sync reference date fetch (abort-safe) |
| `use-coverage-banner-data.ts` | Hook for coverage banner data |
| `top-countries-metrics.ts` | Sort metric options for top-countries panel |
| `rank-top-countries.ts` | Pure top-N ranking (null last, name tie-break) |
| `use-top-countries-panel-data.ts` | Hook for top-countries panel |
| `../country-code.ts` | Shared shape validation for API URLs and selection (single boundary) |

## React integration

- `components/dashboard/dashboard-selection-provider.tsx` — `DashboardSelectionProvider`, `useDashboardSelection()`
- `components/dashboard/selection-chrome.tsx` — visible global/country UI + QA picker
- `components/dashboard/coverage-banner.tsx` — map vs chart scope banner (Sprint 04 / DEV-97)
- `components/dashboard/top-countries-panel.tsx` — global top-10 ranking table (Sprint 04 / DEV-98)

Provider wraps the dashboard shell (`dashboard-shell.tsx`). Root `app/layout.tsx` stays a Server Component.

## Coverage banner (Sprint 04 / DEV-97)

Explains **map/KPI country count** (from `GET /covid/countries`), **chart-ready count** (client constant aligned with `PRIORITY_SERIES_COUNTRIES`), and **reference date** (from `GET /sync/status`).

## Top countries panel (Sprint 04 / DEV-98)

Ranks countries from `GET /covid/countries?metric=…` (default `casesTotal`). User can switch metric (`deathsTotal`, `casesNew`). Row click calls `selectCountry` (REQ-F-22).

**Known trade-off:** banner, top-10, map, and footer may each fetch `/covid/countries` or `/sync/status` independently in MVP — acceptable at ~196 countries; consolidate via shared providers if profiling warrants it later.

## Security & robustness

- **Untrusted input** (map clicks, top-10 rows, select, future URL sync) must go through `selectCountry(unknown)` → `applySelectCountry` → `normalizeCountryCodeInput`.
- Invalid codes are **ignored** (no throw, no state change). No auto-uppercase — matches API (lowercase → 400).
- **Max input length** (`COUNTRY_CODE_INPUT_MAX_LENGTH`) rejects oversized strings before trim.
- **No secrets** in context. Country code is a UI filter key only; display uses React text nodes.
- Country **names** sanitized via `sanitizeDisplayText` before ranking/display.
- **No persistence** in MVP (no `localStorage` / URL) — avoids stale country after deploy (URL sync: Card 5).
- QA `<select>` uses `isQaCountryCode` before calling `selectCountry` (defense in depth). Map (DEV-92) and top-10 panel must still validate via `selectCountry`.

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
