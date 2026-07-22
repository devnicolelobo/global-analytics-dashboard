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
| `../country-code.ts` | Shared shape validation for API URLs and selection (single boundary) |

## React integration

- `components/dashboard/dashboard-selection-provider.tsx` — `DashboardSelectionProvider`, `useDashboardSelection()`
- `components/dashboard/selection-chrome.tsx` — visible global/country UI + QA picker

Provider wraps the dashboard shell (`dashboard-shell.tsx`). Root `app/layout.tsx` stays a Server Component.

## Security & robustness

- **Untrusted input** (map clicks, select, future URL sync) must go through `selectCountry(unknown)` → `applySelectCountry` → `normalizeCountryCodeInput`.
- Invalid codes are **ignored** (no throw, no state change). No auto-uppercase — matches API (lowercase → 400).
- **Max input length** (`COUNTRY_CODE_INPUT_MAX_LENGTH`) rejects oversized strings before trim.
- **No secrets** in context. Country code is a UI filter key only; display uses React text nodes.
- **No persistence** in MVP (no `localStorage` / URL) — avoids stale country after deploy.
- QA `<select>` uses `isQaCountryCode` before calling `selectCountry` (defense in depth). Map (DEV-92) must still validate via `selectCountry`.

## Tests

```bash
cd web
npm test -- lib/dashboard lib/__tests__/country-code.test.ts lib/api/__tests__/query.test.ts
```

Critical cases: invalid types, injection-like strings, oversized input, idempotent re-select, clear → global.

## References

- REQ-F-22, REQ-F-24 — `docs/REQUIREMENTS.md`
- ARCHITECTURE §7.2 — `docs/ARCHITECTURE.md`
- API country paths — `docs/API_SPEC.md` §6.4–6.5
