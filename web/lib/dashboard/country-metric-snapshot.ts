/**
 * Shared metric snapshot extraction for dashboard country lists (DEV-98 / DEV-99).
 */
import type { CountryListItem } from '@/lib/api/types';

import type { CountryMetricSnapshot } from './rank-top-countries';

function readMetricValue(
  country: CountryListItem,
  metric: keyof CountryMetricSnapshot,
): number | null {
  const value = country.metrics[metric];
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return value;
}

export function mapCountryMetricSnapshot(
  country: CountryListItem,
): CountryMetricSnapshot {
  return {
    casesTotal: readMetricValue(country, 'casesTotal'),
    deathsTotal: readMetricValue(country, 'deathsTotal'),
    casesNew: readMetricValue(country, 'casesNew'),
  };
}
