import type { CountriesQueryParams, Metric, SeriesQueryParams } from './types';

export { assertCountryCode } from '../country-code';

const METRICS: ReadonlySet<Metric> = new Set([
  'casesTotal',
  'deathsTotal',
  'casesNew',
  'deathsNew',
]);

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
