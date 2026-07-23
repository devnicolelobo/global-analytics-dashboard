/**
 * Safe display helpers for map panel copy (reference date subtitle).
 */
import { isIsoDateString } from '@/lib/kpis/sanitize-display';

/** English subtitle fragment when API reference date is valid YYYY-MM-DD. */
export function formatMapReferenceDateSuffix(
  referenceDate: string | null | undefined,
): string {
  if (typeof referenceDate !== 'string') {
    return '';
  }

  const trimmed = referenceDate.trim();
  if (!isIsoDateString(trimmed)) {
    return '';
  }

  return ` · Reference date: ${trimmed}`;
}

/** Coverage hint — only countries with persisted metrics are colored (not zero-filled). */
export function formatMapDataCoverageSuffix(
  countriesWithData: number | null | undefined,
): string {
  if (
    countriesWithData === null ||
    countriesWithData === undefined ||
    !Number.isFinite(countriesWithData) ||
    countriesWithData < 0
  ) {
    return '';
  }

  const count = Math.trunc(countriesWithData);
  const label = count === 1 ? 'country' : 'countries';
  return ` · ${count} ${label} with data`;
}
