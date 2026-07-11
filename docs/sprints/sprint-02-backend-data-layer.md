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
| Branch setup | Create `develop` from `main` | Planned |
| Prisma | `api/prisma/schema.prisma`, initial migration | Planned |
| NestJS config | `ConfigModule`, `.env` loading | Planned |
| COVID module | Ingest service, normalizer, API Ninjas client | Planned |
| REST API | Endpoints per [API_SPEC.md](../API_SPEC.md) §6–7 | Planned |
| Sync | `POST /sync`, `GET /sync/status`, daily job outline | Planned |
| Tests | Unit + integration for ingest and read paths | Planned |
| CI (optional) | `.github/workflows/ci-api.yml` when tests exist | Deferred |

---

## Deliverables

### Infrastructure & persistence

- [ ] `develop` branch created and set as integration target for feature PRs
- [ ] Prisma installed and configured in `api/`
- [ ] Schema aligned with [DATA_MODEL.md](../DATA_MODEL.md)
- [ ] `npx prisma migrate dev` — initial migration committed
- [ ] `DATABASE_URL` consumed via NestJS `ConfigModule`

### Ingest & API

- [ ] API Ninjas integration client ([EXTERNAL_APIS.md](../EXTERNAL_APIS.md))
- [ ] Upsert on natural key (`country_code`, `region`, `reference_date`)
- [ ] Read endpoints: `/health`, `/covid/summary`, `/covid/countries`, `/covid/countries/:code`, series routes
- [ ] Sync endpoints: `POST /sync`, `GET /sync/status`
- [ ] Error envelope per [API_SPEC.md](../API_SPEC.md) §4

### Quality

- [ ] `npm run lint` and `npm test` pass in `api/`
- [ ] Integration tests for primary read and sync happy paths
- [ ] No secrets committed; `API_NINJAS_KEY` server-only

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

- …

### Deferred / next

- …

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
