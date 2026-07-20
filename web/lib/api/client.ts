import { getJson, type GetJsonOptions } from './http';
import {
  assertCountryCode,
  buildCountriesQuery,
  buildSeriesQuery,
  withQuery,
} from './query';
import type {
  CountriesQueryParams,
  CountriesResponse,
  CountryDetailResponse,
  CountrySeriesResponse,
  GlobalSeriesResponse,
  SeriesQueryParams,
  SummaryResponse,
  SyncStatus,
} from './types';

export type ClientRequestOptions = GetJsonOptions;

/** GET /covid/summary — global KPI snapshot. */
export function getSummary(
  options?: ClientRequestOptions,
): Promise<SummaryResponse> {
  return getJson<SummaryResponse>('/covid/summary', options);
}

/** GET /covid/countries — list for map / table. */
export function getCountries(
  params: CountriesQueryParams = {},
  options?: ClientRequestOptions,
): Promise<CountriesResponse> {
  const path = withQuery('/covid/countries', buildCountriesQuery(params));
  return getJson<CountriesResponse>(path, options);
}

/** GET /covid/countries/:countryCode — country-scoped KPIs / tooltip. */
export function getCountry(
  countryCode: string,
  options?: ClientRequestOptions,
): Promise<CountryDetailResponse> {
  const code = assertCountryCode(countryCode);
  return getJson<CountryDetailResponse>(`/covid/countries/${code}`, options);
}

/** GET /covid/countries/:countryCode/series — country chart series. */
export function getSeries(
  countryCode: string,
  params: SeriesQueryParams = {},
  options?: ClientRequestOptions,
): Promise<CountrySeriesResponse> {
  const code = assertCountryCode(countryCode);
  const path = withQuery(
    `/covid/countries/${code}/series`,
    buildSeriesQuery(params),
  );
  return getJson<CountrySeriesResponse>(path, options);
}

/** GET /covid/series — global chart series. */
export function getGlobalSeries(
  params: SeriesQueryParams = {},
  options?: ClientRequestOptions,
): Promise<GlobalSeriesResponse> {
  const path = withQuery('/covid/series', buildSeriesQuery(params));
  return getJson<GlobalSeriesResponse>(path, options);
}

/** GET /sync/status — footer freshness metadata. */
export function getSyncStatus(
  options?: ClientRequestOptions,
): Promise<SyncStatus> {
  return getJson<SyncStatus>('/sync/status', options);
}
