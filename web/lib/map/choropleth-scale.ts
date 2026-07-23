/**
 * Choropleth color scale helpers (REQ-F-21).
 *
 * Pure functions — no Leaflet/DOM — unit-tested in Node. Maps metric magnitude to
 * fill colors; null metrics get a distinct style so "no data" is not confused with zero.
 */

/** Fill for countries with null/undefined metric (distinct from lowest scale step). */
export const CHOROPLETH_NO_DATA_COLOR = '#cbd5e1';

/** Lowest and highest values on the sequential blue scale (ColorBrewer-inspired). */
export const CHOROPLETH_SCALE_MIN_COLOR = '#eff3ff';
export const CHOROPLETH_SCALE_MAX_COLOR = '#08519c';

export type MetricExtent = {
  min: number;
  max: number;
};

export type ChoroplethLegendStop = {
  value: number;
  color: string;
  label: string;
};

const METRIC_NUMBER_FORMAT = new Intl.NumberFormat('en-US');

/**
 * Min/max over finite numeric values. Returns null when no valid points exist
 * (empty list or all null) — callers should fall back to no-data styling.
 */
export function computeMetricExtent(
  values: ReadonlyArray<number | null | undefined>,
): MetricExtent | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let hasValue = false;

  for (const raw of values) {
    if (raw === null || raw === undefined || Number.isNaN(raw)) {
      continue;
    }
    hasValue = true;
    if (raw < min) {
      min = raw;
    }
    if (raw > max) {
      max = raw;
    }
  }

  if (!hasValue) {
    return null;
  }

  if (min === max) {
    return { min, max: min + 1 };
  }

  return { min, max };
}

function clampRatio(ratio: number): number {
  if (ratio <= 0) {
    return 0;
  }
  if (ratio >= 1) {
    return 1;
  }
  return ratio;
}

function parseHexChannel(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

function toHexChannel(value: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(value)));
  return clamped.toString(16).padStart(2, '0');
}

/** Linear RGB interpolation between two #RRGGBB colors. */
export function interpolateHexColor(from: string, to: string, ratio: number): string {
  const t = clampRatio(ratio);
  const r1 = parseHexChannel(from, 1);
  const g1 = parseHexChannel(from, 3);
  const b1 = parseHexChannel(from, 5);
  const r2 = parseHexChannel(to, 1);
  const g2 = parseHexChannel(to, 3);
  const b2 = parseHexChannel(to, 5);

  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;

  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

/**
 * Map a metric value to choropleth fill color.
 * Null/undefined/NaN → CHOROPLETH_NO_DATA_COLOR (REQ-F-21 null handling).
 */
export function getChoroplethColor(
  value: number | null | undefined,
  extent: MetricExtent | null,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return CHOROPLETH_NO_DATA_COLOR;
  }

  if (extent === null) {
    return CHOROPLETH_NO_DATA_COLOR;
  }

  const ratio = (value - extent.min) / (extent.max - extent.min);
  return interpolateHexColor(
    CHOROPLETH_SCALE_MIN_COLOR,
    CHOROPLETH_SCALE_MAX_COLOR,
    ratio,
  );
}

/** Build legend stops (English labels) for the map panel. */
export function buildChoroplethLegendStops(
  extent: MetricExtent | null,
  stepCount = 5,
): ChoroplethLegendStop[] {
  if (extent === null || stepCount < 2) {
    return [];
  }

  const steps = stepCount - 1;
  const stops: ChoroplethLegendStop[] = [];

  for (let index = 0; index < stepCount; index += 1) {
    const ratio = index / steps;
    const value = extent.min + (extent.max - extent.min) * ratio;
    stops.push({
      value,
      color: interpolateHexColor(
        CHOROPLETH_SCALE_MIN_COLOR,
        CHOROPLETH_SCALE_MAX_COLOR,
        ratio,
      ),
      label: METRIC_NUMBER_FORMAT.format(Math.round(value)),
    });
  }

  return stops;
}
