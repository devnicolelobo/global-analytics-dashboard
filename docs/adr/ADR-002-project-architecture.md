# ADR-002 — Project architecture (monorepo)

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-03 |
| **Deciders** | Project owner |

## Context

The product couples a data ingestion backend, a persistence layer, and a dashboard frontend. Documentation, CI configuration, and engineering process must live alongside code. The repository must remain navigable for a solo maintainer while supporting clear boundaries between client, server, and specs.

## Decision

Use a **folder-based monorepo** at the repository root:

```
global-analytics-dashboard/
├── api/        # NestJS backend — ingest, persistence, internal REST API
├── web/        # Next.js frontend — dashboard UI only
├── docs/       # Requirements, architecture, ADRs, sprint records
└── .github/    # Pull request templates, CI workflows (when added)
```

**Architectural boundaries:**

1. **Upstream data** — External COVID-19 APIs are called only from `api/`. API keys never ship to the browser.
2. **Internal API** — `web/` consumes REST endpoints exposed by `api/` only.
3. **Persistence** — Database access is confined to `api/` via Prisma.
4. **Documentation** — Technical specs and ADRs are versioned under `docs/` and updated in the same pull requests that change behavior.

No shared runtime package is introduced initially. Cross-cutting types (e.g. DTO shapes) may be duplicated or extracted to a shared package later if duplication becomes costly.

## Alternatives considered

| Option | Outcome |
|--------|---------|
| Polyrepo (separate API and web repositories) | Rejected — higher coordination overhead for a solo project; documentation and releases would fragment |
| Monorepo with Turborepo/Nx orchestration | Rejected for MVP — added tooling cost without current need; plain folders suffice |
| Next.js API routes as sole backend | Rejected — mixes ingest/scheduling concerns with UI deployment; weaker fit for long-running sync jobs |
| Backend-for-frontend (BFF) inside Next.js | Rejected — NestJS provides clearer module boundaries for ingest, domain logic, and API versioning |

## Consequences

### Positive

- One clone delivers full system context for development and review.
- `docs/` stays aligned with code history.
- Deployment can still target `api/` and `web/` independently.

### Negative / trade-offs

- Root repository grows in surface area; discipline is required to respect package boundaries.
- CI must run per package (`api/`, `web/`) rather than a single unified build (see planned workflows).
- No enforced import graph between packages until optional shared library is added.

## References

- [ADR-001](./ADR-001-technology-stack.md) — stack
- [ADR-004](./ADR-004-api-provider.md) — upstream API boundary
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Git workflow
