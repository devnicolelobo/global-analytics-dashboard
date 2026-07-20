# Project Management

Governance, planning, and delivery model for **Global Analytics Dashboard**.

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Last updated** | July 2026 |

Operational Git workflow (branches, commits, pull requests) is defined in [CONTRIBUTING.md](../CONTRIBUTING.md). This document covers **how the project is managed** — roles, methodology, phases, releases, quality gates, and risks.

---

## Table of Contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Project overview](#2-project-overview)
3. [Governance model](#3-governance-model)
4. [Engineering principles](#4-engineering-principles)
5. [Methodology](#5-methodology)
6. [Tools and artifacts](#6-tools-and-artifacts)
7. [Planning framework](#7-planning-framework)
8. [Schedule and milestones](#8-schedule-and-milestones)
9. [Work management](#9-work-management)
10. [Delivery workflow](#10-delivery-workflow)
11. [Environments and release strategy](#11-environments-and-release-strategy)
12. [Definition of Done](#12-definition-of-done)
13. [Configuration management](#13-configuration-management)
14. [Documentation strategy](#14-documentation-strategy)
15. [AI-assisted development](#15-ai-assisted-development)
16. [Risk management](#16-risk-management)
17. [Measurement](#17-measurement)
18. [Sprint management](#18-sprint-management)
19. [Related documents](#19-related-documents)

---

## 1. Purpose and scope

This document defines the software engineering management model for the Global Analytics Dashboard — a single-repository, full-stack data platform.

**In scope:** governance, planning phases, milestones, sprint cadence, release policy, Definition of Done (DoD), risks, and documentation governance.

**Out of scope (see linked documents):**

| Topic | Document |
|-------|----------|
| Git workflow, commits, PR standards | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Product requirements | [REQUIREMENTS.md](./REQUIREMENTS.md) |
| Sprint execution records | [docs/sprints/](./sprints/) |
| Architecture decisions | [docs/adr/](./adr/) |

---

## 2. Project overview

**Product.** A full-stack platform for geographic and statistical analysis of COVID-19 data. Public upstream APIs are ingested server-side, persisted, and exposed through an interactive dashboard (maps, KPIs, time-series charts).

**Repository.** Monorepo: `api/` (NestJS), `web/` (Next.js), `docs/`, `.github/`.

**Team model.** Individual ownership across product, engineering, quality, and operations within a single integrated delivery unit.

**Current phase.** Phase 4 (frontend & dashboard) **in progress** — [Sprint 03](./sprints/sprint-03-frontend-dashboard.md) (M4). Phases 0–3 complete; Sprint 02 closed: [sprint-02-backend-data-layer.md](./sprints/sprint-02-backend-data-layer.md).

---

## 3. Governance model

### 3.1 Roles

| Role | Responsibility |
|------|----------------|
| Product / PM | Scope, prioritization, milestone tracking |
| Software Engineer | Backend, frontend, integrations |
| QA | Test strategy, acceptance validation, DoD enforcement |
| DevOps | Local infra, CI/CD, staging and production deploys |
| Technical Writer | Versioned documentation in `docs/` |

### 3.2 Decision authority

| Decision type | Record |
|---------------|--------|
| Architecture and technology | [docs/adr/](./adr/) |
| Product scope | [REQUIREMENTS.md](./REQUIREMENTS.md) + Linear |
| Engineering process | [CONTRIBUTING.md](../CONTRIBUTING.md) + this document |
| Backlog priority | Linear |

### 3.3 Review cadence

- **Per card:** on pull request merge.
- **Per sprint:** sprint record + release ritual (Section 18).
- **Per milestone:** schedule and risk register review (Section 8, 16).

---

## 4. Engineering principles

1. **Ownership** — The owner of a Linear card is responsible end-to-end until Done: implementation, tests, documentation, and merge.
2. **Canonical approaches** — Standard stack and conventions; deviations require an ADR.
3. **Data as a strategic asset** — Ingestion, persistence, and contracts are first-class engineering concerns.
4. **Customer trust** — No secrets in client code; explicit handling of external data sources.
5. **Documentation as engineering** — Technical knowledge is versioned alongside code in pull requests.
6. **Continuous delivery** — Integrate frequently into `develop`; release deliberately to `main`.

---

## 5. Methodology

### 5.1 Management framework

Planning and control cover initiation, scope definition, execution, review, closure, and measurement — without heavyweight ceremony.

### 5.2 Dual-track delivery

Discovery and delivery run in parallel where practical:

| Track | Activities | Artifacts |
|-------|------------|-----------|
| **Discovery** | Scope, design, integration analysis | REQUIREMENTS, ADRs, ARCHITECTURE, EXTERNAL_APIS, API_SPEC |
| **Delivery** | Implementation, test, integration | Feature branches → `develop` → `main` |

Sprints are **time-boxed iterations** (~1–2 weeks). Scope is replanned at each sprint boundary if needed.

---

## 6. Tools and artifacts

| Tool | Purpose |
|------|---------|
| [Linear](https://linear.app) | Backlog, status, dependencies (`DEV-XX`) |
| GitHub | Source control, pull requests, CI/CD, releases |
| Docker Compose | Local PostgreSQL ([docker-compose.yml](../docker-compose.yml), [SETUP.md](./SETUP.md)) |
| AI coding agents | Assisted development under governance (Section 15) |

| Artifact | Location |
|----------|----------|
| Contribution standards | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Project management | This document |
| Sprint records | [docs/sprints/](./sprints/) |
| Architecture decisions | [docs/adr/](./adr/) |
| Documentation index | [docs/README.md](./README.md) |

---

## 7. Planning framework

| Phase | Name | Objective | Status |
|-------|------|-----------|--------|
| **0** | Foundation | Repository, process, base documentation | Complete |
| **1** | Governance & documentation | PM plan, ADRs, requirements, external API analysis | Complete |
| **2** | Architecture & specifications | Architecture, data model, API spec, diagrams, SETUP, DEPLOYMENT | Complete |
| **3** | Backend & data layer | Prisma, ingest, internal REST API | Complete (Sprint 02 / M3) |
| **4** | Frontend & dashboard | Maps, KPIs, charts | In progress (Sprint 03 / M4) |
| **5** | CI/CD & production | Pipelines, staging, production, MVP release | Planned |

Phases are sequential in intent but allow overlap where discovery (docs/specs) runs ahead of delivery (code).

---

## 8. Schedule and milestones

**Estimated MVP duration:** 8–10 weeks.  
**Target first production release:** early September 2026.  
Dates are **targets** — revised at each sprint close (Section 18).

### Phase timeline

| Phase | Target period | Key deliverables |
|-------|---------------|------------------|
| 0 Foundation | Complete | README, LICENSE, CONTRIBUTING, PR template, docs index |
| 1 Governance | Complete (2026-07-10) | PROJECT_MANAGEMENT, sprints/, ADR-001–005, REQUIREMENTS, EXTERNAL_APIS |
| 2 Specifications | Complete (2026-07-10) | ARCHITECTURE, DATA_MODEL, API_SPEC v1, diagrams, SETUP, DEPLOYMENT, assets |
| 3 Backend | Complete (2026-07-18) | `develop` branch, Prisma, COVID module, tests |
| 4 Frontend | 11–28 Aug 2026 | Dashboard, Leaflet map, charts |
| 5 Deploy | 29 Aug – 7 Sep 2026 | GitHub Actions, DEPLOYMENT, staging + production, `v0.1.0` |

### Milestones

| ID | Target | Completion criteria |
|----|--------|---------------------|
| **M1** | 16 Jul 2026 | PROJECT_MANAGEMENT, ADRs, REQUIREMENTS, EXTERNAL_APIS committed | **Met** (2026-07-10) |
| **M2** | 23 Jul 2026 | ARCHITECTURE, DATA_MODEL, API_SPEC v1, diagrams, SETUP, DEPLOYMENT committed | **Met** (2026-07-10) |
| **M3** | 10 Aug 2026 | Ingest + internal API functional with passing tests | **Met** (2026-07-18) |
| **M4** | 28 Aug 2026 | Dashboard MVP on staging (map, KPIs, minimum chart) |
| **M5** | 7 Sep 2026 | Production deploy, tag `v0.1.0`, public URLs in README |

---

## 9. Work management

All work is tracked in **Linear** with identifier prefix `DEV-XX`.

**Card lifecycle:** `Backlog` → `In Progress` → `In Review` → `Done` (or `Blocked` when dependencies exist).

**Prioritization order:**

1. Technical dependencies (e.g. Prisma before ingest).
2. Nearest open milestone.
3. MVP functional value over polish.

Branch naming, commits, and pull request format: [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 10. Delivery workflow

```
Linear card (DEV-XX)
  → feature branch from develop
  → local development, tests, lint
  → PR → develop (review + CI)
  → merge → staging deploy
  → [sprint end] PR develop → main → tag → production deploy
```

Feature work is **never merged directly to `main`**. Integration happens on `develop`; production promotion happens at sprint release (Section 11).

---

## 11. Environments and release strategy

### 11.1 Branch and environment map

| Branch | Environment | Purpose |
|--------|-------------|---------|
| `DEV-XX-*` | Local | Feature development |
| `develop` | Staging | Integrated, reviewed code |
| `main` | Production | Stable releases only |

### 11.2 Integration flow (during sprint)

1. Create `DEV-XX-<description>` from `develop`.
2. Implement and validate locally (tests, lint).
3. Open pull request into `develop` per [CONTRIBUTING.md](../CONTRIBUTING.md).
4. After review and CI pass, merge to `develop`.
5. **Staging** is updated from `develop` (automated when CI/CD is configured; manual until then).

### 11.3 Production release (end of sprint)

Production is promoted **once per sprint** when sprint DoD is met (Section 12):

1. Confirm `develop` is stable and CI is green.
2. Publish [docs/sprints/sprint-XX.md](./sprints/).
3. Open PR: `develop` → `main` with title `[RELEASE] vX.Y.Z — <summary>`.
4. Merge, create Git tag on `main`.
5. Deploy production.
6. Update [DEPLOYMENT.md](./DEPLOYMENT.md) and [README.md](../README.md) if URLs change.

**Versioning:** [Semantic Versioning](https://semver.org/) — sprint releases typically increment MINOR (features) or PATCH (fixes only).

### 11.4 Exceptions

| Case | Policy |
|------|--------|
| **First production release (M5)** | Tag `v0.1.0` at milestone M5; may align with a sprint boundary |
| **Hotfix** | Branch from `main` → PR to `main` → deploy → backport to `develop` ([CONTRIBUTING.md](../CONTRIBUTING.md)) |
| **Documentation before `develop` exists** | May land on `main` during Phase 0–1; `develop` is created at Phase 3 start |
| **`develop` branch creation** | Phase 3 — first backend implementation |

---

## 12. Definition of Done

DoD defines objective completion criteria at three levels. It prevents partial delivery from being marked complete.

### 12.1 Card (DEV-XX)

- [ ] Scope implemented per Linear card
- [ ] Tests and lint pass locally
- [ ] Pull request opened with template completed and labels applied
- [ ] Self-review completed ([CONTRIBUTING.md](../CONTRIBUTING.md) checklist)
- [ ] CI green (when configured)
- [ ] Documentation or ADR updated if behavior or decisions changed
- [ ] Merged into `develop`
- [ ] Linear card set to **Done**

### 12.2 Sprint

- [ ] Sprint goal achieved or explicitly replanned in sprint record
- [ ] All committed sprint cards meet card DoD
- [ ] [docs/sprints/sprint-XX.md](./sprints/) published
- [ ] Release executed: `develop` → `main`, tag created, production deployed
- [ ] Schedule and risks reviewed if materially changed

### 12.3 MVP (`v0.1.0`)

- [ ] MVP scope in [REQUIREMENTS.md](./REQUIREMENTS.md) satisfied
- [ ] Backend ingest and internal API operational with persisted data
- [ ] Dashboard with map, KPIs, and at least one time-series visualization
- [ ] Staging and production environments deployed
- [ ] [README.md](../README.md) lists public application URLs

---

## 13. Configuration management

| Item | Mechanism |
|------|-----------|
| Source code | Git / GitHub |
| Branches | `main`, `develop`, `DEV-XX-*` |
| Releases | Git tags (`vX.Y.Z`) |
| Architectural decisions | ADRs (supersede by new ADR, not silent edits) |
| Dependencies | Lockfiles committed (`package-lock.json`) |
| Secrets | Environment variables only; `.env` never committed |
| Database schema | Prisma migrations under version control |

---

## 14. Documentation strategy

Documentation is stored in the repository, reviewed in pull requests, and updated when behavior changes.

| Layer | Content |
|-------|---------|
| Process | CONTRIBUTING, this document |
| Product | REQUIREMENTS |
| Design | ARCHITECTURE, DATA_MODEL, API_SPEC, adr/ |
| Execution | sprints/ |
| Operations | SETUP, DEPLOYMENT |

Mandatory repository artifacts: root README, CONTRIBUTING, LICENSE. Additional specifications and ADRs are added per phase (Section 7).

---

## 15. AI-assisted development

AI coding agents may assist with scaffolding, documentation drafts, and repetitive implementation. The card owner remains accountable for scope, review, merge decisions, ADR approval, and security validation.

| Agents may assist | Owner retains |
|-------------------|---------------|
| Code and documentation scaffolding | Linear card ownership |
| Test and specification drafts | Pull request review and merge |
| API and library research | Definition of Done and traceability (`DEV-XX`) |

**Rules:** No merge without DoD; no secrets committed.

---

## 16. Risk management

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| R1 | API Ninjas lacks sufficient historical data | High | Document in EXTERNAL_APIS; ADR-004; Apify contingency |
| R2 | First production deploy takes longer than planned | Medium | Buffer in Phase 5; incremental DEPLOYMENT.md |
| R3 | React Leaflet + Next.js SSR integration | Medium | ADR-005; technical spike early in Phase 4 |
| R4 | MVP scope expansion | High | Explicit MVP in REQUIREMENTS; changes via Linear |
| R5 | External API rate limits | Medium | Server-side cache and scheduled ingest |
| R6 | Schedule slip vs. milestone targets | Medium | Flexible sprint length; date revision each sprint |

Risks are reviewed at sprint close and when milestones slip.

---

## 17. Measurement

Lightweight metrics — no formal velocity or burndown ceremony:

| Metric | Source | Use |
|--------|--------|-----|
| Cards completed per sprint | Linear | Throughput trend |
| Pull requests merged | GitHub | Delivery cadence |
| CI pass rate | GitHub Actions | Quality (from Phase 5) |
| Milestones met | This document | Schedule adherence |
| Release tags | GitHub | Production history |

---

## 18. Sprint management

### 18.1 Sprint cycle

| Stage | Action |
|-------|--------|
| **Planning** | Select Linear cards; define sprint goal |
| **Execution** | Feature branches → PR → `develop` → staging |
| **Review** | Validate card DoD |
| **Release** | `develop` → `main` → production (Section 11.3) |
| **Close** | Publish sprint record; revise dates/risks if needed |

### 18.2 Sprint release checklist

- [ ] Sprint goal met or replanned
- [ ] All sprint cards Done
- [ ] `develop` CI green
- [ ] `docs/sprints/sprint-XX.md` published
- [ ] PR `develop` → `main` merged
- [ ] Tag `vX.Y.Z` on `main`
- [ ] Production deploy completed

Sprint index: [docs/sprints/README.md](./sprints/README.md).  
First sprint record: `sprint-01-foundation.md` — Phase 0 deliverables and Phase 1 progress.

---

## 19. Related documents

| Document | Purpose |
|----------|---------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Git workflow, commits, pull requests |
| [docs/README.md](./README.md) | Documentation index |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Product requirements |
| [docs/sprints/](./sprints/) | Sprint records |
| [docs/adr/](./adr/) | Architecture Decision Records |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Environment and deploy procedures |
