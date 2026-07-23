# Map client modules (`web/lib/map/`)

Live choropleth map logic for Sprint 03 (DEV-92). Consumes DEV-90 selection and DEV-89 API client.

## Layout

| File | Role |
|------|------|
| `types.ts` | Map metric type, GeoJSON path, ISO_A2 join constant |
| `choropleth-scale.ts` | Metric min/max, color interpolation, legend stops |
| `join-metrics.ts` | ISO2 join GeoJSON ↔ `CountryListItem` rows |
| `format-tooltip.ts` | Tooltip text + `createCountryTooltipElement` (Leaflet-safe) |
| `format-map-subtitle.ts` | Validated reference date suffix for panel copy |
| `validate-geojson.ts` | FeatureCollection shape + size guards |
| `use-map-countries-data.ts` | Client hook: `getCountries`, abort, lookup, extent |

Presentational UI: `web/components/map/` — loaded via `WorldMapDynamic` (`ssr: false`).

## Data flow

```
WorldMapPanel
  → useMapCountriesData(casesTotal)     → GET /covid/countries
  → fetch(/geo/countries-110m.geojson)  → once per mount
  → join ISO_A2 ↔ CountryListItem.code
  → ChoroplethLayer + MapLegend
  → click/hover → useDashboardSelection()
```

## Security

- **Fetch:** country metrics only via `web/lib/api/client` — no API Ninjas in browser.
- **Tooltips:** Leaflet uses `innerHTML` for string tooltips — always `createCountryTooltipElement` (`textContent`).
- **GeoJSON:** validate `FeatureCollection`, feature count cap, 5 MB text limit before `JSON.parse`.
- **ISO2:** shared `normalizeCountryCodeInput` before selection and join.
- **Display:** `sanitizeDisplayText` on API names; reference dates require `YYYY-MM-DD`.
- **Race safety:** `AbortController` + `ignoreResult` on API and GeoJSON loads.

## Choropleth decision (MVP)

Primary **choropleth** colored by `casesTotal`. Circle markers deferred — join works with Natural Earth `ISO_A2`.

## GeoJSON asset

`web/public/geo/countries-110m.geojson` — Natural Earth 110m Admin 0 (public domain). Join key: `ISO_A2`.

## Tests

```bash
cd web
npm test -- lib/map
```

## References

- API_SPEC §6.3, §10
- REQ-F-20–23, REQ-F-50
- ADR-005, ARCHITECTURE §7.4
