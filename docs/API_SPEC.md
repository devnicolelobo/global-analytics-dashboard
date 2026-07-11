# API Specification

Internal REST API contract for **Global Analytics Dashboard** — NestJS (`api/`) consumed by Next.js (`web/`).

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Last updated** | July 2026 |
| **Implementation path** | `api/src/` modules (Phase 3) |

This document defines **HTTP resources**, **request/response shapes**, **aggregation rules**, and **error handling**. Persistence entities: [DATA_MODEL.md](./DATA_MODEL.md). Product requirements: [REQUIREMENTS.md](./REQUIREMENTS.md).

---

## Table of Contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Conventions](#2-conventions)
3. [Authentication and access](#3-authentication-and-access)
4. [Error responses](#4-error-responses)
5. [Metadata and freshness](#5-metadata-and-freshness)
6. [Read endpoints](#6-read-endpoints)
7. [Sync endpoints](#7-sync-endpoints)
8. [Aggregation rules](#8-aggregation-rules)
9. [DTO reference](#9-dto-reference)
10. [Frontend usage map](#10-frontend-usage-map)
11. [Testing and acceptance](#11-testing-and-acceptance)
12. [Traceability](#12-traceability)

---

## 1. Purpose and scope

**In scope:** read-only COVID metrics API for the dashboard; operator sync trigger and sync status; stable JSON contracts for Phase 3 implementation and Phase 4 frontend integration.

**Out of scope:**

| Topic | Document |
|-------|----------|
| Upstream HTTP contracts | [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) |
| Prisma schema / ER | [DATA_MODEL.md](./DATA_MODEL.md) |
| Deployment URLs and CORS policy | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Public third-party API / versioning policy | Post-MVP |

---

## 2. Conventions

### 2.1 Base URL

| Environment | Base URL (example) |
|-------------|-------------------|
| **Local** | `http://localhost:3001` |
| **Staging / production** | Configured via `NEXT_PUBLIC_API_URL` in `web/` |

All paths below are **relative to the API base URL**. NestJS MAY apply a global prefix (e.g. `/api`); if so, base URL in `web/` must include that prefix.

Default listen port: `PORT` env var (recommend **3001** locally to avoid clashing with Next.js on 3000).

### 2.2 Transport

| Rule | Value |
|------|-------|
| Protocol | HTTPS in staging/production; HTTP acceptable locally |
| Format | `application/json` request and response bodies |
| Charset | UTF-8 |
| Date format | ISO 8601 calendar date: `YYYY-MM-DD` |
| Date-time format | ISO 8601 UTC: `YYYY-MM-DDTHH:mm:ss.sssZ` |
| Country codes | ISO 3166-1 alpha-2, **uppercase** (e.g. `BR`, `US`, `CA`) |
| Field naming | **camelCase** in JSON (matches Prisma/NestJS DTOs) |
| Nullability | Omitted nullable fields MAY be returned as `null`; clients must tolerate both |

### 2.3 HTTP methods (MVP)

| Method | Usage |
|--------|-------|
| `GET` | All dashboard read operations |
| `POST` | Manual sync trigger only |

No `PUT`, `PATCH`, or `DELETE` from clients in MVP.

### 2.4 Success status codes

| Code | When |
|------|------|
| `200 OK` | Successful `GET` or completed synchronous operation |
| `202 Accepted` | Sync accepted and running asynchronously (preferred for `POST /sync`) |

---

## 3. Authentication and access

| Actor | Access |
|-------|--------|
| **Viewer** (`web/` on behalf of browser) | Read endpoints only |
| **Operator** | `POST /sync` (manual trigger) |

**MVP:** No authentication or API keys on internal endpoints. Sync trigger is **not** exposed in the public UI; protect staging/production via network posture (private admin route, IP allowlist, or platform secret) as documented in [DEPLOYMENT.md](./DEPLOYMENT.md).

Upstream API keys (`API_NINJAS_KEY`) remain **server-only** — never sent to the browser ([REQ-NF-01](./REQUIREMENTS.md)).

---

## 4. Error responses

All error responses use a **stable envelope** ([REQ-F-13](./REQUIREMENTS.md)). Production responses MUST NOT include stack traces.

### 4.1 Error envelope

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Country 'ZZ' not found",
  "timestamp": "2026-07-08T18:30:00.000Z",
  "path": "/covid/countries/ZZ"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | `number` | HTTP status |
| `error` | `string` | Short error category (NestJS default phrase) |
| `message` | `string` | Human-readable detail (safe for UI fallback) |
| `timestamp` | `string` | ISO 8601 UTC |
| `path` | `string` | Request path |

### 4.2 Standard status codes

| Code | When |
|------|------|
| `400 Bad Request` | Invalid query param, malformed country code, invalid date range |
| `404 Not Found` | Unknown `countryCode` |
| `409 Conflict` | Sync already running (optional guard) |
| `500 Internal Server Error` | Unhandled server failure |
| `503 Service Unavailable` | Database unreachable (health degraded) |

### 4.3 Validation examples

| Request | Response |
|---------|----------|
| `GET /covid/countries/zz` | `400` — country codes must be uppercase ISO2 |
| `GET /covid/countries/ZZ` | `404` — not in `countries` table |
| `GET /covid/series?metric=invalid` | `400` — unknown metric enum |

---

## 5. Metadata and freshness

Dashboard footer ([REQ-F-52](./REQUIREMENTS.md)) consumes sync metadata from **`GET /sync/status`** (preferred) or embedded `meta` on summary responses.

### 5.1 `SyncStatusDto`

```json
{
  "lastSuccessfulSyncAt": "2026-07-08T06:00:00.000Z",
  "lastSyncStatus": "success",
  "dataSource": "api-ninjas",
  "latestReferenceDate": "2023-03-09"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `lastSuccessfulSyncAt` | `string \| null` | `MAX(completedAt)` from `sync_runs` where `status = success` |
| `lastSyncStatus` | `string \| null` | Latest run status: `running`, `success`, `failed` |
| `dataSource` | `string` | Primary upstream label for UI (e.g. `api-ninjas`) |
| `latestReferenceDate` | `string \| null` | `MAX(referenceDate)` across `covid_daily_metrics` |

---

## 6. Read endpoints

### 6.1 Health

#### `GET /health`

Liveness probe for local development, CI, and deployment checks.

**Response `200`:**

```json
{
  "status": "ok",
  "timestamp": "2026-07-08T18:30:00.000Z"
}
```

Optional: include database connectivity check; return `503` if DB is down.

---

### 6.2 Global summary (KPIs)

#### `GET /covid/summary`

Global aggregates for the KPI panel when **no country is selected** ([REQ-F-12](./REQUIREMENTS.md), [REQ-F-31](./REQUIREMENTS.md)).

**Response `200`:**

```json
{
  "scope": "global",
  "referenceDate": "2023-03-09",
  "metrics": {
    "casesTotal": 676609392,
    "deathsTotal": 6888881,
    "casesNew": 125430
  },
  "meta": {
    "lastSuccessfulSyncAt": "2026-07-08T06:00:00.000Z",
    "dataSource": "api-ninjas"
  }
}
```

| Field | Type | KPI mapping |
|-------|------|-------------|
| `metrics.casesTotal` | `number \| null` | Confirmed cases ([REQ-F-33](./REQUIREMENTS.md)) |
| `metrics.deathsTotal` | `number \| null` | Deaths |
| `metrics.casesNew` | `number \| null` | Third KPI — **new cases** on `referenceDate` (fallback for unavailable active cases; see [EXTERNAL_APIS.md G-01](./EXTERNAL_APIS.md#6-gaps-risks-and-mitigations)) |

Aggregation: [§8.1](#81-global-rollup).

---

### 6.3 Country list (map + table)

#### `GET /covid/countries`

Returns all countries with **latest metric snapshot** per country ([REQ-F-10](./REQUIREMENTS.md), [REQ-F-21](./REQUIREMENTS.md)).

**Query parameters (optional):**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `metric` | `string` | `casesTotal` | Sort key for choropleth ranking: `casesTotal`, `deathsTotal`, `casesNew`, `deathsNew` |

**Response `200`:**

```json
{
  "referenceDate": "2023-03-09",
  "countries": [
    {
      "code": "BR",
      "name": "Brazil",
      "metrics": {
        "casesTotal": 37454530,
        "deathsTotal": 698638,
        "casesNew": 0,
        "deathsNew": 0
      }
    }
  ],
  "meta": {
    "count": 195,
    "lastSuccessfulSyncAt": "2026-07-08T06:00:00.000Z"
  }
}
```

`code` maps to GeoJSON `iso2` for choropleth join ([DATA_MODEL.md §7.4](./DATA_MODEL.md#74-map-choropleth)).

---

### 6.4 Country detail

#### `GET /covid/countries/:countryCode`

Latest snapshot for a single country — tooltips and country-scoped KPIs ([REQ-F-14](./REQUIREMENTS.md), [REQ-F-23](./REQUIREMENTS.md)).

**Path parameters:**

| Param | Description |
|-------|-------------|
| `countryCode` | ISO 3166-1 alpha-2, uppercase |

**Response `200`:**

```json
{
  "scope": "country",
  "country": {
    "code": "BR",
    "name": "Brazil"
  },
  "referenceDate": "2023-03-09",
  "metrics": {
    "casesTotal": 37454530,
    "deathsTotal": 698638,
    "casesNew": 0,
    "deathsNew": 0
  },
  "meta": {
    "hasRegionalBreakdown": false,
    "lastSuccessfulSyncAt": "2026-07-08T06:00:00.000Z"
  }
}
```

| Field | Notes |
|-------|-------|
| `meta.hasRegionalBreakdown` | `true` when upstream stored multiple regions (e.g. Canada); values are **aggregated** for MVP country-level API |

**Response `404`:** unknown country code.

Aggregation: [§8.2](#82-country-rollup).

---

### 6.5 Country time series (chart)

#### `GET /covid/countries/:countryCode/series`

Ordered time-series points for the country-scoped chart ([REQ-F-11](./REQUIREMENTS.md), [REQ-F-41](./REQUIREMENTS.md)).

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `metric` | `string` | `casesTotal` | `casesTotal`, `deathsTotal`, `casesNew`, `deathsNew` |
| `from` | `date` | — | Inclusive start date (`YYYY-MM-DD`) |
| `to` | `date` | — | Inclusive end date (`YYYY-MM-DD`) |

**Response `200`:**

```json
{
  "scope": "country",
  "country": {
    "code": "BR",
    "name": "Brazil"
  },
  "metric": "casesTotal",
  "points": [
    { "date": "2020-03-01", "value": 1 },
    { "date": "2020-03-02", "value": 2 }
  ],
  "meta": {
    "pointCount": 1104,
    "from": "2020-03-01",
    "to": "2023-03-09"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `points` | `array` | Sorted ascending by `date` |
| `points[].date` | `string` | `referenceDate` |
| `points[].value` | `number \| null` | Selected metric; `null` if missing for that date |

Empty history: `200` with `"points": []` and `meta.pointCount: 0` ([REQ-F-42](./REQUIREMENTS.md)).

---

### 6.6 Global time series (chart)

#### `GET /covid/series`

Global chart when **no country is selected** ([REQ-F-41](./REQUIREMENTS.md)). Aggregates all countries per date.

**Query parameters:** same as [§6.5](#65-country-time-series-chart) (`metric`, `from`, `to`).

**Response `200`:**

```json
{
  "scope": "global",
  "metric": "casesTotal",
  "points": [
    { "date": "2020-03-01", "value": 120000 }
  ],
  "meta": {
    "pointCount": 1100,
    "from": "2020-03-01",
    "to": "2023-03-09"
  }
}
```

---

## 7. Sync endpoints

Read and sync HTTP flows (PNG — regenerate via [ARCHITECTURE.md §12](./ARCHITECTURE.md#12-diagrams)):

![Sequence diagram](./assets/sequence-diagram.png)

Operator-only write path ([REQ-F-03](./REQUIREMENTS.md), [REQ-F-04](./REQUIREMENTS.md)).

### 7.1 Trigger sync

#### `POST /sync`

Starts an ingest job: fetch upstream → normalize → upsert ([REQ-F-01](./REQUIREMENTS.md), [REQ-F-02](./REQUIREMENTS.md)).

**Request body (optional):**

```json
{
  "mode": "full"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `string` | `full` | `snapshot`, `country-series`, or `full` — maps to `SyncRun.mode` |

**Response `202 Accepted` (async — preferred):**

```json
{
  "syncRunId": "clx9abc123",
  "status": "running",
  "startedAt": "2026-07-08T18:30:00.000Z",
  "mode": "full"
}
```

**Response `409 Conflict` (optional):** another sync is already `running`.

**Failure behaviour:** upstream errors update `SyncRun` to `failed`; existing metric rows are **not** deleted ([REQ-F-05](./REQUIREMENTS.md)).

### 7.2 Sync status

#### `GET /sync/status`

Exposes freshness metadata for UI and operators ([REQ-F-06](./REQUIREMENTS.md)).

**Response `200`:** [SyncStatusDto](#51-syncstatusdto).

### 7.3 Sync run detail (optional)

#### `GET /sync/runs/:id`

Returns a single `SyncRun` record for debugging.

**Response `200`:**

```json
{
  "id": "clx9abc123",
  "startedAt": "2026-07-08T18:30:00.000Z",
  "completedAt": "2026-07-08T18:32:15.000Z",
  "status": "success",
  "source": "api-ninjas",
  "mode": "full",
  "recordsUpserted": 15420,
  "errorMessage": null,
  "metadata": { "dateParam": "2023-03-09" }
}
```

Priority: **Should** for MVP; implement if time permits in Phase 3.

---

## 8. Aggregation rules

Country-level responses **never expose subnational rows** in MVP ([REQUIREMENTS.md §9](./REQUIREMENTS.md#9-out-of-scope--mvp)). Roll-up matches [DATA_MODEL.md §7](./DATA_MODEL.md#7-query-patterns-mvp).

### 8.1 Global rollup

For a given `referenceDate` (latest date with any data):

1. For each country, compute country-level metrics ([§8.2](#82-country-rollup)).
2. Sum `casesTotal`, `deathsTotal`, `casesNew`, `deathsNew` across countries.
3. Nullable fields: treat `null` as `0` for sums unless all countries are `null` → return `null`.

### 8.2 Country rollup

For `countryCode` on latest `referenceDate`:

| Condition | Rule |
|-----------|------|
| Row exists with `region = ""` | Use that row's metrics |
| Only regional rows exist | **Sum** metrics across regions for that date |
| Multiple dates in store | Use **latest** `referenceDate` for summary endpoints; series endpoints return all dates |

### 8.3 Time series rollup

Per `referenceDate` in range:

```sql
-- illustrative (from DATA_MODEL)
SELECT reference_date, SUM(cases_total) AS value
FROM covid_daily_metrics
WHERE country_code = :code
GROUP BY reference_date
ORDER BY reference_date;
```

Global series: same grouping without `country_code` filter, summing per date across all countries after per-country roll-up.

---

## 9. DTO reference

### 9.1 `MetricsSnapshotDto`

| Field | Type | Source column |
|-------|------|---------------|
| `casesTotal` | `number \| null` | `casesTotal` |
| `deathsTotal` | `number \| null` | `deathsTotal` |
| `casesNew` | `number \| null` | `casesNew` |
| `deathsNew` | `number \| null` | `deathsNew` |

### 9.2 `CountryRefDto`

| Field | Type | Source |
|-------|------|--------|
| `code` | `string` | `Country.iso2` |
| `name` | `string` | `Country.name` |

### 9.3 `SeriesPointDto`

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | `YYYY-MM-DD` |
| `value` | `number \| null` | Metric value |

### 9.4 Metric enum

Allowed `metric` query values:

```
casesTotal | deathsTotal | casesNew | deathsNew
```

MVP default for chart: **`casesTotal`** ([REQUIREMENTS.md §5.3](./REQUIREMENTS.md#53-default-product-behaviour)).

---

## 10. Frontend usage map

| UI area | Endpoints | Requirements |
|---------|-----------|--------------|
| KPI panel (global) | `GET /covid/summary` | REQ-F-12, REQ-F-30–33 |
| KPI panel (country) | `GET /covid/countries/:code` | REQ-F-31, REQ-F-33 |
| Map choropleth | `GET /covid/countries` | REQ-F-10, REQ-F-21 |
| Map tooltip | `GET /covid/countries/:code` | REQ-F-23 |
| Chart (global) | `GET /covid/series?metric=casesTotal` | REQ-F-40–42 |
| Chart (country) | `GET /covid/countries/:code/series?metric=casesTotal` | REQ-F-41–43 |
| Footer freshness | `GET /sync/status` | REQ-F-52 |
| Loading / errors | All `GET` | REQ-F-51 |

Suggested `web/lib/api/` client functions: `getSummary()`, `getCountries()`, `getCountry(code)`, `getSeries(params)`, `getGlobalSeries(params)`, `getSyncStatus()`.

---

## 11. Testing and acceptance

| Test | Pass criteria |
|------|---------------|
| Country list | Returns ISO codes matching seeded `countries` rows |
| Summary totals | Match manual SQL roll-up on fixture DB for latest date |
| Series ordering | Points strictly ascending by `date` |
| Unknown country | `404` with error envelope |
| Invalid metric | `400` with error envelope |
| Sync trigger | Creates `SyncRun` row; `GET /sync/status` updates after success |
| Sync failure | Prior metrics unchanged; `lastSyncStatus` reflects `failed` |
| Production errors | No stack trace in JSON body |

Coverage expectation: [REQ-NF-04](./REQUIREMENTS.md) — ingest path plus **all §6 read endpoints** in `api/` e2e or integration tests.

---

## 12. Traceability

### 12.1 Requirements → endpoints

| Requirement | Endpoint(s) |
|-------------|-------------|
| REQ-F-03 | `POST /sync` |
| REQ-F-06, REQ-F-52 | `GET /sync/status`, `meta.lastSuccessfulSyncAt` |
| REQ-F-10 | `GET /covid/countries` |
| REQ-F-11 | `GET /covid/countries/:code/series`, `GET /covid/series` |
| REQ-F-12 | `GET /covid/summary` |
| REQ-F-13 | [§4](#4-error-responses) |
| REQ-F-14 | `GET /covid/countries/:code` |

### 12.2 Downstream artifacts

| Artifact | Relationship |
|----------|--------------|
| [DATA_MODEL.md](./DATA_MODEL.md) | Entity fields → DTO columns |
| [diagrams/sequence-diagram.drawio](./diagrams/sequence-diagram.drawio) | Read and sync flows — PNG: [assets/sequence-diagram.png](./assets/sequence-diagram.png) |
| `api/src/covid/` | Controllers implement §6 |
| `api/src/sync/` | Controllers implement §7 |
| `web/lib/api/` | Typed client for §10 |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers and module map |
| [DATA_MODEL.md](./DATA_MODEL.md) | Persistence and queries |
| [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) | Ingest source payloads |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Acceptance criteria |
