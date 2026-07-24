/**
 * Chart axis number formatting (REQ-F-42 Y-axis legibility).
 * Pure helpers — shared by Recharts axis ticks and tooltip text.
 */

const Y_AXIS_NUMBER_FORMAT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const TOOLTIP_NUMBER_FORMAT = new Intl.NumberFormat('en-US');

/** Compact Y-axis labels for large cumulative totals (e.g. 37M, 103M). */
export function formatChartYAxisTick(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return Y_AXIS_NUMBER_FORMAT.format(value);
}

/** Full-precision tooltip values for a single date point. */
export function formatChartTooltipValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return TOOLTIP_NUMBER_FORMAT.format(value);
}
