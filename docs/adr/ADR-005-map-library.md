# ADR-005 — Geospatial map library

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-03 |
| **Deciders** | Project owner |

## Context

A core MVP capability is geographic visualization of COVID-19 metrics (choropleth or marker-based views by country/region). The map must integrate with the React/Next.js dashboard, support interactive tooltips or selection, and remain maintainable without proprietary map SDK lock-in for the initial release.

## Decision

Use **React Leaflet** with **Leaflet** as the primary map stack in `web/`.

| Concern | Approach |
|---------|----------|
| Rendering | Client-side map components; avoid SSR for Leaflet DOM APIs |
| Next.js integration | Dynamic import with `ssr: false` or dedicated client components (`"use client"`) |
| Tiles | OpenStreetMap-compatible tile layer (default); configurable via environment if needed |
| Data binding | Map layers consume typed props from internal API responses |

Mapbox GL JS remains a documented fallback if Leaflet proves insufficient for required visualizations (e.g. advanced layer styling at scale).

## Alternatives considered

| Option | Outcome |
|--------|---------|
| Mapbox GL JS | Deferred — powerful but adds token management and licensing considerations; revisit if Leaflet limits styling or performance |
| Google Maps JavaScript API | Rejected — billing and terms less aligned with MVP/open-data dashboard goals |
| D3-only custom projections | Rejected — higher implementation cost for standard pan/zoom map UX |
| Static map images | Rejected — insufficient for interactive dashboard requirements |

## Consequences

### Positive

- Open-source ecosystem with extensive React bindings.
- No mandatory commercial API key for base map tiles (OSM).
- Fits component model of the Next.js client bundle.

### Negative / trade-offs

- Leaflet relies on browser APIs — requires explicit Next.js client boundary (risk R3).
- Complex choropleth GeoJSON may need additional assets and performance tuning.
- Tile provider usage must respect provider attribution and fair-use policies.

## References

- [ADR-001](./ADR-001-technology-stack.md) — frontend stack
- [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) — risk R3
- [REQUIREMENTS.md](../REQUIREMENTS.md) — map acceptance criteria (planned)
