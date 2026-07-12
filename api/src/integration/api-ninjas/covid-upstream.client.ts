import {
  ApiNinjasCountrySeriesRow,
  ApiNinjasDateSnapshotRow,
  ApiNinjasQueryOptions,
} from './api-ninjas.types';

/**
 * Narrow contract for COVID-19 upstream providers.
 * Ingest depends on this interface — swap ApiNinjasClient for Apify later (ADR-004).
 */
export interface CovidUpstreamClient {
  fetchByCountry(
    country: string,
    options?: ApiNinjasQueryOptions,
  ): Promise<ApiNinjasCountrySeriesRow[]>;

  fetchByDate(
    date: string,
    options?: ApiNinjasQueryOptions,
  ): Promise<ApiNinjasDateSnapshotRow[]>;
}

export const COVID_UPSTREAM_CLIENT = Symbol('COVID_UPSTREAM_CLIENT');
