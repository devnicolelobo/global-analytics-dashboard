# Documentation

Technical and project documentation for **Global Analytics Dashboard**. This index maps all documents in this directory and their purpose.

For development workflow and contribution standards, see [CONTRIBUTING.md](../CONTRIBUTING.md) at the repository root.

---

## Project management

| Document | Description | Status |
|----------|-------------|--------|
| [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) | Methodology, Linear workflow, GitFlow, releases, definition of done | Available |
| [sprints/](./sprints/) | Sprint records and summary index | Available |

---

## Product and requirements

| Document | Description | Status |
|----------|-------------|--------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Functional and non-functional requirements, acceptance criteria | Available |

---

## Architecture and design

| Document | Description | Status |
|----------|-------------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, layers, data flow | Available |
| [DATA_MODEL.md](./DATA_MODEL.md) | Domain entities, Prisma schema, ER overview | Available |
| [adr/](./adr/) | Architecture Decision Records (ADRs) | Available |
| [diagrams/](./diagrams/) | Draw.io diagrams (architecture, ER, sequence, deployment) | Available |
| [assets/](./assets/) | Exported diagram images (PNG/SVG) | Planned |

---

## API and integrations

| Document | Description | Status |
|----------|-------------|--------|
| [API_SPEC.md](./API_SPEC.md) | Internal REST API contract (NestJS) | Available |
| [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) | Upstream data sources (API Ninjas, Apify) | Available |

---

## Operations

| Document | Description | Status |
|----------|-------------|--------|
| [SETUP.md](./SETUP.md) | Local development environment setup | Planned |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Staging and production deployment | Planned |

---

## Quick reference

| I need to… | Read |
|------------|------|
| Understand how we work (branches, commits, PRs) | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| See project methodology and sprints | [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) · [sprints/](./sprints/) |
| Know what the system must do | [REQUIREMENTS.md](./REQUIREMENTS.md) |
| Understand system design | [ARCHITECTURE.md](./ARCHITECTURE.md) · [adr/](./adr/) |
| Review data entities and schema | [DATA_MODEL.md](./DATA_MODEL.md) |
| Integrate with the backend API | [API_SPEC.md](./API_SPEC.md) |
| Understand external data sources | [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) |
| Run the project locally | [SETUP.md](./SETUP.md) |
| Deploy to staging or production | [DEPLOYMENT.md](./DEPLOYMENT.md) |

---

## Directory layout

```
docs/
├── README.md                 # This index
├── PROJECT_MANAGEMENT.md
├── REQUIREMENTS.md
├── ARCHITECTURE.md
├── DATA_MODEL.md
├── API_SPEC.md
├── EXTERNAL_APIS.md
├── SETUP.md
├── DEPLOYMENT.md
├── adr/
├── sprints/
├── diagrams/
└── assets/
```

Documents marked **Planned** will be added incrementally as the project evolves.
