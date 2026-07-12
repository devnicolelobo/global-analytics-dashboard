import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { EnvironmentVariables } from '../../config/env.validation';
import {
  UpstreamBadResponseError,
  UpstreamMissingApiKeyError,
  UpstreamRateLimitedError,
  UpstreamTimeoutError,
  UpstreamUnauthorizedError,
  UpstreamUnavailableError,
  UpstreamError,
} from './api-ninjas.errors';
import {
  assertIsoDate,
  assertMetricType,
  assertNonEmptyCountry,
  assertOptionalRegion,
} from './api-ninjas.params';
import { CovidUpstreamClient } from './covid-upstream.client';
import {
  ApiNinjasCountrySeriesRow,
  ApiNinjasDailyMetric,
  ApiNinjasDateSnapshotRow,
  ApiNinjasMetricType,
  ApiNinjasQueryOptions,
  ApiNinjasTimeSeries,
} from './api-ninjas.types';

const BASE_URL = 'https://api.api-ninjas.com';
const COVID_PATH = '/v1/covid19';
const DEFAULT_TIMEOUT_MS = 15_000;
// Up to 3 attempts total (initial + 2 retries) — 5xx/timeout/network only.
const MAX_RETRIES = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDailyMetric(value: unknown, label: string): ApiNinjasDailyMetric {
  if (!isRecord(value)) {
    throw new UpstreamBadResponseError(`${label} must be an object`);
  }

  const { total, new: dailyNew } = value;
  if (typeof total !== 'number' || typeof dailyNew !== 'number') {
    throw new UpstreamBadResponseError(
      `${label} must contain numeric total and new fields`,
    );
  }

  return { total, new: dailyNew };
}

function parseTimeSeries(value: unknown, label: string): ApiNinjasTimeSeries {
  if (!isRecord(value)) {
    throw new UpstreamBadResponseError(`${label} must be an object`);
  }

  const series: ApiNinjasTimeSeries = {};
  for (const [dateKey, metric] of Object.entries(value)) {
    series[dateKey] = parseDailyMetric(metric, `${label}[${dateKey}]`);
  }

  return series;
}

function parseCountrySeriesRow(
  row: unknown,
  metricType: ApiNinjasMetricType,
): ApiNinjasCountrySeriesRow {
  if (!isRecord(row)) {
    throw new UpstreamBadResponseError('each series row must be an object');
  }

  const { country, region, cases, deaths } = row;
  if (typeof country !== 'string' || typeof region !== 'string') {
    throw new UpstreamBadResponseError(
      'each series row must include string country and region',
    );
  }

  const parsed: ApiNinjasCountrySeriesRow = { country, region };
  if (cases !== undefined) {
    parsed.cases = parseTimeSeries(cases, 'cases');
  }
  if (deaths !== undefined) {
    parsed.deaths = parseTimeSeries(deaths, 'deaths');
  }

  const metricKey = metricType === 'deaths' ? 'deaths' : 'cases';
  if (parsed[metricKey] === undefined) {
    throw new UpstreamBadResponseError(
      `series row is missing expected metric key "${metricKey}"`,
    );
  }

  return parsed;
}

function parseDateSnapshotRow(
  row: unknown,
  metricType: ApiNinjasMetricType,
): ApiNinjasDateSnapshotRow {
  if (!isRecord(row)) {
    throw new UpstreamBadResponseError('each snapshot row must be an object');
  }

  const { country, region, cases, deaths } = row;
  if (typeof country !== 'string' || typeof region !== 'string') {
    throw new UpstreamBadResponseError(
      'each snapshot row must include string country and region',
    );
  }

  const parsed: ApiNinjasDateSnapshotRow = { country, region };
  if (cases !== undefined) {
    parsed.cases = parseDailyMetric(cases, 'cases');
  }
  if (deaths !== undefined) {
    parsed.deaths = parseDailyMetric(deaths, 'deaths');
  }

  const metricKey = metricType === 'deaths' ? 'deaths' : 'cases';
  if (parsed[metricKey] === undefined) {
    throw new UpstreamBadResponseError(
      `snapshot row is missing expected metric key "${metricKey}"`,
    );
  }

  return parsed;
}

