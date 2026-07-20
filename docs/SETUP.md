# Local development setup

Step-by-step guide to run **Global Analytics Dashboard** on your machine. Covers prerequisites, PostgreSQL via Docker, environment variables, and starting the NestJS API and Next.js web client.

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Last updated** | July 2026 |
| **Audience** | Contributors setting up a local dev environment |

**Related:** [CONTRIBUTING.md](../CONTRIBUTING.md) (workflow) · [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) (API keys) · [ARCHITECTURE.md](./ARCHITECTURE.md) (system design) · [DEPLOYMENT.md](./DEPLOYMENT.md) (staging/production)

---

## Table of Contents

1. [What you are setting up](#1-what-you-are-setting-up)
2. [Prerequisites](#2-prerequisites)
3. [Clone the repository](#3-clone-the-repository)
4. [Start PostgreSQL (Docker)](#4-start-postgresql-docker)
5. [Environment variables](#5-environment-variables)
6. [Install dependencies](#6-install-dependencies)
7. [Run the applications](#7-run-the-applications)
8. [Verify the setup](#8-verify-the-setup)
9. [Day-to-day commands](#9-day-to-day-commands)
10. [Troubleshooting](#10-troubleshooting)
11. [Current limitations](#11-current-limitations)
12. [Traceability](#12-traceability)

---

## 1. What you are setting up

The monorepo contains two Node.js applications and a local database:

| Component | Path | Default URL | Purpose |
|-----------|------|-------------|---------|
| API | `api/` | `http://localhost:3001` | NestJS backend |
| Web | `web/` | `http://localhost:3000` | Next.js frontend |
| PostgreSQL | Docker (`gad-postgres`) | `localhost:5432` | Local relational database |

At the current project phase, the API requires PostgreSQL (via Prisma) to start. The web client runs independently.

---

## 2. Prerequisites

Install the following before proceeding:

| Tool | Minimum version | Notes |
|------|-----------------|-------|
| [Node.js](https://nodejs.org/) | 20 LTS | `node --version` |
| npm | Bundled with Node.js | `npm --version` |
| [Git](https://git-scm.com/) | Any recent | `git --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Recent stable | Engine must be **running** before `docker` commands |

**Not required:** pnpm, yarn, bun, or a native PostgreSQL installation (the database runs in Docker).

### Verify Docker is ready

```bash
docker version
```

**Expected:** Both `Client` and `Server` sections print without hanging.

**If the command hangs or only `Client` appears:** open Docker Desktop, wait until the engine reports **running**, then retry. See [§10 Troubleshooting](#10-troubleshooting).

---

## 3. Clone the repository

```bash
git clone <repo-url>
cd global-analytics-dashboard
```

Replace `<repo-url>` with the actual remote URL of this repository.

---

## 4. Start PostgreSQL (Docker)

From the **repository root**:

```bash
docker compose up -d
```

**What it does:** pulls `postgres:16-alpine`, creates container `gad-postgres`, and exposes port `5432`.

**Expected output (abbreviated):**

```
Container gad-postgres  Started
```

Confirm the container is healthy:

```bash
docker ps
```

**Expected:** a row for `gad-postgres` with status `Up` (and ideally `healthy`).

### Connection details

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `global_analytics` |
| User | `gad` |
| Password | `gad` |
| URL | `postgresql://gad:gad@localhost:5432/global_analytics` |

These values match `docker-compose.yml` and `api/.env.example`.

### Stop or reset the database

```bash
# Stop container (data preserved in Docker volume)
docker compose down

# Stop and remove volume (destructive — wipes local data)
docker compose down -v
```

---

## 5. Environment variables

Secrets and local overrides live in per-package `.env` files. Templates are committed; real `.env` files are **gitignored** — never commit them.

### API (`api/.env`)

```bash
cp api/.env.example api/.env
```

Edit `api/.env`:

| Variable | Required now | Description |
|----------|--------------|-------------|
| `PORT` | Recommended | API listen port. Default `3001` (loaded from `api/.env` via ConfigModule). |
| `NODE_ENV` | No | `development` for local work |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (see [§4](#4-start-postgresql-docker)) |
| `API_NINJAS_KEY` | For upstream calls | API Ninjas key (`X-Api-Key`) — optional at app boot; required when invoking `ApiNinjasClient` — [EXTERNAL_APIS.md §2](./EXTERNAL_APIS.md#2-security-and-configuration) |
| `API_NINJAS_TIMEOUT_MS` | No | Upstream HTTP timeout (1000–60000 ms). Default `15000` |
| `APIFY_TOKEN` | No | Contingency provider (future phases) |

Obtain an API Ninjas key at [api-ninjas.com](https://api-ninjas.com/). The same account key can be reused across machines; copy it into `api/.env` on each workstation.

### Web (`web/.env`)

```bash
cp web/.env.example web/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the NestJS API (no trailing slash), e.g. `http://localhost:3001` |

> **Security:** `NEXT_PUBLIC_*` variables are embedded in the client bundle. Never put upstream API keys or database credentials in `web/.env`.

### Loading `.env` files

| Package | `.env` auto-loaded? |
|---------|---------------------|
| `web/` | Yes — Next.js reads `.env` on `npm run dev` |
| `api/` | Yes — `ConfigModule` loads `api/.env` on startup |

---

## 6. Install dependencies

Dependencies are managed **per package** (not a root workspace). Run `npm install` in each:

```bash
cd api && npm install
cd ../web && npm install
```

Lockfiles (`package-lock.json`) are committed — use `npm install`, not `npm update`, unless intentionally upgrading dependencies.

### Database migrations (API)

From the repo root, ensure PostgreSQL is running (`docker compose up -d`), then:

```bash
cd api
cp .env.example .env   # if not done yet
npm run prisma:generate
npx prisma migrate deploy
```

**Expected:** `All migrations have been successfully applied.`

For schema changes during development, use `npm run prisma:migrate` (creates and applies a new migration locally).

---

## 7. Run the applications

Use **two terminals** — one for the API, one for the web client.

### API (terminal 1)

**macOS / Linux (bash):**

```bash
cd api
npm run start:dev
```

**Windows (PowerShell):**

```powershell
cd api
npm run start:dev
```

`PORT` is read from `api/.env` (default `3001`). Override in the shell only if needed: `PORT=3002 npm run start:dev`.

**Expected output (abbreviated):**

```
[Nest] ... LOG [NestApplication] Nest application successfully started
```

Default URL: **http://localhost:3001**

### Web (terminal 2)

```bash
cd web
npm run dev
```

**Expected output (abbreviated):**

```
▲ Next.js ...
- Local: http://localhost:3000
✓ Ready
```

Default URL: **http://localhost:3000**

### Port summary

| Service | Port |
|---------|------|
| Web | `3000` |
| API | `3001` |
| PostgreSQL | `5432` |

---

## 8. Verify the setup

| Check | Command / action | Expected |
|-------|------------------|----------|
| API responds | Open http://localhost:3001 | NestJS default greeting on `GET /` |
| Web loads | Open http://localhost:3000 | Next.js starter page |
| Database up | `docker ps` | `gad-postgres` status `Up` |
| API lint | `cd api && npm run lint` | No errors |
| Web lint | `cd web && npm run lint` | No errors |
| API tests | `cd api && npm test` | Tests pass |
| Prisma client | `cd api && npm run prisma:generate` | Client generated |
| Migrations | `cd api && npx prisma migrate deploy` | Migrations applied |

---

## 9. Day-to-day commands

| Task | Command (from repo root unless noted) |
|------|---------------------------------------|
| Start database | `docker compose up -d` |
| Stop database | `docker compose down` |
| API dev (watch) | `npm run start:dev` in `api/` |
| Prisma generate | `npm run prisma:generate` in `api/` |
| Prisma migrate (dev) | `npm run prisma:migrate` in `api/` |
| Apply migrations | `npx prisma migrate deploy` in `api/` |
| Web dev | `npm run dev` in `web/` |
| API unit tests | `npm test` in `api/` |
| API e2e tests | `npm run test:e2e` in `api/` |
| Lint API | `npm run lint` in `api/` |
| Lint web | `npm run lint` in `web/` |

### Integration / e2e against PostgreSQL (DEV-87)

Strategy: **Option A** — real Postgres (Docker) for integration confidence; mock upstream HTTP so CI never calls API Ninjas. SQLite is forbidden ([ADR-003](./adr/ADR-003-database-choice.md)).

1. `docker compose up -d` from repo root  
2. Optional: `cp api/.env.test.example api/.env.test`  
3. `cd api && npx prisma migrate deploy`  
4. `npm run test:e2e`

Shared helpers live in `api/test/helpers/` (`createTestApp`, `truncateAllTables`, `seedCovidFixtures`). Truncate isolates suites; fixtures use deterministic roll-up totals for API_SPEC §11.

---

## 10. Troubleshooting

### `docker` commands hang with no output

**Cause:** Docker Desktop is open but the engine is not responding.

**Fix:**

1. Quit Docker Desktop completely (tray icon → Quit).
2. End lingering `Docker` processes in Task Manager if needed.
3. On Windows, optionally run `wsl --shutdown` in an elevated PowerShell, then reopen Docker Desktop.
4. Wait until the UI shows the engine **running**, then run `docker version` again.

### `Error: listen EADDRINUSE :::3001`

**Cause:** Another process (often a previous API instance) already uses port `3001`.

**Fix:**

1. Stop the old terminal running the API (`Ctrl+C`), **or**
2. Find and kill the process:

   **Windows (PowerShell):**

   ```powershell
   netstat -ano | findstr :3001
   taskkill /PID <pid> /F
   ```

   **macOS / Linux:**

   ```bash
   lsof -i :3001
   kill <pid>
   ```

3. Start the API again.

### Next.js warning about multiple `package-lock.json` files

**Symptom:**

```
Warning: Next.js inferred your workspace root, but it may not be correct.
Detected additional lockfiles: ...
```

**Cause:** A stray `package-lock.json` exists outside the `web/` directory (e.g. in the user home folder).

**Fix:** Remove the unrelated lockfile if it is not needed, or configure `turbopack.root` in `web/next.config.ts` per [Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory). The app still runs; this is a warning only.

### API listens on port `3000` instead of `3001`

**Cause:** `PORT` is missing from `api/.env` and the shell override was not set.

**Fix:** Ensure `api/.env` contains `PORT=3001`, then restart the API.

### Web cannot reach the API

**Checklist:**

1. API is running on `http://localhost:3001`.
2. `web/.env` has `NEXT_PUBLIC_API_URL=http://localhost:3001` (no trailing slash).
3. Restart `npm run dev` after changing `web/.env`.

### PostgreSQL connection refused

1. `docker ps` — is `gad-postgres` running?
2. If not: `docker compose up -d` from the repo root.
3. Confirm `DATABASE_URL` in `api/.env` matches [§4](#4-start-postgresql-docker).

---

## 11. Current limitations

Reflects the **current development phase** documented in the root [README.md](../README.md):

| Area | State |
|------|-------|
| `api/` | Complete (Sprint 02) — ConfigModule, Prisma, API Ninjas client, ingest, sync orchestration, COVID read API |
| `web/` | Dashboard shell + typed API client (`web/lib/api/`); map, KPIs, chart, and selection context in progress (Sprint 03) |
| PostgreSQL | Docker Compose; required for API startup |
| Prisma ORM | Configured — `api/prisma/schema.prisma` + initial migration |
| API Ninjas client | Implemented — `api/src/integration/api-ninjas/` |
| Metric normalizer & upsert | Implemented — `api/src/ingest/` |
| Sync orchestration | Implemented — `POST /sync`, status endpoints — `api/src/sync/` |
| Dashboard UI | Shell + placeholders; interactive map/KPIs/chart pending (DEV-90+) |

Start Docker before running the API (`docker compose up -d` from repo root).

---

## 12. Traceability

| Topic | Document |
|-------|----------|
| Technology choices | [ADR-001](./adr/ADR-001-technology-stack.md) |
| Monorepo layout | [ADR-002](./adr/ADR-002-project-architecture.md) |
| PostgreSQL + Prisma | [ADR-003](./adr/ADR-003-database-choice.md) |
| Upstream API keys | [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) |
| Contribution workflow | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Staging / production | [DEPLOYMENT.md](./DEPLOYMENT.md) |
