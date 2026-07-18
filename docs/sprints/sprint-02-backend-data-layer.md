# Sprint 02 — Backend & data layer

| | |
|---|---|
| **Period** | 2026-07-11 → 2026-07-24 (target) |
| **Status** | Done (pending DEV-87 PR merge to `develop`) |
| **Sprint goal** | Implement PostgreSQL persistence, COVID ingest, and internal REST API in `api/` |
| **Milestone** | [M3](../PROJECT_MANAGEMENT.md#milestones) — **met** (ingest + internal API + automated tests) |
| **Phase** | 3 |

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
| Ingest | `SyncRun` orchestration | Done |
| REST API | Endpoints per [API_SPEC.md](../API_SPEC.md) §6–7 | Done |
| Sync | `POST /sync`, `GET /sync/status`, daily job outline | Done (HTTP); daily job deferred |
| Tests | Unit + integration for ingest and read paths | Done (DEV-87 §11 acceptance) |
| CI (optional) | `.github/workflows/ci-api.yml` when tests exist | Done (`ci-api.yml`) |

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
- [x] Read endpoints: `/health`, `/covid/summary`, `/covid/countries`, `/covid/countries/:code`, series routes
- [x] Sync endpoints: `POST /sync`, `GET /sync/status`
- [x] Error envelope per [API_SPEC.md](../API_SPEC.md) §4

### Quality

- [x] `npm run lint` and `npm test` pass in `api/`
- [x] Integration / e2e tests for primary read and sync happy paths (+ edge cases)
- [x] API_SPEC §11 acceptance table covered by automated tests (DEV-87)
- [x] No secrets committed; `API_NINJAS_KEY` server-only
- [x] Default test run never calls live API Ninjas (upstream mocked)

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

### Shipped

- Prisma schema, initial migration, `ConfigModule`, `PrismaModule` (DEV-80)
- API Ninjas HTTP client and `ApiNinjasModule` (DEV-81)
- Metric normalizer, country ISO map, and Prisma upsert repository (DEV-82)
- Error envelope, health readiness, ValidationPipe (DEV-84)
- Sync orchestration + `POST /sync` / status / run detail (DEV-85)
- COVID read endpoints + aggregation + e2e (DEV-86)
- Integration / §11 acceptance e2e + test helpers + sprint closure (DEV-87)
- GitHub Actions `ci-api.yml` (lint / unit / e2e / build) + branch protection on `main` / `develop`

### M3 criteria

| Criterion | Evidence |
|-----------|----------|
| Ingest functional | `IngestService` + SyncRun lifecycle; ingest e2e happy + failure paths |
| Internal REST API functional | All API_SPEC §6–7 routes exercised in e2e |
| Automated tests | `npm test` + `npm run test:e2e` (Postgres Option A + mocked upstream) |
| REQ-NF-04 | Ingest + all §6 read endpoints covered |
| REQ-F-05 | Sync failure leaves prior metrics unchanged |
| REQ-F-13 | Production 500 envelope has no stack / secrets |

### Verification commands

```bash
cd api
npm run lint
npm test
npm run test:e2e
npm run build
```

Manual smoke (local): `docker compose up -d` → `PORT=3001 npm run start:dev` → `POST /sync` → `GET /covid/summary`.

### Deferred / next

- Phase 4 frontend (`web/`) against read API
- Optional caching / rate limits post-MVP
- Daily sync job (scheduler) — HTTP trigger only in Sprint 02
- `ci-web.yml` (Phase 4+)

### Intentional test gaps

- Live API Ninjas contract tests (require paid key / network) — out of default CI
- Load / performance testing — out of MVP scope
- Full country catalogue series backfill volume — priority list only

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

- **Went well:** Clear layering (integration → ingest → sync/read); Prisma natural-key upsert kept sync idempotent; Nest DI overrides made CI-safe upstream mocks straightforward; Option A (real Postgres) caught roll-up / FK issues early.
- **Improve:** Align required GitHub status check names with Actions job names before enabling protection; sync `main` ↔ `develop` via PR when required checks block direct push; keep e2e fixtures and expected totals next to API_SPEC §11 for faster review.
- **Schedule / risk changes:** Soft dependency on Docker for integration e2e (soft-skip when down); CI e2e currently runs without a Postgres service container — add service when DEV-87 lands if integration suite must be mandatory green in Actions.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) | Phases, milestones |
| [sprint-01-foundation.md](./sprint-01-foundation.md) | Previous sprint |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Module map |
| [API_SPEC.md](../API_SPEC.md) | REST contract |
| [SETUP.md](../SETUP.md) | Local + integration test strategy |
