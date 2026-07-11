# Deployment

Staging and production deployment guide for **Global Analytics Dashboard**. Defines environment topology, build and release procedures, secrets, and operational practices for the MVP (`v0.1.0`).

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Last updated** | July 2026 |
| **Target milestone** | M5 — production deploy, tag `v0.1.0` ([PROJECT_MANAGEMENT.md §8](./PROJECT_MANAGEMENT.md#8-schedule-and-milestones)) |

**Related:** [SETUP.md](./SETUP.md) (local) · [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-deployment-view-mvp) · [API_SPEC.md](./API_SPEC.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) (release workflow) · [PROJECT_MANAGEMENT.md §11](./PROJECT_MANAGEMENT.md#11-environments-and-release-strategy)

---

## Table of Contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Environment model](#2-environment-model)
3. [Component topology](#3-component-topology)
4. [Hosting approach (MVP)](#4-hosting-approach-mvp)
5. [Build artifacts](#5-build-artifacts)
6. [Environment variables](#6-environment-variables)
7. [Database migrations](#7-database-migrations)
8. [Release workflow](#8-release-workflow)
9. [CI/CD pipeline (planned)](#9-cicd-pipeline-planned)
10. [Manual deployment (interim)](#10-manual-deployment-interim)
11. [Networking, CORS, and sync protection](#11-networking-cors-and-sync-protection)
12. [Health checks and observability](#12-health-checks-and-observability)
13. [Rollback](#13-rollback)
14. [Public URLs](#14-public-urls)
15. [Current status](#15-current-status)
16. [Traceability](#16-traceability)

---

## 1. Purpose and scope

**In scope:** how `api/`, `web/`, and PostgreSQL are deployed to staging and production; branch-to-environment mapping; secrets; release and rollback procedures; CI/CD target state.

**Out of scope:**

| Topic | Document |
|-------|----------|
| Local developer setup | [SETUP.md](./SETUP.md) |
| Upstream API contracts | [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) |
| Internal REST contract | [API_SPEC.md](./API_SPEC.md) |
| Git branching and PR rules | [CONTRIBUTING.md](../CONTRIBUTING.md) |

---

## 2. Environment model

Three runtime environments support the delivery workflow defined in [PROJECT_MANAGEMENT.md §11](./PROJECT_MANAGEMENT.md#11-environments-and-release-strategy):

| Environment | Git branch | Purpose | Deploy trigger |
|-------------|------------|---------|----------------|
| **Local** | `DEV-XX-*` (feature) | Developer workstation | Manual (`npm run start:dev`, `docker compose up -d`) |
| **Staging** | `develop` | Integrated pre-production validation | Merge to `develop` (automated when CI/CD is live) |
| **Production** | `main` | Stable tagged releases | Sprint release PR `develop` → `main` + tag |

```
feature branch  →  PR  →  develop  →  staging deploy
                              ↓
                    [sprint release PR]
                              ↓
                            main  →  tag vX.Y.Z  →  production deploy
```

Feature work **never merges directly to `main`**. Hotfixes branch from `main` and backport to `develop` per [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 3. Component topology

Each deployed environment runs three logical components:

| Component | Package | Responsibility |
|-----------|---------|----------------|
| **Web** | `web/` | Next.js dashboard — browser-facing UI |
| **API** | `api/` | NestJS backend — internal REST, ingest, Prisma |
| **Database** | Managed PostgreSQL | System of record — accessible only from API |

```
┌─────────────┐     HTTPS      ┌─────────────┐     HTTPS      ┌─────────────┐
│   Browser   │ ─────────────▶ │    web/     │ ─────────────▶ │    api/     │
│  (viewer)   │                │  (Next.js)  │                │  (NestJS)   │
└─────────────┘                └─────────────┘                └──────┬──────┘
                                                                    │ TLS (private)
                                                             ┌──────▼──────┐
                                                             │ PostgreSQL  │
                                                             └─────────────┘

                                                             ┌─────────────┐
                                                             │ API Ninjas  │◀── api/ only
                                                             └─────────────┘
```

Editable diagram: [diagrams/deployment.drawio](./diagrams/deployment.drawio).

### Deployment independence

`api/` and `web/` are **separate deployable units** ([ADR-002](./adr/ADR-002-project-architecture.md)). They may be hosted on different platforms as long as:

1. `web/` can reach `api/` over HTTPS via `NEXT_PUBLIC_API_URL`.
2. `api/` can reach PostgreSQL over a private or TLS connection.
3. Upstream keys (`API_NINJAS_KEY`) exist only in the API runtime.

---

## 4. Hosting approach (MVP)

No cloud provider ADR exists yet. The MVP targets **managed PaaS** services to minimize operational overhead for solo development.

### Recommended topology

| Component | Suggested platform class | Rationale |
|-----------|-------------------------|-----------|
| `web/` | Static/SSR host (e.g. Vercel, Netlify) | Native Next.js support, CDN, preview deploys |
| `api/` | Container or Node PaaS (e.g. Railway, Render, Fly.io) | Long-running NestJS process, cron/scheduling for daily sync |
| PostgreSQL | Managed database on same or paired provider | Connection pooling, backups, staging/prod isolation |

**Decision deadline:** Phase 5 (target 29 Aug – 7 Sep 2026). Document final provider choices in this section when selected.

### Environment isolation

| Rule | Implementation |
|------|----------------|
| Separate databases | Distinct `DATABASE_URL` per staging and production |
| Separate secrets | Unique `API_NINJAS_KEY` per environment if provider quotas require it; otherwise shared key with rate-limit awareness |
| No production data in staging | Staging uses its own database instance; refresh via ingest, not production dumps |

---

## 5. Build artifacts

### API (`api/`)

```bash
cd api
npm ci
npm run build          # outputs dist/
npm run test           # unit tests
npm run test:e2e       # optional pre-deploy gate
```

**Production start:**

```bash
node dist/main.js
# or: npm run start:prod
```

Ensure `PORT` is set by the host (most PaaS inject this automatically).

### Web (`web/`)

```bash
cd web
npm ci
npm run build          # outputs .next/
npm run start          # production server (or platform-native adapter)
```

**Build-time variable:** `NEXT_PUBLIC_API_URL` must point to the deployed API base URL for that environment. Changing it requires a **rebuild** of `web/`.

### Monorepo note

There is **no root workspace**. CI/CD pipelines run `npm ci` and build commands **inside each package directory** independently.

---

## 6. Environment variables

### API runtime secrets

| Variable | Staging | Production | Notes |
|----------|---------|------------|-------|
| `PORT` | Host-provided | Host-provided | Listen port |
| `NODE_ENV` | `production` | `production` | |
| `DATABASE_URL` | Staging DB URL | Production DB URL | TLS required; never commit |
| `API_NINJAS_KEY` | Secret store | Secret store | [EXTERNAL_APIS.md §2](./EXTERNAL_APIS.md#2-security-and-configuration) |
| `APIFY_TOKEN` | Optional | Optional | Contingency provider |

Configure via the hosting platform's secret manager — not in Git, not in client bundles.

### Web build-time / runtime

| Variable | Staging | Production | Notes |
|----------|---------|------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api-staging.<domain>` | `https://api.<domain>` | No trailing slash; exposed to browser |

### Secret rotation

If a key is exposed (commit, log, screenshot):

1. Revoke or rotate in the provider dashboard.
2. Update secrets in staging, then production.
3. Redeploy `api/` (no web rebuild required unless API URL changes).

---

## 7. Database migrations

Schema changes are managed by **Prisma migrations** in `api/` ([ADR-003](./adr/ADR-003-database-choice.md)).

### Deploy sequence

1. Build and deploy `api/` artifact (or run migration job first — see below).
2. Run migrations against the target database:

   ```bash
   cd api
   npx prisma migrate deploy
   ```

3. Verify API health (`GET /health`).
4. Deploy or confirm `web/` build.

**Recommended:** run `prisma migrate deploy` as a **pre-deploy or init step** in CI/CD before starting the new API revision. Never run `prisma migrate dev` against staging or production.

### Connection pooling

For serverless or high-concurrency hosts, use the provider's connection pooler (e.g. PgBouncer) and configure `DATABASE_URL` accordingly. Document pool limits when the provider is chosen.

---

## 8. Release workflow

Aligned with [PROJECT_MANAGEMENT.md §11.3](./PROJECT_MANAGEMENT.md#113-production-release-end-of-sprint) and [CONTRIBUTING.md §Releases](../CONTRIBUTING.md#releases):

### Staging (continuous)

1. Feature PR merges into `develop`.
2. CI runs lint and tests (when configured).
3. Staging deploy picks up `develop` HEAD.

### Production (sprint boundary)

1. Confirm `develop` is stable; staging validated against [REQUIREMENTS.md](./REQUIREMENTS.md) acceptance criteria.
2. Publish sprint record in `docs/sprints/`.
3. Open PR: `develop` → `main` with title `[RELEASE] vX.Y.Z — <summary>`.
4. Merge (squash per feature PR policy does not apply — use merge commit or platform default for release PR).
5. Tag `main`: `git tag vX.Y.Z && git push origin vX.Y.Z`.
6. Deploy production from `main` at the tag.
7. Update [§14 Public URLs](#14-public-urls) and root [README.md](../README.md).

**First production release:** tag `v0.1.0` at milestone M5.

---

## 9. CI/CD pipeline (planned)

Target: **GitHub Actions** workflows in `.github/workflows/` ([PROJECT_MANAGEMENT.md Phase 5](./PROJECT_MANAGEMENT.md#8-schedule-and-milestones)).

### `ci-api.yml` (on PR and push to `develop` / `main`)

| Step | Command |
|------|---------|
| Checkout | `actions/checkout` |
| Setup Node 20 | `actions/setup-node` |
| Install | `cd api && npm ci` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Build | `npm run build` |

### `ci-web.yml` (on PR and push to `develop` / `main`)

| Step | Command |
|------|---------|
| Checkout | `actions/checkout` |
| Setup Node 20 | `actions/setup-node` |
| Install | `cd web && npm ci` |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Deploy workflows (Phase 5)

Separate workflows or jobs triggered on:

| Event | Target |
|-------|--------|
| Push to `develop` | Staging (`api/` + `web/` + migrate) |
| Tag `v*` on `main` | Production |

Deploy jobs require platform-specific secrets (API tokens) configured in GitHub repository settings — never in the workflow file itself.

---

## 10. Manual deployment (interim)

Until CI/CD is configured (Phase 5), deploy manually:

### Staging checklist

- [ ] `develop` is up to date and CI-passing locally (`npm run lint`, `npm test`, `npm run build` in each package)
- [ ] `DATABASE_URL` points to staging PostgreSQL
- [ ] Secrets set on API host (`API_NINJAS_KEY`, etc.)
- [ ] `npx prisma migrate deploy` run against staging DB
- [ ] API deployed and `GET /health` returns `200`
- [ ] `web/` built with `NEXT_PUBLIC_API_URL` = staging API URL
- [ ] Web deployed; dashboard loads and fetches data

### Production checklist

- [ ] Release PR `develop` → `main` merged
- [ ] Tag `vX.Y.Z` created on `main`
- [ ] Production secrets verified (distinct from staging)
- [ ] Migrations applied to production DB
- [ ] API and web deployed from tag
- [ ] Smoke test: map, KPIs, chart render against production API
- [ ] Public URLs updated in README and [§14](#14-public-urls)

---

## 11. Networking, CORS, and sync protection

### HTTPS

Staging and production **must** use HTTPS for browser and API traffic ([API_SPEC.md §2.2](./API_SPEC.md#22-transport)).

### CORS

The API must allow cross-origin requests from the deployed `web/` origin:

| Environment | Allowed origin (example) |
|-------------|-------------------------|
| Staging | `https://staging.<domain>` |
| Production | `https://<domain>` |

Configure in NestJS when the API module is implemented. Local development: `http://localhost:3000`.

### Sync endpoint protection

`POST /sync` is **not** exposed in the public dashboard UI ([API_SPEC.md §3](./API_SPEC.md#3-authentication-and-access)). In deployed environments, protect it via one or more of:

| Control | When to use |
|---------|-------------|
| **Private network only** | API not publicly routable for sync path |
| **IP allowlist** | Operator sync from known addresses |
| **Platform secret header** | Cron job or manual trigger sends `X-Admin-Secret` validated by API |
| **Separate admin subdomain** | `admin-api.<domain>` with additional restrictions |

Document the chosen approach here when implemented.

### Scheduled sync

Production and staging run a **daily ingest job** ([REQ-F-04](./REQUIREMENTS.md)) via platform cron (API PaaS scheduler, GitHub Actions scheduled workflow, or external cron hitting a protected sync endpoint).

---

## 12. Health checks and observability

### Liveness

| Endpoint | Expected | Used by |
|----------|----------|---------|
| `GET /health` | `200` JSON `{ "status": "ok" }` | Load balancer, deploy gate, uptime monitor |

Defined in [API_SPEC.md](./API_SPEC.md). Configure platform health checks against this route.

### Logging

- NestJS structured logs for ingest success/failure ([REQ-NF-07](./REQUIREMENTS.md)).
- **Never** log `API_NINJAS_KEY` or full `DATABASE_URL`.
- Production error responses exclude stack traces ([REQ-F-13](./REQUIREMENTS.md)).

### Metrics (post-MVP)

Application metrics and alerting are out of MVP scope; revisit after `v0.1.0`.

---

## 13. Rollback

### API / Web

Redeploy the **previous known-good tag** or platform revision:

1. Identify last stable tag (e.g. `v0.1.0`).
2. Redeploy `api/` and `web/` from that artifact.
3. Verify `GET /health` and dashboard smoke test.

### Database

Prisma migrations are **forward-only** in production. Rollback strategy:

| Scenario | Action |
|----------|--------|
| Bad deploy, schema unchanged | Redeploy previous API/web revision only |
| Bad migration already applied | Ship a **new forward migration** that reverts the change; avoid `migrate reset` on production |
| Data corruption | Restore from provider backup; document RPO/RTO when host is chosen |

---

## 14. Public URLs

Update this table when staging and production are live (M4/M5):

| Environment | Web URL | API base URL | Status |
|-------------|---------|--------------|--------|
| **Staging** | _TBD_ | _TBD_ | Not deployed |
| **Production** | _TBD_ | _TBD_ | Not deployed |

Also update the root [README.md](../README.md) per [REQ-NF-06](./REQUIREMENTS.md).

---

## 15. Current status

| Item | State |
|------|-------|
| Staging environment | Not provisioned |
| Production environment | Not provisioned |
| GitHub Actions CI | Not configured (`.github/workflows/` pending) |
| Automated deploy | Not configured |
| `develop` branch | Scheduled for Phase 3 ([PROJECT_MANAGEMENT.md §11.4](./PROJECT_MANAGEMENT.md#114-exceptions)) |
| Prisma / ingest / dashboard | In development — deploy targets M4 (staging) and M5 (production) |

Local development is documented in [SETUP.md](./SETUP.md). This document defines the **target** operational model; implementation lands in Phase 5.

---

## 16. Traceability

| Topic | Document |
|-------|----------|
| Environment ↔ branch mapping | [PROJECT_MANAGEMENT.md §11](./PROJECT_MANAGEMENT.md#11-environments-and-release-strategy) |
| Architecture deployment view | [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-deployment-view-mvp) |
| Deployment diagram | [diagrams/deployment.drawio](./diagrams/deployment.drawio) |
| API transport and CORS | [API_SPEC.md §2](./API_SPEC.md#2-conventions) |
| Secrets and upstream keys | [EXTERNAL_APIS.md §2](./EXTERNAL_APIS.md#2-security-and-configuration) |
| Release tagging | [CONTRIBUTING.md §Releases](../CONTRIBUTING.md#releases) |
| CI quality gate | [REQUIREMENTS.md REQ-NF-05](./REQUIREMENTS.md) |
| Local setup | [SETUP.md](./SETUP.md) |