// Server-side HTTP client for API Ninjas COVID-19 — stateless, singleton-safe.
@Injectable()
export class ApiNinjasClient implements CovidUpstreamClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async fetchByCountry(
    country: string,
    options?: ApiNinjasQueryOptions,
  ): Promise<ApiNinjasCountrySeriesRow[]> {
    const validatedCountry = assertNonEmptyCountry(country);
    const metricType = assertMetricType(options?.type) ?? 'cases';
    const region = assertOptionalRegion(options?.region);

    const params: Record<string, string> = { country: validatedCountry };
    if (options?.type) {
      params.type = metricType;
    }
    if (region) {
      params.region = region;
    }

    const body = await this.request(params);
    if (!Array.isArray(body)) {
      throw new UpstreamBadResponseError(
        'country response must be a JSON array',
      );
    }

    return body.map((row) => parseCountrySeriesRow(row, metricType));
  }

  async fetchByDate(
    date: string,
    options?: ApiNinjasQueryOptions,
  ): Promise<ApiNinjasDateSnapshotRow[]> {
    const validatedDate = assertIsoDate(date);
    const metricType = assertMetricType(options?.type) ?? 'cases';

    const params: Record<string, string> = { date: validatedDate };
    if (options?.type) {
      params.type = metricType;
    }

    const body = await this.request(params);
    if (!Array.isArray(body)) {
      throw new UpstreamBadResponseError('date response must be a JSON array');
    }

    return body.map((row) => parseDateSnapshotRow(row, metricType));
  }

  private getApiKey(): string {
    // Fail on invoke, not at boot — key is optional until ingest runs.
    const key = this.config.get('API_NINJAS_KEY', { infer: true });
    if (!key?.trim()) {
      throw new UpstreamMissingApiKeyError();
    }
    return key;
  }

  private getTimeoutMs(): number {
    const raw = process.env.API_NINJAS_TIMEOUT_MS;
    if (!raw) {
      return DEFAULT_TIMEOUT_MS;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1_000) {
      return DEFAULT_TIMEOUT_MS;
    }

    return parsed;
  }

  private async request(params: Record<string, string>): Promise<unknown> {
    const apiKey = this.getApiKey();
    const timeoutMs = this.getTimeoutMs();
    let lastError: UpstreamError | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await firstValueFrom(
          this.http.get<unknown>(COVID_PATH, {
            baseURL: BASE_URL,
            params,
            headers: { 'X-Api-Key': apiKey },
            timeout: timeoutMs,
            // Map all status codes in handleHttpStatus — never leak key in errors.
            validateStatus: () => true,
          }),
        );

        return this.handleHttpStatus(response.status, response.data);
      } catch (error) {
        const mapped = this.mapTransportError(error, timeoutMs);
        if (this.shouldRetry(mapped, attempt)) {
          lastError = mapped;
          await this.sleep(attempt);
          continue;
        }
        throw mapped;
      }
    }

    throw lastError ?? new UpstreamUnavailableError();
  }

  private handleHttpStatus(status: number, data: unknown): unknown {
    if (status === 401) {
      throw new UpstreamUnauthorizedError();
    }
    if (status === 429) {
      throw new UpstreamRateLimitedError();
    }
    if (status >= 400 && status < 500) {
      throw new UpstreamBadResponseError(
        `API Ninjas rejected the request with status ${status}`,
      );
    }
    if (status >= 500) {
      throw new UpstreamUnavailableError(
        `API Ninjas returned server error ${status}`,
      );
    }
    if (status < 200 || status >= 300) {
      throw new UpstreamBadResponseError(
        `API Ninjas returned unexpected status ${status}`,
      );
    }

    if (data === undefined || data === null || data === '') {
      throw new UpstreamBadResponseError('API Ninjas returned an empty body');
    }

    return data;
  }

  private mapTransportError(error: unknown, timeoutMs: number): UpstreamError {
    if (error instanceof UpstreamError) {
      return error;
    }

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        return new UpstreamTimeoutError(timeoutMs);
      }
      if (error.response) {
        this.handleHttpStatus(error.response.status, error.response.data);
      }
      return new UpstreamUnavailableError('network error reaching API Ninjas');
    }

    return new UpstreamUnavailableError('unexpected error reaching API Ninjas');
  }

  private shouldRetry(error: UpstreamError, attempt: number): boolean {
    if (attempt >= MAX_RETRIES) {
      return false;
    }

    // 4xx (incl. 401/429) are not retried — only transient failures.
    return error.code === 'UNAVAILABLE' || error.code === 'TIMEOUT';
  }

  private sleep(attempt: number): Promise<void> {
    const delayMs = 250 * 2 ** attempt;
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
