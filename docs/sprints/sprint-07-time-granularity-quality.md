# Sprint 07 — Time granularity, quality & optional release

| | |
|---|---|
| **Period** | 2026-09-09 → 2026-09-22 (target) |
| **Status** | Planned |
| **Sprint goal** | Add **daily/monthly** views and **date range** filters; harden quality with E2E smoke and portfolio README; **optionally** close M5 deploy |
| **Milestone** | M5 optional · post-MVP quality gate |
| **Phase** | Post-MVP (+ optional Phase 5 deploy) |
| **Depends on** | [Sprint 06](./sprint-06-data-depth-ingest.md) ( sufficient series depth) |

---

## Problem statement

Daily points are hard to read over 1000+ days. Professional dashboards offer **monthly rollup** and **date filters**. This sprint adds analytical granularity and the **quality bar** expected in a senior portfolio — without mandatory production hosting.

---

## Scope

| Card | Title | Status |
|------|-------|--------|
| DEV-112 | Open Sprint 07 record | Planned |
| DEV-113 | Daily / monthly chart granularity (web or API) | Planned |
| DEV-114 | Date range filter (`from` / `to`) wired to series API | Planned |
| DEV-115 | Playwright dashboard smoke (global → country → clear) | Planned |
| DEV-116 | README demo (GIF/screenshots) + root status refresh | Planned |
| DEV-117 | Sprint 07 close and retrospective | Planned |
| DEV-118 | *(Optional)* Staging deploy + public URL (M5 / Phase 5) | Deferred |

---

## Deliverables

### Analytics UX

- [ ] Toggle **Daily | Monthly** — aggregate in `web/lib/charts/` (sum `casesNew`/`deathsNew`, last `casesTotal` per month) **or** `?granularity=month` on API if preferred
- [ ] Date range picker → passes `from`/`to` to existing series endpoints ([API_SPEC](../API_SPEC.md) §6)
- [ ] Selection + URL params preserved when changing granularity

### Quality

- [ ] Playwright project in `web/` or repo root — smoke against local stack (document in SETUP)
- [ ] Optional CI job or documented local-only (do not block `develop` if flaky without Docker in Actions)
- [ ] Enable `web` as required GitHub check if stable (coordinate with CONTRIBUTING)

### Portfolio / docs

- [ ] Root [README.md](../../README.md) — current status (Sprint 03–07), architecture preview, 30s demo GIF
- [ ] [REQUIREMENTS.md §10](../REQUIREMENTS.md#10-future-evolution-post-mvp) — mark delivered themes

### Optional — Phase 5 / M5 (DEV-118)

- [ ] Staging deploy per [DEPLOYMENT.md](../DEPLOYMENT.md)
- [ ] Tag `v0.1.0` on `main`
- [ ] Public URLs in README

**Default for this project:** DEV-118 **deferred** unless explicitly prioritized.

---

## Acceptance criteria

- [ ] Monthly view reduces point count and remains readable for BR/US
- [ ] Date range filters series without page reload
- [ ] Playwright smoke passes locally
- [ ] `npm run lint && npm test && npm run build` in `api/` and `web/`
- [ ] Sprint 07 record **Complete**

---

## Verification

```bash
cd web && npm run lint && npm test && npm run build
cd api && npm run lint && npm test && npm run build
# npx playwright test (after DEV-115)
```

---

## Retrospective

*To be completed at sprint close.*

- **Went well:** …
- **Improve:** …
- **Schedule / risk changes:** …
