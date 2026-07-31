/**
 * Normalize API country rows for the Country Explorer (Sprint 04 / DEV-99).
 */
import type { CountryListItem } from '@/lib/api/types';
import { normalizeCountryCodeInput } from '@/lib/country-code';
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

import { mapCountryMetricSnapshot } from './country-metric-snapshot';
import type { CountryMetricSnapshot } from './rank-top-countries';

export type ExplorerCountryRow = {
  code: string;
  name: string;
  metrics: CountryMetricSnapshot;
};

/** Map API list to explorer rows — invalid codes/names dropped, ISO2 deduped. */
export function mapExplorerCountryRows(
  countries: CountryListItem[],
): ExplorerCountryRow[] {
  if (!Array.isArray(countries) || countries.length === 0) {
    return [];
  }

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

  return eligible.filter((row) => {
    if (seenCodes.has(row.code)) {
      return false;
    }
    seenCodes.add(row.code);
    return true;
  });
}

export function sortExplorerCountryRowsByName(
  rows: readonly ExplorerCountryRow[],
): ExplorerCountryRow[] {
  return [...rows].sort((left, right) =>
    left.name.localeCompare(right.name, 'en'),
  );
}
