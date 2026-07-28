# Sprint 06 — Data depth & ingest expansion

| | |
|---|---|
| **Period** | 2026-08-26 → 2026-09-08 (target) |
| **Status** | Planned |
| **Sprint goal** | Expand **daily time-series coverage** beyond 12 priority countries so charts and peak insights work for LATAM and other high-interest countries |
| **Milestone** | Post-MVP product |
| **Phase** | Post-MVP |
| **Depends on** | [Sprint 05](./sprint-05-country-insights-peaks.md) (insights endpoint exists) |

---

## Problem statement

Peru (PE) and most countries have KPI snapshot but **no meaningful chart**. Root cause: `PRIORITY_SERIES_COUNTRIES` in `api/src/ingest/ingest.service.ts` lists only 12 upstream names. Sprint 06 expands ingest **deliberately** with quota awareness.

---

## Scope

| Card | Title | Status |
|------|-------|--------|
| DEV-107 | Open Sprint 06 record | Planned |
| DEV-108 | Expand priority country list + EXTERNAL_APIS quota table | Planned |
| DEV-109 | Document and run LATAM + global backfill sync procedure | Planned |
| DEV-110 | Expose series coverage metadata on insights/countries API | Planned |
| DEV-111 | Sprint 06 close and acceptance | Planned |

---

## Deliverables

### Ingest

- [ ] Extend `PRIORITY_SERIES_COUNTRIES` — minimum suggested adds:
  - **LATAM:** Peru, Chile, Colombia, Venezuela, Ecuador, Bolivia, Paraguay, Uruguay, Costa Rica, Panama, Cuba, Dominican Republic
  - **Other:** Portugal, South Africa, Indonesia, Philippines, Turkey, Poland, Netherlands, Sweden, Switzerland, South Korea, China (if upstream resolves)
- [ ] Final list sized to API Ninjas plan quota (document calls: ~2 per country × N countries per sync)
- [ ] [SETUP.md](../SETUP.md) — “Series backfill” operator section: `POST /sync` body `{ "mode": "country-series" }`

### API / UX

- [ ] `hasFullSeries` / `seriesPointCount` on country list or insights (avoid hardcoded “12” in UI)
- [ ] Coverage banner reads dynamic counts from API (replaces static Sprint 04 copy if needed)

### Documentation

- [ ] [EXTERNAL_APIS.md §5](../EXTERNAL_APIS.md) — updated priority set and quota notes
- [ ] Sprint record lists actual N countries with ≥365 points after backfill

---

## Out of scope

- Apify integration (contingency only — ADR-004)
- Subnational / region-level series
- Automatic cron in production (optional Sprint 07 / Phase 5)

---

## Acceptance criteria

- [ ] ≥ **30 countries** with ≥ **365** daily points in DB (verify via SQL or insights endpoint sample)
- [ ] Peru (PE) chart shows multi-year series after sync
- [ ] Prior sync failure does not wipe data (REQ-F-05) — verify on forced upstream error test
- [ ] Quota / call count documented in PR and EXTERNAL_APIS

---

## Verification

```bash
docker compose up -d
cd api && npx prisma migrate deploy
curl -X POST http://localhost:3001/sync -H "Content-Type: application/json" -d "{\"mode\":\"country-series\"}"
# Poll GET /sync/status until success
curl "http://localhost:3001/covid/countries/PE/series?metric=casesTotal"
curl http://localhost:3001/covid/countries/PE/insights
```

---

## Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R-API-QUOTA | Too many countries → quota exhaustion | Batch sync; configurable priority list via env (optional) |
| R-NAME-MAP | Unmapped upstream country name | Log + skip (G-04); extend `country-iso-map.ts` |

---

## Retrospective

*To be completed at sprint close.*
