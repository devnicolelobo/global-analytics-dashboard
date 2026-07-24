/**
 * Chart layer view models (DEV-93).
 * Pure data shapes — no Recharts imports so mappers stay unit-testable in Node.
 */

/** One plotted point after API normalization (null value → gap in line). */
export type ChartSeriesPoint = {
  date: string;
  value: number | null;
};

export type ChartSeriesViewModel = {
  scopeLabel: string;
  points: ChartSeriesPoint[];
  /** True when API returned zero points (REQ-F-42 empty state). */
  isEmpty: boolean;
  meta: {
    pointCount: number;
    from: string | null;
    to: string | null;
  };
};

/** Which series endpoint to call for the current dashboard selection. */
export type SeriesFetchTarget =
  | { kind: 'global' }
  | { kind: 'country'; countryCode: string };
