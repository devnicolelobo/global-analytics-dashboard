# Contributing to Global Analytics Dashboard

This document defines the development workflow, branching model, commit conventions, and pull request standards for this repository.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Linear Integration](#linear-integration)
3. [Branch Strategy](#branch-strategy)
4. [Branch Naming](#branch-naming)
5. [Conventional Commits](#conventional-commits)
6. [Pull Requests](#pull-requests)
7. [Pull Request Template](#pull-request-template)
8. [Code Quality](#code-quality)
9. [Review Checklist](#review-checklist)
10. [Releases](#releases)
11. [Hotfixes](#hotfixes)
12. [Local Setup](#local-setup)

---

## Workflow Overview

```
Linear card (DEV-XX)
  → feature branch (from develop)
  → implementation + tests + lint
  → pull request → develop (CI green)
  → merge → staging deploy
  → release PR develop → main → production deploy
```

All changes must be traceable to a Linear card. Direct commits to `main` or `develop` are not permitted.

---

## Linear Integration

| Item | Convention |
|------|------------|
| Tool | [Linear](https://linear.app) |
| Identifier | `DEV-XX` (e.g. `DEV-01`, `DEV-15`) |
| Branch | Must include the card ID |
| PR title | `[DEV-XX] <summary>` |
| PR body | Must link to the Linear card URL |

Blocked dependencies must be tracked in Linear (`blocks` / `blocked by`). The default integration branch for development is `develop`.

---

## Branch Strategy

| Branch | Purpose | Environment |
|--------|---------|-------------|
| `main` | Production-ready code | Production |
| `develop` | Feature integration | Staging |
| `DEV-XX-*` | Short-lived feature branches | — |

### Rules

- Create feature branches from `develop`
- Open pull requests into `develop`
- Promote to production only via release pull request (`develop` → `main`)
- Force-push to `main` or `develop` is prohibited

### Branch protection (GitHub)

`main` and `develop` are protected on GitHub:

| Rule | Setting |
|------|---------|
| Force push | Disabled (enforced for admins too) |
| Branch deletion | Disabled (enforced for admins too) |
| Required status check | `CI API / api` must pass before merge |

Do not attempt `git push --force` to either branch. Use pull requests for feature work. CI runs on every PR and push to `main` / `develop` (see `.github/workflows/ci-api.yml`).

---

## Branch Naming

```
DEV-XX-<short-description>
```

**Examples**

```
DEV-01-setup-prisma-postgresql
DEV-05-covid-ingest-service
DEV-12-interactive-map-dashboard
```

**Conventions**

- Prefix with the Linear card ID
- `short-description` in kebab-case, lowercase, English
- No fixed word limit — prioritize clarity and uniqueness
- No spaces, accents, or special characters

---

## Conventional Commits

This project follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no logic change) |
| `refactor` | Refactoring without behavior change |
| `perf` | Performance improvement |
| `test` | Add or update tests |
| `build` | Build system or dependencies |
| `ci` | CI/CD pipeline |
| `chore` | General maintenance |

### Scope (recommended)

Use the affected package or module:

`api`, `web`, `prisma`, `covid`, `dashboard`, `docs`, `ci`

### Linear reference (footer)

Include the card ID in the footer when applicable:

```
feat(api): add country snapshot ingest endpoint

Implement scheduled sync from API Ninjas with Prisma upsert.

Refs: DEV-05
```

### Rules

- Subject in English, imperative mood, ≤ 72 characters
- No trailing period on the subject line
- Breaking changes: `feat(api)!: ...` or footer `BREAKING CHANGE:`
- One logical concern per commit

---

## Pull Requests

### Prerequisites

- [ ] Linear card exists and is in an active state
- [ ] Branch is up to date with `develop`
- [ ] All tests pass locally
- [ ] Lint passes locally
- [ ] No secrets or `.env` files committed
- [ ] Documentation and ADRs updated when applicable

### Requirements

- Title: `[DEV-XX] <summary>`
- Body filled according to the [pull request template](.github/pull_request_template.md)
- GitHub labels applied — one or more, as relevant (see [Labels](#labels))
- CI pipeline green before merge
- Self-review completed (see [Review Checklist](#review-checklist))

### Labels

Apply labels manually in GitHub when opening a pull request. Use **one or more** labels that describe the change. There is no fixed label list — create and apply labels that fit the context (e.g. `api`, `web`, `docs`, `feature`, `bugfix`, `integration`).

Record the labels applied in the pull request body for traceability.

### Merge policy

- **Squash merge** for feature pull requests
- Delete branch after merge
- Update Linear card status after merge

---

## Pull Request Template

Use the template at [`.github/pull_request_template.md`](.github/pull_request_template.md).

Required sections:

| Section | Content |
|---------|---------|
| **Objective** | What the change delivers and why it is needed |
| **Linear** | Card identifier and link |
| **Labels** | Labels applied in GitHub (recorded in PR body) |
| **Changes** | Concrete list of modifications |
| **Tests** | Results, coverage by layer, commands executed |

---

## Code Quality

### API (`api/`)

- TypeScript strict mode
- ESLint + Prettier via `npm run lint`
- Business logic in services; controllers orchestrate only
- Unit tests for services; integration tests for HTTP layer
- Secrets exclusively via environment variables

### Web (`web/`)

- Next.js App Router + React + TypeScript
- ESLint via `npm run lint`
- Tests for critical components and flows
- No API keys exposed in the client bundle

### General

- Code, commits, pull requests, and documentation in **English**
- Follow existing project structure and naming conventions
- Record significant architectural decisions in ADRs (`docs/adr/`)

---

## Review Checklist

- [ ] Scope aligned with the Linear card — no unrelated changes
- [ ] Tests cover happy path and primary error paths
- [ ] No hardcoded secrets or API keys
- [ ] Explicit error handling — no silent failures
- [ ] Public API contract changes are documented
- [ ] Database migrations are consistent and documented
- [ ] Pull request description accurately reflects the diff

---

## Releases

1. Validate `develop` stability
2. Open pull request: `develop` → `main`
3. Title: `[RELEASE] vX.Y.Z — <summary>`
4. Tag `main` after merge: `git tag vX.Y.Z`
5. Trigger production deploy from `main`

### Versioning

Follow [Semantic Versioning](https://semver.org/):

| Bump | Criteria |
|------|----------|
| MAJOR | Breaking change |
| MINOR | Backward-compatible feature |
| PATCH | Bug fix only |

---

## Hotfixes

1. Create branch from `main`: `DEV-XX-hotfix-<description>`
2. Apply fix and tests
3. Open pull request into `main`
4. Tag patch release (e.g. `v0.1.1`)
5. Backport to `develop` via pull request or merge `main` → `develop`

---

## Local Setup

Full instructions: [`docs/SETUP.md`](docs/SETUP.md).

```bash
git clone <repo-url>
cd global-analytics-dashboard

cd api && npm install && cp .env.example .env && npm run start:dev
cd web && npm install && cp .env.example .env && npm run dev
```

Required environment variables are listed in each package `.env.example` file.
