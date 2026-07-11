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

At the current project phase, the API and web scaffolds run independently. PostgreSQL is provisioned for upcoming Prisma work; the database is **not yet required** to start the API or web client.

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
| `PORT` | Recommended | API listen port. Use `3001` to avoid clashing with the web dev server. |
| `NODE_ENV` | No | `development` for local work |
| `DATABASE_URL` | When Prisma is added | PostgreSQL connection string (see [§4](#4-start-postgresql-docker)) |
| `API_NINJAS_KEY` | When ingest is implemented | API Ninjas key — [EXTERNAL_APIS.md §2](./EXTERNAL_APIS.md#2-security-and-configuration) |
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
| `api/` | **Not yet** — NestJS does not load `api/.env` until `ConfigModule` (or equivalent) is added. Set `PORT` via the shell when starting the API (see [§7](#7-run-the-applications)). `DATABASE_URL` and `API_NINJAS_KEY` will take effect once the data layer and ingest modules are wired. |

---

## 6. Install dependencies

Dependencies are managed **per package** (not a root workspace). Run `npm install` in each:

```bash
cd api && npm install
cd ../web && npm install
```

Lockfiles (`package-lock.json`) are committed — use `npm install`, not `npm update`, unless intentionally upgrading dependencies.

---

## 7. Run the applications

Use **two terminals** — one for the API, one for the web client.

### API (terminal 1)

**macOS / Linux (bash):**

```bash
cd api
PORT=3001 npm run start:dev
```

**Windows (PowerShell):**

```powershell
cd api
$env:PORT=3001; npm run start:dev
```

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
| API tests | `cd api && npm test` | Tests pass (scaffold defaults) |

---

## 9. Day-to-day commands

| Task | Command (from repo root unless noted) |
|------|---------------------------------------|
| Start database | `docker compose up -d` |
| Stop database | `docker compose down` |
| API dev (watch) | `PORT=3001 npm run start:dev` in `api/` |
| Web dev | `npm run dev` in `web/` |
| API unit tests | `npm test` in `api/` |
| API e2e tests | `npm run test:e2e` in `api/` |
| Lint API | `npm run lint` in `api/` |
| Lint web | `npm run lint` in `web/` |

When Prisma is introduced, database migrations will be documented here (e.g. `npx prisma migrate dev` in `api/`).

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

**Cause:** `PORT` was not set in the shell and NestJS falls back to `3000` (`api/src/main.ts`).

**Fix:** Always pass `PORT=3001` when starting the API until `ConfigModule` loads `api/.env` automatically.

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

Reflects the **initial development phase** documented in the root [README.md](../README.md):

| Area | State |
|------|-------|
| `api/` | NestJS scaffold — default `GET /` route |
| `web/` | Next.js scaffold — starter page |
| PostgreSQL | Docker Compose defined; container can run locally |
| Prisma ORM | Not configured — no `api/prisma/` yet |
| API Ninjas ingest | Not implemented — key is prepared in `api/.env` for future work |
| Dashboard UI | Not implemented |

You can develop and run the scaffolds without PostgreSQL. Start Docker when working on database-related tasks.

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
