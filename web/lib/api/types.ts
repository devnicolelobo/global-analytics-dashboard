/**
 * Response DTOs mirroring docs/API_SPEC.md §4–7 / §9.
 * Field names stay camelCase as returned by Nest — do not invent parallel shapes.
 */

/** Allowed `metric` query values (API_SPEC §9.4). */
export type Metric =
  | 'casesTotal'
  | 'deathsTotal'
  | 'casesNew'
  | 'deathsNew';

/** API_SPEC §9.1 */
export interface MetricsSnapshot {
  casesTotal: number | null;
  deathsTotal: number | null;
  casesNew: number | null;
  deathsNew?: number | null;
}

/** API_SPEC §9.2 */
export interface CountryRef {
  code: string;
  name: string;
}

/** API_SPEC §9.3 */
export interface SeriesPoint {
  date: string;
  value: number | null;
}

/** API_SPEC §4.1 — treat as untrusted input when mapping to UI. */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

/** API_SPEC §5.1 / GET /sync/status */
export interface SyncStatus {
  lastSuccessfulSyncAt: string | null;
  lastSyncStatus: string | null;
  dataSource: string;
  latestReferenceDate: string | null;
}

/** API_SPEC §6.2 — GET /covid/summary */
export interface SummaryResponse {
  scope: 'global';
  referenceDate: string;
  metrics: Pick<MetricsSnapshot, 'casesTotal' | 'deathsTotal' | 'casesNew'>;
  meta: {
    lastSuccessfulSyncAt: string | null;
    dataSource: string;
  };
}

/** One row in GET /covid/countries (API_SPEC §6.3). */
export interface CountryListItem {
  code: string;
  name: string;
  metrics: MetricsSnapshot;
}

/** API_SPEC §6.3 — GET /covid/countries */
export interface CountriesResponse {
  referenceDate: string;
  countries: CountryListItem[];
  meta: {
    count: number;
    lastSuccessfulSyncAt: string | null;
  };
}

/** API_SPEC §6.4 — GET /covid/countries/:countryCode */
export interface CountryDetailResponse {
  scope: 'country';
  country: CountryRef;
  referenceDate: string;
  metrics: MetricsSnapshot;
  meta: {
    hasRegionalBreakdown: boolean;
    lastSuccessfulSyncAt: string | null;
  };
}

/** Shared series meta (API_SPEC §6.5–6.6). */
export interface SeriesMeta {
  pointCount: number;
  from: string | null;
  to: string | null;
}

/** API_SPEC §6.5 — GET /covid/countries/:code/series */
export interface CountrySeriesResponse {
  scope: 'country';
  country: CountryRef;
  metric: Metric;
  points: SeriesPoint[];
  meta: SeriesMeta;
}

/** API_SPEC §6.6 — GET /covid/series */
export interface GlobalSeriesResponse {
  scope: 'global';
  metric: Metric;
  points: SeriesPoint[];
  meta: SeriesMeta;
}

/** Query params for series endpoints (API_SPEC §6.5). */
export interface SeriesQueryParams {
  metric?: Metric;
  from?: string;
  to?: string;
}

/** Optional sort metric for country list (API_SPEC §6.3). */
export interface CountriesQueryParams {
  metric?: Metric;
}
