# ADR-004 — Upstream COVID-19 data provider

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-03 |
| **Deciders** | Project owner |

## Context

The dashboard depends on external COVID-19 statistics. The backend must ingest data on a schedule, normalize fields for storage, and shield the frontend from upstream rate limits, API key handling, and provider-specific response shapes. Historical depth and geographic coverage must be validated during integration analysis.

## Decision

| Role | Provider |
|------|----------|
| **Primary** | [API Ninjas COVID-19 API](https://api-ninjas.com/api/covid19) |
| **Contingency** | [Apify](https://apify.com/) COVID-19 datasets/actors (specific actor TBD in EXTERNAL_APIS) |

**Integration rules:**

1. All upstream HTTP calls execute in `api/` only.
2. API keys and secrets are environment variables — never committed or exposed to `web/`.
3. Ingest runs server-side (scheduled job or manual trigger); responses are normalized before Prisma upsert.
4. The internal REST API exposes persisted data — not raw upstream payloads.
5. If API Ninjas lacks required historical or geographic coverage, document gaps in `EXTERNAL_APIS.md` and activate the Apify contingency per risk R1 in [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md).

Detailed endpoint mapping, field contracts, and rate limits: [EXTERNAL_APIS.md](../EXTERNAL_APIS.md).

## Alternatives considered

| Option | Outcome |
|--------|---------|
| Direct browser calls to API Ninjas | Rejected — exposes key risk and bypasses persistence/cache |
| Our World in Data / Johns Hopkins static CSV only | Rejected as sole source — useful reference; API Ninjas chosen for programmatic access and MVP speed |
| Apify as sole primary | Rejected — higher cost and actor maintenance for default path; retained as contingency |
| Self-hosted scraper | Rejected — legal/operational burden outweighs benefit for MVP |

## Consequences

### Positive

- Clear security boundary: one server-side integration point.
- Contingency path exists if primary API data is insufficient (R1).
- Persisted data decouples dashboard uptime from upstream availability after sync.

### Negative / trade-offs

- Dependency on third-party availability, pricing, and schema stability.
- Contingency provider may require different normalization logic — extra implementation if activated.
- Historical completeness must be verified empirically during Phase 1 analysis.

## References

- [ADR-002](./ADR-002-project-architecture.md) — ingest boundary
- [EXTERNAL_APIS.md](../EXTERNAL_APIS.md) — provider analysis
- [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) — risk R1
