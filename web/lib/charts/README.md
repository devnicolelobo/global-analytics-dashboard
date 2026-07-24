# Chart layer (`web/lib/charts/`)

Confirmed cases **time-series** helpers for DEV-93 (REQ-F-40–43).

| Module | Role |
|--------|------|
| `constants.ts` | Fixed MVP metric (`casesTotal`), English copy |
| `map-series-data.ts` | API points → chart view model; selection → endpoint target |
| `format-chart-axis.ts` | Y-axis / tooltip number formatting |
| `use-cases-time-series-data.ts` | Client hook: global vs country series fetch + abort |

## Library

**Recharts** (SVG, Client Component only). Loaded via `CasesTimeSeriesDynamic` (`next/dynamic`, `ssr: false`) — same SSR pattern as DEV-92 Leaflet map.

## Data flow

```
DashboardSelectionProvider (DEV-90)
  → CasesTimeSeriesPanel
      → useCasesTimeSeriesData
          → null selection: getGlobalSeries({ metric: casesTotal })
          → ISO2 selected: getSeries(code, { metric: casesTotal })
      → CasesTimeSeriesChart (Recharts line, connectNulls=false)
```

## Null / empty behavior

- `points: []` → empty state message (REQ-F-42), not a crash
- `value: null` → gap in line (`connectNulls={false}`)
