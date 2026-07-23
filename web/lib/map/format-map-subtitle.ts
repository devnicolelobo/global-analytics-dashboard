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
