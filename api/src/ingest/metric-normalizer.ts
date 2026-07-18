import { Injectable, Logger } from '@nestjs/common';
import {
  ApiNinjasCountrySeriesRow,
  ApiNinjasDailyMetric,
  ApiNinjasDateSnapshotRow,
  ApiNinjasTimeSeries,
} from '../integration/api-ninjas/api-ninjas.types';
import { resolveCountry } from './country-iso-map';
import {
  NormalizeBatchResult,
  NormalizedMetricFields,
  NormalizedMetricInput,
} from './normalized-metric.types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE = 'api-ninjas' as const;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/** Empty / blank region → "" (never null) — DATA_MODEL §5.1. */
export function normalizeRegion(region: string | null | undefined): string {
  if (region === null || region === undefined) {
    return '';
  }

  return region.trim();
}

/**
 * Coerce upstream numeric values to Int-safe numbers.
 * Returns null for missing values; undefined when the value is present but invalid (caller skips field).
 */
export function coerceInteger(value: unknown): number | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.trunc(value);
}

function metricFieldsFromDaily(
  metric: ApiNinjasDailyMetric,
  kind: 'cases' | 'deaths',
): NormalizedMetricFields | undefined {
  const total = coerceInteger(metric.total);
  const dailyNew = coerceInteger(metric.new);

  // Both numbers invalid → drop this metric bucket.
  if (total === undefined && dailyNew === undefined) {
    return undefined;
  }

  if (kind === 'cases') {
    return {
      casesTotal: total === undefined ? null : total,
      casesNew: dailyNew === undefined ? null : dailyNew,
    };
  }

  return {
    deathsTotal: total === undefined ? null : total,
    deathsNew: dailyNew === undefined ? null : dailyNew,
  };
}

function naturalKey(
  countryCode: string,
  region: string,
  referenceDate: string,
): string {
  return `${countryCode}|${region}|${referenceDate}`;
}

/**
 * Pure-ish transformation layer: API Ninjas payloads → domain DTOs.
 * No HTTP / no Prisma — ingest orchestration calls this before upsert.
 */
@Injectable()
export class MetricNormalizer {
  private readonly logger = new Logger(MetricNormalizer.name);

  /**
   * Mode A — expand time series rows into one NormalizedMetricInput per date.
   * Handles `cases` and/or `deaths` keys (G-06).
   */
  normalizeSeries(rows: ApiNinjasCountrySeriesRow[]): NormalizeBatchResult {
    const metricsByKey = new Map<string, NormalizedMetricInput>();
    const skippedUnmapped = new Set<string>();
    let skippedInvalidDates = 0;

    for (const row of rows) {
      const resolved = resolveCountry(row.country);
      if (!resolved) {
        skippedUnmapped.add(row.country);
        this.logger.warn(
          `Skipping unmapped upstream country name: "${row.country}"`,
        );
        continue;
      }

      const region = normalizeRegion(row.region);

      skippedInvalidDates += this.mergeTimeSeries(
        metricsByKey,
        resolved,
        region,
        row.cases,
        'cases',
      );
      skippedInvalidDates += this.mergeTimeSeries(
        metricsByKey,
        resolved,
        region,
        row.deaths,
        'deaths',
      );
    }

    return {
      metrics: [...metricsByKey.values()],
      skippedUnmappedCountries: [...skippedUnmapped],
      skippedInvalidDates,
    };
  }

  /**
   * Mode B — map snapshot rows for a single calendar date param.
   */
  normalizeSnapshot(
    rows: ApiNinjasDateSnapshotRow[],
    referenceDate: string,
  ): NormalizeBatchResult {
    const trimmedDate = referenceDate?.trim() ?? '';
    if (!isValidIsoDate(trimmedDate)) {
      return {
        metrics: [],
        skippedUnmappedCountries: [],
        skippedInvalidDates: rows.length > 0 ? rows.length : 1,
      };
    }

    const metrics: NormalizedMetricInput[] = [];
    const skippedUnmapped = new Set<string>();

    for (const row of rows) {
      const resolved = resolveCountry(row.country);
      if (!resolved) {
        skippedUnmapped.add(row.country);
        this.logger.warn(
          `Skipping unmapped upstream country name: "${row.country}"`,
        );
        continue;
      }

      const region = normalizeRegion(row.region);
      const fields: NormalizedMetricFields = {};

      if (row.cases) {
        Object.assign(fields, metricFieldsFromDaily(row.cases, 'cases'));
      }
      if (row.deaths) {
        Object.assign(fields, metricFieldsFromDaily(row.deaths, 'deaths'));
      }

      // Row with neither usable cases nor deaths → skip silently.
      if (
        fields.casesTotal === undefined &&
        fields.casesNew === undefined &&
        fields.deathsTotal === undefined &&
        fields.deathsNew === undefined
      ) {
        continue;
      }

      metrics.push({
        countryCode: resolved.iso2,
        countryName: resolved.name,
        upstreamName: resolved.upstreamName,
        region,
        referenceDate: trimmedDate,
        source: SOURCE,
        ...fields,
      });
    }

    return {
      metrics,
      skippedUnmappedCountries: [...skippedUnmapped],
      skippedInvalidDates: 0,
    };
  }

  private mergeTimeSeries(
    metricsByKey: Map<string, NormalizedMetricInput>,
    resolved: { iso2: string; name: string; upstreamName: string },
    region: string,
    series: ApiNinjasTimeSeries | undefined,
    kind: 'cases' | 'deaths',
  ): number {
    if (!series) {
      return 0;
    }

    let skippedInvalidDates = 0;

    for (const [dateKey, metric] of Object.entries(series)) {
      const referenceDate = dateKey.trim();
      if (!isValidIsoDate(referenceDate)) {
        skippedInvalidDates += 1;
        continue;
      }

      const fields = metricFieldsFromDaily(metric, kind);
      if (!fields) {
        continue;
      }

      const key = naturalKey(resolved.iso2, region, referenceDate);
      const existing = metricsByKey.get(key);

      if (existing) {
        Object.assign(existing, fields);
      } else {
        metricsByKey.set(key, {
          countryCode: resolved.iso2,
          countryName: resolved.name,
          upstreamName: resolved.upstreamName,
          region,
          referenceDate,
          source: SOURCE,
          ...fields,
        });
      }
    }

    return skippedInvalidDates;
  }
}
