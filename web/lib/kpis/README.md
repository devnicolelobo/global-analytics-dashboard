# KPI client modules (`web/lib/kpis/`)

Live KPI panel logic for Sprint 03 (DEV-91). Consumes DEV-90 selection and DEV-89 API client.

## Layout

| File | Role |
|------|------|
| `format-metric.ts` | `Intl` number formatting; em dash for null metrics |
| `sanitize-display.ts` | Strip tags/control chars from API strings before UI text |
| `map-kpi-view-model.ts` | Map `SummaryResponse` / `CountryDetailResponse` → card view models |
| `use-kpi-panel-data.ts` | Client hook: fetch, abort, stale guard, global vs country routing |

Presentational UI: `web/components/kpis/kpi-card.tsx`, `kpi-panel.tsx`.

## Data flow

```
useDashboardSelection()
  → useKpiPanelData(isGlobal, selectedCountry)
      → getSummary() | getCountry(iso2)
      → map*ToKpiPanel()
      → KpiPanel renders KpiCard × 3
```

## Security

- **Fetch:** only via `web/lib/api/client` — no raw `fetch` in components.
- **Country code:** re-validated with `parseCountryCodeForSelection` before `getCountry`.
- **Display strings:** `sanitizeDisplayText` on country names; reference dates must match `YYYY-MM-DD`.
- **Errors:** `toKpiPanelErrorMessage` uses sanitized `ApiError.message` — no stack traces in UI.
- **Race safety:** `AbortController` + `ignoreResult` on selection change/unmount.

## Third KPI (G-01)

Label **New cases (daily)** from `metrics.casesNew` — active cases unavailable upstream (EXTERNAL_APIS G-01).

## Tests

```bash
cd web
npm test -- lib/kpis
```

## References

- API_SPEC §6.2, §6.4, §10
- REQ-F-30–33, REQ-F-51
- ARCHITECTURE §7.4
