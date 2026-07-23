/**
 * KPI metric display formatting (REQ-F-32).
 * Pure helpers — no React, no fetch — safe for unit tests and Server/Client reuse.
 */

const METRIC_NUMBER_FORMAT = new Intl.NumberFormat('en-US');

/** English placeholder when API returns null/undefined for a metric field. */
export const EMPTY_METRIC_DISPLAY = '—';

/**
 * Format a numeric KPI for UI. Null, undefined, and NaN render as an em dash — never "NaN".
 */
export function formatMetricValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return EMPTY_METRIC_DISPLAY;
  }
  return METRIC_NUMBER_FORMAT.format(value);
}

/**
 * Format reference date subtitle when API returns YYYY-MM-DD.
 * Returns undefined when missing so cards can omit the subtitle.
 */
export function formatReferenceDateSubtitle(
  referenceDate: string | null | undefined,
): string | undefined {
  if (typeof referenceDate !== 'string') {
    return undefined;
  }
  const trimmed = referenceDate.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return `Reference date: ${trimmed}`;
}
