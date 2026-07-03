# ADR-003 — Database and ORM

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-03 |
| **Deciders** | Project owner |

## Context

COVID-19 metrics (cases, deaths, tests, geographic attributes) are structured, relational, and queried by country, region, and time range. The system needs durable storage for ingested upstream payloads, idempotent sync, and efficient filtering for dashboard aggregates and time-series charts.

## Decision

Use **PostgreSQL** as the primary database and **Prisma** as the ORM/migration tool in `api/`.

| Concern | Approach |
|---------|----------|
| Local development | PostgreSQL via Docker Compose (Phase 3) |
| Schema evolution | Prisma migrations committed to version control |
| Access pattern | All queries through Prisma Client in NestJS services |
| Sync strategy | Upsert on natural keys (country + date or equivalent) — detailed in DATA_MODEL |

PostgreSQL runs as a separate service; the application does not embed a database engine.

## Alternatives considered

| Option | Outcome |
|--------|---------|
| MongoDB | Rejected — tabular time-series and relational joins fit SQL better; less benefit from document flexibility |
| SQLite | Rejected — insufficient for concurrent staging/production deploys and realistic multi-environment workflow |
| MySQL / MariaDB | Rejected — PostgreSQL preferred for JSON support, extensions, and ecosystem fit with Prisma |
| TypeORM | Rejected — Prisma offers stronger schema-first migrations and generated client typing for this project size |
| Drizzle ORM | Rejected — viable alternative; Prisma selected for migration workflow maturity and team familiarity |

## Consequences

### Positive

- Relational model maps cleanly to country/date metrics and future aggregate queries.
- Prisma migrations provide auditable schema history.
- PostgreSQL is well supported in cloud and container deployments.

### Negative / trade-offs

- Requires Docker (or external Postgres) for local development — operational overhead vs. embedded DB.
- Prisma schema is the source of truth; raw SQL migrations need discipline when used.
- Connection pooling and production tuning remain operational tasks (documented in DEPLOYMENT).

## References

- [ADR-001](./ADR-001-technology-stack.md) — stack
- [ADR-002](./ADR-002-project-architecture.md) — persistence boundary in `api/`
- [DATA_MODEL.md](../DATA_MODEL.md) — entities and schema (planned)
