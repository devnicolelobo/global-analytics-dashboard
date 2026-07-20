import type { CountriesQueryParams, Metric, SeriesQueryParams } from './types';

/** ISO 3166-1 alpha-2 uppercase (e.g. BR, US). Client-side UX guard — server remains source of truth. */
const ISO2_UPPER = /^[A-Z]{2}$/;

const METRICS: ReadonlySet<Metric> = new Set([
  'casesTotal',
  'deathsTotal',
  'casesNew',
  'deathsNew',
]);

/**
 * Assert country code shape before building a request URL.
 * Throws a plain Error (not ApiError) — this is a client programming/UX guard, not an HTTP failure.
 */
export function assertCountryCode(code: string): string {
  const trimmed = code.trim();
  if (!ISO2_UPPER.test(trimmed)) {
    throw new Error(
      `Invalid countryCode: expected uppercase ISO 3166-1 alpha-2 (got "${code}")`,
    );
  }
  return trimmed;
}

export function isMetric(value: string): value is Metric {
  return METRICS.has(value as Metric);
}

/**
 * Build a query string with URLSearchParams so values are safely encoded
 * (spaces, unicode, reserved characters) — never concatenate raw user input into URLs.
 */
export function buildSeriesQuery(params: SeriesQueryParams = {}): string {
  const search = new URLSearchParams();

  if (params.metric !== undefined) {
    if (!isMetric(params.metric)) {
      throw new Error(`Invalid metric: ${String(params.metric)}`);
    }
    search.set('metric', params.metric);
  }
  if (params.from !== undefined) {
    search.set('from', params.from);
  }
  if (params.to !== undefined) {
    search.set('to', params.to);
  }

  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : '';
}

export function buildCountriesQuery(params: CountriesQueryParams = {}): string {
  const search = new URLSearchParams();

  if (params.metric !== undefined) {
    if (!isMetric(params.metric)) {
      throw new Error(`Invalid metric: ${String(params.metric)}`);
    }
    search.set('metric', params.metric);
  }

  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : '';
}

/** Join base path and optional query string without duplicating `?`. */
export function withQuery(path: string, query: string): string {
  if (!query) {
    return path;
  }
  return query.startsWith('?') ? `${path}${query}` : `${path}?${query}`;
}
