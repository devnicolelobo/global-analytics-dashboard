# Post-MVP product roadmap (Sprints 04–07)

Execution plan after [Sprint 03](./sprint-03-frontend-dashboard.md) (M4 product on `develop`). Transforms the technical MVP into a **professional analytics experience**: clear global entry, universal country interaction, per-country insights (peak days), deeper ingest, and optional quality/deploy polish.

| | |
|---|---|
| **Status** | Planned |
| **Track** | Post-MVP product evolution (deploy optional) |
| **North star** | In 10 seconds the user understands the global picture; in 1 click they understand a country; on the chart they see evolution and critical peaks. |

---

## Why a new sprint track

The MVP intentionally split data depth:

| Surface | Countries | Data shape |
|---------|-----------|------------|
| Map + KPIs | ~196 | Single reference-day snapshot |
| Time-series chart | 12 priority | Daily history (~2020 → 2023-03) |
| QA `<select>` | 5 | Manual test only — confuses users |

Users expect **one coherent story**. Sprints 04–07 align UX, API, and ingest without rewriting the stack.

**Phase 5 (deploy / M5 / `v0.1.0`)** remains **optional** — see [Sprint 07](./sprint-07-time-granularity-quality.md). Product value can ship on `develop` + local demo first.

---

## Sprint map

| Sprint | Theme | Goal | Record |
|--------|-------|------|--------|
| **04** | Analytics discovery UX | Global clarity, top rankings, searchable countries, URL selection | [sprint-04-analytics-discovery-ux.md](./sprint-04-analytics-discovery-ux.md) |
| **05** | Country insights & peaks | “Worst day” (deaths/cases), chart annotations, deaths toggle | [sprint-05-country-insights-peaks.md](./sprint-05-country-insights-peaks.md) |
| **06** | Data depth & ingest | Expand series backfill (LATAM + global), honest coverage metadata | [sprint-06-data-depth-ingest.md](./sprint-06-data-depth-ingest.md) |
| **07** | Time granularity & quality | Daily/monthly, date range, E2E smoke, README demo; deploy optional | [sprint-07-time-granularity-quality.md](./sprint-07-time-granularity-quality.md) |

**Dependency chain:** 04 → 05 → 06 (06 can overlap 05 after API design) → 07.

---

## Product principles (from professional references)

Inspired by Our World in Data, JHU/ESRI COVID dashboards, and modern analytics UX — **principles, not pixel copies**:

1. **Overview first, details on demand** — global default; country on click.
2. **One selection drives all panels** — map, KPIs, chart, insights rail.
3. **Provenance always visible** — source, reference date, historical cutoff (~2023-03).
4. **Honest empty states** — distinguish snapshot vs full series coverage.
5. **Insights as one-liners** — peak day card + chart marker, not raw tables only.

---

## Target information architecture

```
┌─────────────────────────────────────────────────────────┐
│  Global KPIs + coverage banner (N countries · ref date)  │
├──────────────────────────┬──────────────────────────────┤
│  World map (primary)     │  Top 10 · search · selection  │
├──────────────────────────┴──────────────────────────────┤
│  Chart (global or country) + peak insight card           │
├─────────────────────────────────────────────────────────┤
│  Footer: sync status · data disclaimer                   │
└─────────────────────────────────────────────────────────┘
```

---

## Engineering guardrails

- Stack unchanged: NestJS, Prisma, Next.js, Leaflet, Recharts ([ADR-001–005](../adr/)).
- New read endpoints → update [API_SPEC.md](../API_SPEC.md) before implementation.
- Business logic in `api/` services; pure functions unit-tested; no upstream keys in `web/`.
- Linear `DEV-XX` cards; branches `DEV-XX-*` → PR `develop`; conventional commits.
- Deploy and Apify **out of scope** until Sprint 07 optional card or explicit decision.

---

## Success metrics (track)

| Metric | Target (after Sprint 07) |
|--------|--------------------------|
| Countries on map / KPIs | ~196 (maintain) |
| Countries with usable daily series | ≥ 30 |
| Time-to-understand (informal user test) | < 30 s |
| Playwright dashboard smoke | Green in CI |
| `web` + `api` lint/test/build | Green |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [sprints/README.md](./README.md) | Sprint index |
| [REQUIREMENTS.md §10](../REQUIREMENTS.md#10-future-evolution-post-mvp) | Requirement themes |
| [EXTERNAL_APIS.md §5–6](../EXTERNAL_APIS.md) | Ingest strategy & gaps |
| [PROJECT_MANAGEMENT.md §7](../PROJECT_MANAGEMENT.md#7-planning-framework) | Phase framework |
