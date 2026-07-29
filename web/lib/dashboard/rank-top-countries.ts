/**
 * Pure ranking helpers for the global top-countries panel (Sprint 04 / DEV-98).
 */
import type { CountryListItem } from '@/lib/api/types';
import { normalizeCountryCodeInput } from '@/lib/country-code';
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

import {
  TOP_COUNTRIES_LIMIT,
  type TopCountriesMetric,
} from './top-countries-metrics';

export type RankedCountryRow = {
  rank: number;
  code: string;
  name: string;
  metricValue: number | null;
};

function getMetricValue(
  country: CountryListItem,
  metric: TopCountriesMetric,
): number | null {
  const value = country.metrics[metric];
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return value;
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
    return 'Top countries';
  }
  if (rankedCount === 1) {
    return 'Top country';
  }

  const displayed = Math.min(rankedCount, limit);
  if (displayed < limit) {
    return `Top ${displayed} countries`;
  }

  return `Top ${limit} countries`;
}

/**
 * Rank countries by metric snapshot — null metrics last; ties broken by sanitized name A→Z.
 * Rows with invalid ISO2 codes are excluded.
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
        metricValue: getMetricValue(country, metric),
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
    const byMetric = compareMetricValues(left.metricValue, right.metricValue);
    if (byMetric !== 0) {
      return byMetric;
    }
    return left.name.localeCompare(right.name, 'en');
  });

  return sorted.slice(0, normalizedLimit).map((row, index) => ({
    rank: index + 1,
    code: row.code,
    name: row.name,
    metricValue: row.metricValue,
  }));
}
