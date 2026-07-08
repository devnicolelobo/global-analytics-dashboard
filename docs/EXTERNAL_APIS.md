# External APIs

Upstream data sources for **Global Analytics Dashboard**. Server-side integration only — see [ADR-002](./adr/ADR-002-project-architecture.md) and [ADR-004](./adr/ADR-004-api-provider.md).

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Last updated** | July 2026 |
| **Validated** | July 2026 (live API Ninjas probe) |

---

## Table of Contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Security and configuration](#2-security-and-configuration)
3. [Primary provider — API Ninjas](#3-primary-provider--api-ninjas)
4. [Normalized domain mapping](#4-normalized-domain-mapping)
5. [Ingest strategy (MVP)](#5-ingest-strategy-mvp)
6. [Gaps, risks, and mitigations](#6-gaps-risks-and-mitigations)
7. [Contingency provider — Apify](#7-contingency-provider--apify)
8. [Traceability](#8-traceability)

---

## 1. Purpose and scope

This document records **factual contracts** for external COVID-19 data: endpoints, parameters, response shapes, limits, and how they map to [REQUIREMENTS.md](./REQUIREMENTS.md) and the future [DATA_MODEL.md](./DATA_MODEL.md).

**In scope:** API Ninjas (primary), Apify (contingency outline).

**Out of scope:** Internal REST API design ([API_SPEC.md](./API_SPEC.md)), Prisma schema ([DATA_MODEL.md](./DATA_MODEL.md)).

---

## 2. Security and configuration

| Rule | Implementation |
|------|----------------|
| Keys never in `web/` | All upstream HTTP from `api/` only |
| Keys never in Git | `api/.env` gitignored; template in `api/.env.example` |
| Production | Set `API_NINJAS_KEY` (and optional `APIFY_TOKEN`) in host secrets |

### Environment variables

| Variable | Required | Location | Description |
|----------|----------|----------|-------------|
| `API_NINJAS_KEY` | Yes (primary path) | `api/.env` / deploy secrets | API Ninjas account key (`X-Api-Key` header) |
| `APIFY_TOKEN` | No (until contingency activated) | `api/.env` / deploy secrets | Apify API token |

Local setup:

```bash
cp api/.env.example api/.env
# Edit api/.env — set API_NINJAS_KEY only on your machine
```

**If a key is exposed** (chat, commit, screenshot): revoke or rotate it in the provider dashboard and update local/deploy secrets.

---

## 3. Primary provider — API Ninjas

| Field | Value |
|-------|-------|
| **Provider** | [API Ninjas](https://api-ninjas.com/) |
| **Product** | [COVID-19 API](https://api-ninjas.com/api/covid19) |
| **Base URL** | `https://api.api-ninjas.com` |
| **Endpoint** | `GET /v1/covid19` |
| **Authentication** | Header `X-Api-Key: <API_NINJAS_KEY>` |
| **Documentation** | https://api-ninjas.com/api/covid19 |

### 3.1 Query parameters

Either `date` **or** `country` must be set (per provider docs).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `country` | Conditional | Country name, case-insensitive (e.g. `Brazil`, `United States`) |
| `date` | Conditional | Single-day global snapshot, format `YYYY-MM-DD` |
| `type` | No | `cases` (default) or `deaths` |
| `region` | No | Subnational region; requires `country` |
| `county` | No | US county; requires `country` + `region` |

### 3.2 Response modes

The API returns **two distinct shapes** depending on query mode.

#### Mode A — Time series (`country` set)

Returns a JSON **array** of objects (one per region when subnational data exists).

```json
{
  "country": "Canada",
  "region": "Alberta",
  "cases": {
    "2020-01-22": { "total": 0, "new": 0 },
    "2020-01-23": { "total": 0, "new": 0 }
  }
}
```

When `type=deaths`, the time-series object key is **`deaths`** (not `cases`):

```json
{
  "country": "Canada",
  "region": "Alberta",
  "deaths": {
    "2020-01-22": { "total": 0, "new": 0 }
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `country` | string | Country name (provider spelling) |
| `region` | string | Empty string when country-level only |
| `cases` / `deaths` | object | Keys = date `YYYY-MM-DD`; values = `{ total, new }` |

**Empirical notes (July 2026):**

- `country=Canada` → **16** region rows (provinces/territories); ingest must **aggregate** to country level for MVP map/KPIs or store region + roll up in queries.
- `country=Brazil` → **1** row (no subnational split).
- `country=United States` → **1** row in probe (country-aggregated).
- Latest case dates observed for Brazil: **2023-03-09** (series does not extend to current date).

#### Mode B — Global snapshot (`date` set)

Returns a JSON **array** of country/region rows for that calendar day.

```json
{
  "country": "Brazil",
  "region": "",
  "cases": {
    "total": 37076053,
    "new": 0
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `cases` | object | Single `{ total, new }` — **not** keyed by date |
| `deaths` | object | Same shape when `type=deaths` |

**Empirical notes (July 2026):**

- `date=2023-03-09` → **289** rows (countries + regional rows).
- `date=2024-06-01` → **0** rows (no data returned — use dates within provider coverage).
- Useful for **bulk daily ingest** of all countries in one request per date.

### 3.3 Field catalogue vs product requirements

| REQUIREMENTS metric | API Ninjas support | MVP mapping |
|---------------------|-------------------|-------------|
| Confirmed cases | Yes (`type=cases`, `total` / `new`) | KPI + chart + map |
| Deaths | Yes (`type=deaths`, `total` / `new`) | KPI + map |
| Active cases | **No dedicated field** | **Fallback:** use **`new` cases** (latest day) as third KPI, or omit active and document in DATA_MODEL — see [§6](#6-gaps-risks-and-mitigations) |
| Tests / recovered | **Not observed** in responses | Not available on primary path |
| Time series chart | Yes | Per-country `cases` time series; history ends ~2023 in probe |
| Country-level map | Yes | Snapshot by `date` or latest `total` from series |

### 3.4 Rate limits and quotas

| Topic | Guidance |
|-------|----------|
| **Official limits** | Tied to API Ninjas plan (monthly call quota); see account dashboard |
| **Caching** | Paid tiers allow storing responses in PostgreSQL (required for this architecture) |
| **MVP ingest budget** | Prefer `date` snapshot (1 call/day for global) + targeted `country` pulls for series backfill; avoid per-country daily polling for all countries |
| **Failure handling** | Per REQ-F-05: log error, retain last good persist |

Exact quota for the project account: record in operator notes / Linear when plan is confirmed.

### 3.5 Provider update cadence

Documentation states daily updates. **Empirical validation:** latest series point **2023-03-09** for Brazil — treat provider data as **historical archive**, not live pandemic tracking, unless a re-probe shows newer dates.

---

## 4. Normalized domain mapping

Target persistence shape: [DATA_MODEL.md](./DATA_MODEL.md).

| Normalized field | Source |
|------------------|--------|
| `countryCode` | Derived via ISO mapping table from `country` name |
| `countryName` | `country` |
| `region` | `region` (nullable; MVP UI uses country roll-up) |
| `referenceDate` | Date key (series) or snapshot `date` param |
| `casesTotal` | `cases[date].total` or `cases.total` |
| `casesNew` | `cases[date].new` or `cases.new` |
| `deathsTotal` | `deaths[date].total` or `deaths.total` |
| `deathsNew` | `deaths[date].new` or `deaths.new` |
| `source` | `api-ninjas` |
| `ingestedAt` | Server timestamp at sync |

Natural key for upsert: `(countryCode, region, referenceDate)` — see [DATA_MODEL.md](./DATA_MODEL.md).

---

## 5. Ingest strategy (MVP)

Aligned with [REQUIREMENTS.md](./REQUIREMENTS.md) REQ-F-01–06.

| Job | API call | Purpose |
|-----|----------|---------|
| **Daily global sync** | `GET /v1/covid19?date=<latest_available>` | Map choropleth + global KPIs |
| **Deaths overlay** | Same `date` with `type=deaths` | Death totals for KPIs/map |
| **Series backfill** | `GET /v1/covid19?country=<name>` per prioritized country set | Time-series chart |
| **Deaths series** | `&type=deaths` per country | Death trends (post-MVP or if chart expanded) |

**Country name catalogue:** Build static mapping `country name → ISO 3166-1 alpha-2` during ingest (seed list from snapshot response).

**Regional aggregation:** For countries returning multiple regions, sum `total` / `new` per `referenceDate` when serving MVP country-level endpoints.

**Operator trigger:** Manual sync in development; cron daily in staging/production.

---

## 6. Gaps, risks, and mitigations

| ID | Gap | Severity | Mitigation |
|----|-----|----------|------------|
| **G-01** | No **active cases** field | Medium | Third KPI → **new cases** (latest day) or **casesNew** aggregate; update REQUIREMENTS REQ-F-33 note if product owner accepts |
| **G-02** | Data ends ~**2023-03** in probe | High | Document in UI as historical dataset; activate Apify contingency (R1) if fresher data required for MVP narrative |
| **G-03** | Subnational rows (e.g. Canada) | Medium | Roll up to country in ingest or API layer |
| **G-04** | Country names are strings, not ISO | Medium | Maintain mapping table; failures logged for unmapped names |
| **G-05** | `date` requests outside coverage return `[]` | Low | Detect empty response; do not wipe DB; log warning |
| **G-06** | `type=deaths` uses `deaths` key, not `cases` | Low | Normalizer handles both keys |

Cross-reference: [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) risk **R1**.

---

## 7. Contingency provider — Apify

Activated only if primary data is insufficient (ADR-004, G-02).

| Field | Value |
|-------|-------|
| **Platform** | [Apify](https://apify.com/) |
| **Auth** | `APIFY_TOKEN` query param or header per Apify API |
| **Status** | Not integrated in MVP default path |

### Candidate actors (evaluation pending)

| Actor | ID | Notes |
|-------|-----|-------|
| COVID-19 aggregator | `petrpatek/covid-19-aggregator` | Aggregates legacy Apify COVID actors; key-value `LATEST` record |
| Disease.sh global stats | `parseforge/disease-sh-global-stats-scraper` | Country-level cases/deaths/recovered/active via disease.sh |
| Worldometers scraper | `lulzasaur/worldometers-scraper` | Coronavirus mode with cases/deaths/recovered |

**Selection criteria when activating:** country coverage, field parity with REQ-F-33, historical depth, cost per run, terms of use.

**Integration pattern:** NestJS contingency module behind same normalizer interface; `source=apify` in persistence; feature flag or config switch — no frontend changes.

---

## 8. Traceability

| Artifact | Link |
|----------|------|
| Provider decision | [ADR-004](./adr/ADR-004-api-provider.md) |
| Product requirements | [REQUIREMENTS.md](./REQUIREMENTS.md) §5–6 (A-01–A-03) |
| Assumption validation | G-01–G-06 above |
| Secrets template | `api/.env.example` |
| Future schema | [DATA_MODEL.md](./DATA_MODEL.md) (planned) |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | MVP functional requirements |
| [API_SPEC.md](./API_SPEC.md) | Internal REST contract (planned) |
| [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) | Risk register |
