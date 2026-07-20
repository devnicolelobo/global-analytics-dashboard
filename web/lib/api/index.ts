/**
 * Public barrel for the internal API client.
 * Prefer: `import { getSummary, type SummaryResponse } from '@/lib/api'`
 */

export {
  getSummary,
  getCountries,
  getCountry,
  getSeries,
  getGlobalSeries,
  getSyncStatus,
  type ClientRequestOptions,
} from './client';

export {
  ApiError,
  type ApiErrorKind,
  sanitizeErrorMessage,
  parseErrorEnvelope,
} from './errors';

export {
  getApiBaseUrl,
  stripTrailingSlash,
  isValidApiBaseUrl,
} from './config';

export {
  assertCountryCode,
  buildSeriesQuery,
  buildCountriesQuery,
  withQuery,
  isMetric,
} from './query';

export { getJson, DEFAULT_TIMEOUT_MS, type GetJsonOptions } from './http';

export type {
  Metric,
  MetricsSnapshot,
  CountryRef,
  SeriesPoint,
  ErrorResponse,
  SyncStatus,
  SummaryResponse,
  CountryListItem,
  CountriesResponse,
  CountryDetailResponse,
  SeriesMeta,
  CountrySeriesResponse,
  GlobalSeriesResponse,
  SeriesQueryParams,
  CountriesQueryParams,
} from './types';
