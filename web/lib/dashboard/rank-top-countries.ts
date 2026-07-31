/**
 * Pure ranking helpers for the global top-countries panel (Sprint 04 / DEV-98).
 */
import type { CountryListItem } from '@/lib/api/types';
import { normalizeCountryCodeInput } from '@/lib/country-code';
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

import { mapCountryMetricSnapshot } from './country-metric-snapshot';

import {
  TOP_COUNTRIES_LIMIT,
  type TopCountriesMetric,
} from './top-countries-metrics';

export type CountryMetricSnapshot = {
  casesTotal: number | null;
  deathsTotal: number | null;
  casesNew: number | null;
};

export type RankedCountryRow = {
  rank: number;
  code: string;
  name: string;
  metrics: CountryMetricSnapshot;
};

export function getSortMetricValue(
  row: RankedCountryRow,
  metric: TopCountriesMetric,
): number | null {
  return row.metrics[metric];
}

function compareMetricValues(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  return right - left;
}

/** Heading when fewer than `limit` countries are ranked. */
export function formatTopCountriesHeading(
  rankedCount: number,
  limit = TOP_COUNTRIES_LIMIT,
): string {
  if (rankedCount <= 0) {
    return 'Global leaders';
  }
  if (rankedCount === 1) {
    return 'Global leader';
  }

  const displayed = Math.min(rankedCount, limit);
  if (displayed < limit) {
    return `Top ${displayed} countries`;
  }

  return `Top ${limit} countries`;
}

/**
 * Rank countries by metric snapshot — null sort values last; ties broken by name A→Z.
 * Each row carries full cases/deaths/new snapshot for multi-column display.
 */
export function rankTopCountries(
  countries: CountryListItem[],
  metric: TopCountriesMetric,
  limit = TOP_COUNTRIES_LIMIT,
): RankedCountryRow[] {
  if (!Array.isArray(countries) || countries.length === 0) {
    return [];
  }

  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : TOP_COUNTRIES_LIMIT;

  const eligible = countries.flatMap((country) => {
    const code = normalizeCountryCodeInput(country.code);
    if (code === null) {
      return [];
    }

    const name = sanitizeDisplayText(country.name, 80);
    if (name.length === 0) {
      return [];
    }

    return [
      {
        code,
        name,
        metrics: mapCountryMetricSnapshot(country),
      },
    ];
  });

  const seenCodes = new Set<string>();
  const deduped = eligible.filter((row) => {
    if (seenCodes.has(row.code)) {
      return false;
    }
    seenCodes.add(row.code);
    return true;
  });

  const sorted = [...deduped].sort((left, right) => {
    const byMetric = compareMetricValues(
      left.metrics[metric],
      right.metrics[metric],
    );
    if (byMetric !== 0) {
      return byMetric;
    }
    return left.name.localeCompare(right.name, 'en');
  });

  return sorted.slice(0, normalizedLimit).map((row, index) => ({
    rank: index + 1,
    code: row.code,
    name: row.name,
    metrics: row.metrics,
  }));
}
