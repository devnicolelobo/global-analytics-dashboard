/**
 * TypeScript contracts for API Ninjas COVID-19 responses.
 * @see docs/EXTERNAL_APIS.md §3.2 — Mode A (series) vs Mode B (snapshot)
 */

/** Daily metric bucket: cumulative total and new cases/deaths for one day. */
export interface ApiNinjasDailyMetric {
  total: number;
  new: number;
}

/** Mode A — time series keyed by ISO date (YYYY-MM-DD). */
export type ApiNinjasTimeSeries = Record<string, ApiNinjasDailyMetric>;

/** Shared fields present in every upstream row. */
export interface ApiNinjasCovidRowBase {
  country: string;
  region: string;
}

/**
 * Mode A — one row per country/region with a date-keyed series.
 * When `type=cases` the metric key is `cases`; when `type=deaths` it is `deaths`.
 */
export interface ApiNinjasCountrySeriesRow extends ApiNinjasCovidRowBase {
  cases?: ApiNinjasTimeSeries;
  deaths?: ApiNinjasTimeSeries;
}

/**
 * Mode B — global snapshot for a single calendar day.
 * `cases` / `deaths` hold a single `{ total, new }` object (not keyed by date).
 */
export interface ApiNinjasDateSnapshotRow extends ApiNinjasCovidRowBase {
  cases?: ApiNinjasDailyMetric;
  deaths?: ApiNinjasDailyMetric;
}

export type ApiNinjasMetricType = 'cases' | 'deaths';

/** Query options shared by both fetch modes. */
export interface ApiNinjasQueryOptions {
  type?: ApiNinjasMetricType;
  region?: string;
}

export interface ApiNinjasCountryQuery extends ApiNinjasQueryOptions {
  country: string;
}

export interface ApiNinjasDateQuery extends ApiNinjasQueryOptions {
  date: string;
}
