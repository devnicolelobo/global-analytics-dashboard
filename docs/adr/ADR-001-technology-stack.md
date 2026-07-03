# ADR-001 — Technology stack

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-03 |
| **Deciders** | Project owner |

## Context

The platform requires a full-stack TypeScript codebase: a server-side ingestion and API layer, a relational persistence tier, and an interactive web client for maps, KPIs, and charts. The stack must support solo development, clear separation of concerns, and incremental delivery toward an MVP.

## Decision

Adopt the following canonical stack:

| Layer | Technologies |
|-------|--------------|
| Language | TypeScript (end-to-end) |
| Runtime | Node.js 20 LTS |
| Backend framework | NestJS 11 |
| Frontend framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Prisma |
| Testing | Jest (API), framework defaults (web) |
| Package manager | npm (per package in `api/` and `web/`) |

All application code in `api/` and `web/` is TypeScript. Shared conventions (formatting, linting) apply at repository level; dependencies are managed per package with committed lockfiles.

## Alternatives considered

| Option | Outcome |
|--------|---------|
| Python (FastAPI) + separate React SPA | Rejected — splits language expertise and weakens end-to-end TypeScript typing across API contracts |
| Express without NestJS | Rejected — less structure for modules, DI, and testing at scale of a growing API |
| Vite + React SPA instead of Next.js | Rejected — Next.js provides routing, SSR/SSG options, and production-oriented defaults needed for dashboard delivery |
| pnpm workspaces at root | Deferred — npm per package is sufficient for current monorepo size; workspace tooling can be revisited if coordination overhead grows |

## Consequences

### Positive

- Single language reduces context switching and enables shared types for API contracts.
- NestJS and Next.js are widely documented with mature testing and deployment paths.
- TypeScript strictness catches integration errors early.

### Negative / trade-offs

- Two Node.js applications (`api/`, `web/`) require separate build and deploy pipelines.
- Next.js and React major versions must be kept compatible during upgrades.
- Prisma and NestJS add framework-specific patterns new contributors must learn.

## References

- [ADR-002](./ADR-002-project-architecture.md) — monorepo layout
- [ADR-003](./ADR-003-database-choice.md) — PostgreSQL and Prisma
- [README.md](../../README.md) — stack summary
