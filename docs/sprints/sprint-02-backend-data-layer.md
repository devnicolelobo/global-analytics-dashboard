# Sprint 02 — Backend & data layer

| | |
|---|---|
| **Period** | 2026-07-11 → 2026-07-24 (target) |
| **Status** | In progress |
| **Sprint goal** | Implement PostgreSQL persistence, COVID ingest, and internal REST API in `api/` |
| **Milestone** | [M3](../PROJECT_MANAGEMENT.md#milestones) — target 10 Aug 2026 |
| **Phase** | 3 (in progress) |

---

## Scope

Work is tracked in **Linear** (`DEV-XX`). This sprint starts **code delivery** on `develop` per [PROJECT_MANAGEMENT.md §11.4](../PROJECT_MANAGEMENT.md#114-exceptions).

| Area | Focus | Status |
|------|-------|--------|
| Branch setup | Create `develop` from `main` | Done |
| Prisma | `api/prisma/schema.prisma`, initial migration | Done |
| NestJS config | `ConfigModule`, `.env` loading | Done |
| Integration | API Ninjas HTTP client (`api/src/integration/api-ninjas/`) | Done |
| Ingest | Normalizer + Prisma upsert (`api/src/ingest/`) | Done |
| Ingest | `SyncRun` orchestration | Planned |
| REST API | Endpoints per [API_SPEC.md](../API_SPEC.md) §6–7 | Planned |
| Sync | `POST /sync`, `GET /sync/status`, daily job outline | Planned |
| Tests | Unit + integration for ingest and read paths | In progress |
| CI (optional) | `.github/workflows/ci-api.yml` when tests exist | Deferred |

---

## Deliverables

### Infrastructure & persistence

- [x] `develop` branch created and set as integration target for feature PRs
- [x] Prisma installed and configured in `api/`
- [x] Schema aligned with [DATA_MODEL.md](../DATA_MODEL.md)
- [x] `npx prisma migrate dev` — initial migration committed
- [x] `DATABASE_URL` consumed via NestJS `ConfigModule`

### Ingest & API

- [x] API Ninjas integration client ([EXTERNAL_APIS.md](../EXTERNAL_APIS.md))
- [x] Metric normalizer (country → ISO2, Mode A/B, cases/deaths merge rules)
- [x] Upsert on natural key (`country_code`, `region`, `reference_date`) via `CovidMetricRepository`
- [ ] Read endpoints: `/health`, `/covid/summary`, `/covid/countries`, `/covid/countries/:code`, series routes
- [ ] Sync endpoints: `POST /sync`, `GET /sync/status`
- [ ] Error envelope per [API_SPEC.md](../API_SPEC.md) §4

### Quality

- [x] `npm run lint` and `npm test` pass in `api/`
- [ ] Integration tests for primary read and sync happy paths
- [x] No secrets committed; `API_NINJAS_KEY` server-only

---

## Prerequisites (from Sprint 01)

| Artifact | Status |
|----------|--------|
| [DATA_MODEL.md](../DATA_MODEL.md) | Available |
| [API_SPEC.md](../API_SPEC.md) | Available |
| [EXTERNAL_APIS.md](../EXTERNAL_APIS.md) | Available |
| [SETUP.md](../SETUP.md) | Available |
| [docker-compose.yml](../../docker-compose.yml) | Available |

---

## Outcomes

*To be completed at sprint close.*

### Shipped

- Prisma schema, initial migration, `ConfigModule`, `PrismaModule` (DEV-80)
- API Ninjas HTTP client and `ApiNinjasModule` (DEV-81)
- Metric normalizer, country ISO map, and Prisma upsert repository (DEV-82)

### Deferred / next

- Ingest orchestration (`SyncRun`) and sync endpoints
- Internal REST API (read paths)

---

## Release

Feature work merges to `develop`. Production release remains at milestone M5 (`v0.1.0`).

| Item | Value |
|------|-------|
| Integration branch | `develop` |
| Release tag | N/A (Sprint 02) |
| Staging / production deploy | N/A |

---

## Retrospective

*To be completed at sprint close (target 24 Jul 2026).*

- **Went well:** …
- **Improve:** …
- **Schedule / risk changes:** …

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) | Phases, milestones |
| [sprint-01-foundation.md](./sprint-01-foundation.md) | Previous sprint |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Module map |
| [API_SPEC.md](../API_SPEC.md) | REST contract |
