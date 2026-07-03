# Global Analytics Dashboard

Full-stack platform for geographic and statistical analysis of COVID-19 data. Public API payloads are ingested server-side, persisted through a relational data layer, and exposed to an interactive client for map-based exploration, KPI monitoring, and time-series visualization.

---

## Overview

This repository is structured as a **monorepo**. The NestJS API (`api/`), the Next.js web client (`web/`), shared documentation (`docs/`), and repository automation (`.github/`) are versioned and integrated within a single codebase.

The primary upstream data source is the [API Ninjas COVID-19 API](https://api-ninjas.com/api/covid19). Ingestion, normalization, and persistence are handled by the backend; the frontend consumes internal REST endpoints only.

Engineering workflow: GitFlow branching model, Linear issue tracking (`DEV-XX`), Conventional Commits, pull request–based integration into `develop`, and versioned technical documentation.

The monorepo structure and evaluated alternatives are recorded in `docs/adr/ADR-002-project-architecture.md`.

---

## Project status

**Initial development phase** — monorepo scaffolding is in place; domain modules, data layer, and client features are under active implementation.

| Component              | State              |
|------------------------|--------------------|
| `api/`                 | NestJS scaffold    |
| `web/`                 | Next.js scaffold   |
| PostgreSQL             | Not configured     |
| Prisma ORM             | Not configured     |
| API Ninjas integration | Not implemented    |
| Dashboard UI           | Not implemented    |

---

## Technology stack

| Layer         | Stack                                                 |
|---------------|-------------------------------------------------------|
| Backend       | TypeScript, Node.js, NestJS, PostgreSQL, Prisma ORM   |
| Frontend      | TypeScript, Next.js, React, Tailwind CSS              |
| Upstream data | API Ninjas COVID-19 (primary), Apify (contingency)    |
| Geospatial UI | React Leaflet (primary)                               |

---

## Repository layout

```
global-analytics-dashboard/
├── api/       # NestJS backend service
├── web/       # Next.js frontend application
├── docs/      # Architecture, specifications, ADRs, project management
└── .github/   # Pull request templates and CI/CD workflows
```

---

## Prerequisites

- Node.js 20 LTS or later
- npm
- Docker and Docker Compose (required once local PostgreSQL is configured)

---

## Local execution

> Complete environment setup: `docs/SETUP.md`.

### API

```bash
cd api
npm install
PORT=3001 npm run start:dev
```

Default bind address: `http://localhost:3001` (when `PORT=3001`).

### Web client

```bash
cd web
npm install
npm run dev
```

Default bind address: `http://localhost:3000`.

---

## Documentation

| Reference                            | Scope                                                              |
|--------------------------------------|--------------------------------------------------------------------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Branching model, commit conventions, pull request standards        |
| [docs/](./docs/)                     | Requirements, architecture, data model, API specification, ADRs    |

---

## Development workflow

| Concern            | Convention                                                     |
|--------------------|----------------------------------------------------------------|
| Issue tracking     | Linear — identifier prefix `DEV-XX`                            |
| Integration branch | `develop`                                                      |
| Production branch  | `main`                                                         |
| Commit format      | [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) |
| Code integration   | Pull request into `develop`; CI must pass before merge         |

Full process definition: [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

Distributed under the terms specified in [LICENSE](./LICENSE).
