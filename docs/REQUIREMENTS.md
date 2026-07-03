# Requirements

Product requirements for **Global Analytics Dashboard** — MVP release `v0.1.0` and evolution path.

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Active |
| **Last updated** | July 2026 |
| **Release target** | MVP `v0.1.0` (see [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md)) |

---

## Table of Contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Quality attributes of this document](#2-quality-attributes-of-this-document)
3. [Definitions](#3-definitions)
4. [Actors](#4-actors)
5. [Product vision — MVP v0.1.0](#5-product-vision--mvp-v010)
6. [Assumptions and dependencies](#6-assumptions-and-dependencies)
7. [Functional requirements](#7-functional-requirements)
8. [Non-functional requirements](#8-non-functional-requirements)
9. [Out of scope — MVP](#9-out-of-scope--mvp)
10. [Future evolution (post-MVP)](#10-future-evolution-post-mvp)
11. [Change management](#11-change-management)
12. [Traceability](#12-traceability)

---

## 1. Purpose and scope

This document defines **what the system must do** for the MVP and establishes a stable requirement baseline for design (`ARCHITECTURE.md`, `DATA_MODEL.md`, `API_SPEC.md`) and implementation.

**In scope:** functional and non-functional requirements for `v0.1.0`, acceptance criteria, explicit exclusions, and post-MVP evolution notes.

**Out of scope (other documents):**

| Topic | Document |
|-------|----------|
| Git workflow, releases | [CONTRIBUTING.md](../CONTRIBUTING.md), [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) |
| Technology choices | [docs/adr/](./adr/) |
| Upstream API contracts | [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) (planned) |
| Internal REST contract | [API_SPEC.md](./API_SPEC.md) (planned) |

---

## 2. Quality attributes of this document

Requirements follow standard software engineering qualities:

| Attribute | Application |
|-----------|-------------|
| **Unambiguous** | Each requirement has a unique ID and a single testable intent |
| **Verifiable** | Acceptance criteria define observable pass/fail conditions |
| **Traceable** | IDs link to ADRs, MVP Definition of Done, and future Linear cards (`DEV-XX`) |
| **Bounded** | MVP scope is explicit; post-MVP items are listed separately |
| **Evolvable** | Changes are versioned in Git; scope changes require this document and Linear to be updated |

Requirement priority:

| Priority | Meaning |
|----------|---------|
| **Must** | Mandatory for MVP `v0.1.0` acceptance |
| **Should** | Strongly desired; may defer only with documented trade-off in sprint record |
| **Could** | Post-MVP or optional enhancement |

---

## 3. Definitions

| Term | Definition |
|------|------------|
| **MVP** | Minimum viable product — first production release tagged `v0.1.0` |
| **Viewer** | Anonymous user accessing the public dashboard in a browser |
| **Operator** | Person or job triggering data sync (no admin UI in MVP) |
| **Upstream API** | External COVID-19 data provider (API Ninjas primary; Apify contingency) |
| **Internal API** | REST API exposed by `api/` (NestJS) to `web/` only |
| **Sync** | Server-side fetch from upstream, normalization, and Prisma upsert into PostgreSQL |
| **Country** | Sovereign state identified by a stable code (e.g. ISO 3166-1 alpha-2) |
| **Metric** | Numeric COVID-19 statistic (cases, deaths, active cases, etc.) |
| **Reference date** | Date associated with a metric snapshot or time-series point |

---

## 4. Actors

| Actor | Goal | MVP capabilities |
|-------|------|------------------|
| **Viewer** | Explore geographic and statistical COVID-19 data | Read-only dashboard: map, KPIs, time-series chart |
| **Operator** | Keep persisted data current | Manual sync trigger; scheduled sync in deployed environments |

Authentication and role-based access are **not** required for MVP.

---

## 5. Product vision — MVP v0.1.0

### 5.1 Summary

Deliver a **public, read-only web dashboard** that presents COVID-19 statistics at **country level**: an interactive world map, summary KPIs, and at least one time-series chart. All displayed data is served from **persisted backend storage** populated by server-side ingestion — not from direct browser calls to upstream APIs.

### 5.2 MVP capabilities (checklist)

MVP is accepted when all items below are satisfied (aligned with [PROJECT_MANAGEMENT.md §12.3](./PROJECT_MANAGEMENT.md#123-mvp-v010)):

- [ ] Backend ingest and internal API operational with persisted data
- [ ] Interactive map with country-level visualization
- [ ] KPI panel with minimum three indicators
- [ ] At least one time-series chart
- [ ] Staging and production deployed; public URLs in [README.md](../README.md)
- [ ] This document's **Must** requirements met

### 5.3 Default product behaviour (MVP)

| Behaviour | Decision |
|-----------|----------|
| Initial view | **Global** aggregate — no country pre-selected |
| Country selection | User selects a country on the map (or equivalent control) to filter KPIs and chart |
| Map style | **Choropleth** by metric (primary); circle markers acceptable if choropleth delivery is blocked |
| KPI set | Confirmed cases, deaths, active cases |
| Time-series chart | **Confirmed cases** over time, single series |
| Sync cadence (deployed) | **Daily** scheduled job |
| Sync cadence (local) | **Manual** trigger documented in SETUP |
| UI language | **English** |

Metric field names and historical depth are constrained by upstream data — see [§6](#6-assumptions-and-dependencies).

---

## 6. Assumptions and dependencies

| ID | Assumption | Impact if false |
|----|------------|-----------------|
| **A-01** | API Ninjas provides country-level COVID-19 metrics sufficient for map and KPIs | Contingency per [ADR-004](./adr/ADR-004-api-provider.md); update EXTERNAL_APIS and DATA_MODEL |
| **A-02** | Upstream provides or allows building **time-series** history per country (directly or via repeated sync) | REQ-F-40 may require Apify or adjusted chart scope; document in EXTERNAL_APIS (risk R1) |
| **A-03** | Active cases field exists upstream or is derivable | If unavailable, third KPI falls back to **tests** or **recovered** — documented in EXTERNAL_APIS |
| **A-04** | Country codes can be aligned with map geometries (ISO-based GeoJSON) | Choropleth may defer to markers (REQ-F-21) |
| **A-05** | Frontend never holds upstream API keys | Enforced by architecture ([ADR-002](./adr/ADR-002-project-architecture.md)) |

Detailed endpoint mapping, rate limits, and field catalogue: **EXTERNAL_APIS.md** (planned, Phase 1).

---

## 7. Functional requirements

### 7.1 Data ingestion (backend)

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-F-01** | Must | Server-side ingestion from primary upstream API | No upstream HTTP calls from `web/`; API key only in server environment variables |
| **REQ-F-02** | Must | Normalize and persist ingested records in PostgreSQL | After sync, data queryable via Prisma; duplicate natural keys prevented (upsert) |
| **REQ-F-03** | Must | Manual sync execution | Documented endpoint or CLI succeeds in local/staging and updates `lastSyncedAt` (or equivalent) |
| **REQ-F-04** | Must | Scheduled sync in deployed environments | Daily job runs without manual intervention; failures logged |
| **REQ-F-05** | Must | Resilient sync on upstream failure | Failed sync does not delete or corrupt existing persisted data; error is logged |
| **REQ-F-06** | Should | Sync metadata exposed internally | API or logs expose last successful sync timestamp for UI (REQ-F-52) |

### 7.2 Internal REST API

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-F-10** | Must | List countries with latest metrics | `GET` endpoint returns countries with code, name, and core metrics + reference date; contract in API_SPEC |
| **REQ-F-11** | Must | Country time series | `GET` by country returns ordered time-series points sufficient for REQ-F-40 |
| **REQ-F-12** | Must | Global summary for KPIs | `GET` summary returns aggregates for global view (REQ-F-31) |
| **REQ-F-13** | Must | Consistent JSON error handling | 4xx/5xx responses with stable error shape; no stack traces in production responses |
| **REQ-F-14** | Should | Country detail endpoint | `GET` by country code returns latest snapshot used by map tooltips (REQ-F-23) |

### 7.3 Dashboard — map

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-F-20** | Must | Interactive map (React Leaflet) | Pan and zoom work; no SSR runtime errors ([ADR-005](./adr/ADR-005-map-library.md)) |
| **REQ-F-21** | Must | Country-level metric visualization | Choropleth encoding selected metric **or** markers per country with legend indicating metric |
| **REQ-F-22** | Must | Country selection drives dashboard context | Selecting a country updates KPIs and chart to that country |
| **REQ-F-23** | Must | Country detail on interaction | Tooltip or panel shows country name and primary metrics |
| **REQ-F-24** | Should | Clear selected country | User can return to global view without full page reload |

### 7.4 Dashboard — KPIs

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-F-30** | Must | KPI panel on main dashboard | At least three KPI cards visible above the fold on desktop |
| **REQ-F-31** | Must | Context-aware KPI values | Global aggregates when no country selected; country values when selected |
| **REQ-F-32** | Must | Readable numeric formatting | Thousands separators; metric labels; reference date shown where applicable |
| **REQ-F-33** | Must | MVP KPI metrics | **Confirmed cases**, **deaths**, **active cases** (or documented fallback per A-03) |

### 7.5 Dashboard — time series

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-F-40** | Must | At least one time-series chart | Line (or area) chart rendered with real persisted data |
| **REQ-F-41** | Must | Chart follows country selection | Global or default series when none selected; country series when selected |
| **REQ-F-42** | Must | Legible time axis | Date labels readable at MVP data density; empty state if no history |
| **REQ-F-43** | Should | Chart identifies metric and unit | Title or legend states metric (MVP: confirmed cases) |

### 7.6 Dashboard — cross-cutting UI

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-F-50** | Must | Responsive layout | Usable at viewport width ≥ 375px; no critical overlap of map, KPIs, and chart |
| **REQ-F-51** | Must | Loading and error states | Loading indicator during internal API fetch; user-visible message on recoverable failure |
| **REQ-F-52** | Must | Data provenance and freshness | Footer or banner: data source label + last sync time (from REQ-F-06) |
| **REQ-F-53** | Must | English UI copy | All user-facing strings in English |

---

## 8. Non-functional requirements

| ID | Priority | Requirement | Acceptance criteria |
|----|----------|-------------|---------------------|
| **REQ-NF-01** | Must | Secret management | No upstream API keys in `web/`, client bundles, or Git history |
| **REQ-NF-02** | Must | Security boundary | Browser communicates only with internal API and static assets |
| **REQ-NF-03** | Should | Initial load performance | Dashboard interactive within 5 seconds on typical broadband against staging (measured once pre-release) |
| **REQ-NF-04** | Must | Backend automated tests | Unit and/or e2e tests cover ingest path and critical read endpoints |
| **REQ-NF-05** | Must | CI quality gate | Lint and tests pass on `develop` before release (when GitHub Actions configured) |
| **REQ-NF-06** | Must | Deployed environments | Staging and production accessible; URLs documented in README |
| **REQ-NF-07** | Must | Operational logging | Ingest success/failure and API errors logged server-side |
| **REQ-NF-08** | Should | Accessibility baseline | Semantic HTML for KPI/chart regions; sufficient colour contrast for map legend |
| **REQ-NF-09** | Must | Maintainability | Implementation follows ADRs; deviations require new ADR |
| **REQ-NF-10** | Must | Documentation sync | Behaviour changes update API_SPEC, DATA_MODEL, or this document in same delivery |

---

## 9. Out of scope — MVP

The following are **explicitly excluded** from `v0.1.0` to prevent scope creep ([PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) risk R4):

- User authentication, authorization, or user accounts
- Admin web console for sync configuration
- Write operations from the dashboard (create/update/delete data)
- CSV/PDF/Excel export
- Multi-country comparison in a single chart
- Subnational regions (state/province/municipality)
- Real-time streaming or WebSocket updates
- Email, push, or alert notifications
- Internationalization beyond English
- Apify as primary source (contingency only — ADR-004)
- Mapbox or proprietary map SDK as primary map stack
- Public API rate limiting, CDN, or advanced caching layers
- Offline/PWA support

---

## 10. Future evolution (post-MVP)

Planned enhancements **after** `v0.1.0`. Each requires a new or updated requirement ID and Linear card before implementation.

| Theme | Examples | Notes |
|-------|----------|-------|
| **Analytics** | Date range filter, compare countries, additional chart metrics | Extend REQ-F-40+ |
| **Data** | Apify integration, richer history backfill, subnational data | Depends on EXTERNAL_APIS |
| **UX** | Dark mode, improved mobile map UX, keyboard navigation | REQ-NF-08 expansion |
| **Platform** | Authenticated admin, export, public API versioning | New security NFRs |
| **Operations** | Hourly sync, metrics dashboard, alerting on ingest failure | REQ-F-04 extension |

---

## 11. Change management

1. **Scope change** — Update this document, link a `DEV-XX` card in Linear, and note impact in sprint record.
2. **Upstream constraint discovered** — Update EXTERNAL_APIS.md and adjust affected REQ-F/A IDs with document version bump.
3. **Architecture impact** — New [ADR](./adr/README.md) before implementation.
4. **MVP gate** — No `v0.1.0` tag until [§5.2](#52-mvp-capabilities-checklist) and all **Must** requirements pass acceptance.

---

## 12. Traceability

### 12.1 Requirements → ADRs

| Requirements | ADR |
|--------------|-----|
| REQ-F-01, REQ-F-02, REQ-NF-01, REQ-NF-02 | [ADR-002](./adr/ADR-002-project-architecture.md) |
| REQ-F-02, REQ-NF-04 | [ADR-003](./adr/ADR-003-database-choice.md) |
| REQ-F-01, REQ-F-05, A-01–A-03 | [ADR-004](./adr/ADR-004-api-provider.md) |
| REQ-F-20–REQ-F-23 | [ADR-005](./adr/ADR-005-map-library.md) |
| All stack-related NFRs | [ADR-001](./adr/ADR-001-technology-stack.md) |

### 12.2 Requirements → MVP Definition of Done

| PROJECT_MANAGEMENT §12.3 criterion | Requirements |
|-----------------------------------|--------------|
| MVP scope in REQUIREMENTS satisfied | This document — all **Must** |
| Backend ingest + internal API + persistence | REQ-F-01–06, REQ-F-10–13, REQ-NF-04 |
| Map, KPIs, minimum one chart | REQ-F-20–23, REQ-F-30–33, REQ-F-40–42 |
| Staging and production deployed | REQ-NF-06 |
| README lists public URLs | REQ-NF-06 (verification) |

### 12.3 Implementation phases (reference)

| Phase | Primary requirements |
|-------|---------------------|
| 1 Governance | This document, EXTERNAL_APIS |
| 2 Specifications | REQ-F-10–14 → API_SPEC; REQ-F-02 → DATA_MODEL |
| 3 Backend | REQ-F-01–06, REQ-F-10–14, REQ-NF-04, REQ-NF-07 |
| 4 Frontend | REQ-F-20–53, REQ-NF-03, REQ-NF-08 |
| 5 Deploy | REQ-NF-05, REQ-NF-06 |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) | Phases, MVP DoD, risks |
| [EXTERNAL_APIS.md](./EXTERNAL_APIS.md) | Upstream field catalogue (planned) |
| [API_SPEC.md](./API_SPEC.md) | Internal REST contract (planned) |
| [docs/adr/](./adr/) | Architecture decisions |
