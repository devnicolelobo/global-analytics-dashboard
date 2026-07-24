/**
 * Series API → chart view-model mappers (DEV-93).
 *
 * Pure functions only — defensive date sort even though API_SPEC §6.5 promises ascending order.
 * Null metric values are preserved so Recharts can break the line (connectNulls=false).
 */
import type {
  CountrySeriesResponse,
  GlobalSeriesResponse,
  SeriesPoint,
} from '@/lib/api/types';
import { parseCountryCodeForSelection } from '@/lib/dashboard/selection';
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

import type { ChartSeriesPoint, ChartSeriesViewModel, SeriesFetchTarget } from './types';

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_ONLY.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/** Sort ascending by ISO date; invalid dates sink to the end without crashing. */
export function sortSeriesPointsByDate(
  points: ReadonlyArray<SeriesPoint>,
): SeriesPoint[] {
  return [...points].sort((left, right) => {
    const leftValid = isValidIsoDate(left.date);
    const rightValid = isValidIsoDate(right.date);
    if (!leftValid && !rightValid) {
      return 0;
    }
    if (!leftValid) {
      return 1;
    }
    if (!rightValid) {
      return -1;
    }
    return left.date.localeCompare(right.date);
  });
}

export function mapSeriesPoint(point: SeriesPoint): ChartSeriesPoint {
  const date = typeof point.date === 'string' ? point.date.trim() : '';
  const value =
    point.value === null || point.value === undefined || Number.isNaN(point.value)
      ? null
      : point.value;

  return { date, value };
}

export function mapPointsToChartData(
  points: ReadonlyArray<SeriesPoint>,
): ChartSeriesPoint[] {
  return sortSeriesPointsByDate(points).map(mapSeriesPoint);
}

export function isEmptySeries(points: ReadonlyArray<unknown>): boolean {
  return points.length === 0;
}

function resolveCountryScopeLabel(
  country: CountrySeriesResponse['country'],
): string {
  const name = sanitizeDisplayText(country.name);
  if (name.length > 0) {
    return name;
  }
  const code = sanitizeDisplayText(country.code);
  return code.length > 0 ? code : 'Unknown country';
}

/** Map GET /covid/series response to chart view model. */
export function mapGlobalSeriesToChart(
  response: GlobalSeriesResponse,
): ChartSeriesViewModel {
  const points = mapPointsToChartData(response.points);

  return {
    scopeLabel: 'Global',
    points,
    isEmpty: isEmptySeries(points),
    meta: {
      pointCount: response.meta.pointCount,
      from: response.meta.from,
      to: response.meta.to,
    },
  };
}

/** Map GET /covid/countries/:code/series response to chart view model. */
export function mapCountrySeriesToChart(
  response: CountrySeriesResponse,
): ChartSeriesViewModel {
  const points = mapPointsToChartData(response.points);

  return {
    scopeLabel: resolveCountryScopeLabel(response.country),
    points,
    isEmpty: isEmptySeries(points),
    meta: {
      pointCount: response.meta.pointCount,
      from: response.meta.from,
      to: response.meta.to,
    },
  };
}

/**
 * Resolve which series endpoint to call from dashboard selection (DEV-90).
 * Global → GET /covid/series; country → GET /covid/countries/:code/series.
 */
export function resolveSeriesFetchTarget(
  isGlobal: boolean,
  selectedCountry: string | null,
): SeriesFetchTarget | null {
  if (isGlobal) {
    return { kind: 'global' };
  }

  const countryCode = parseCountryCodeForSelection(selectedCountry);
  if (countryCode === null) {
    return null;
  }

  return { kind: 'country', countryCode };
}

/** Thin X-axis tick labels for dense daily series (REQ-F-42 legibility). */
export function formatChartDateTick(date: string): string {
  if (!isValidIsoDate(date)) {
    return '';
  }
  const [, month, day] = date.split('-');
  return `${month}/${day}`;
}

/** Choose Recharts X-axis tick interval from point count (avoid overlapping labels). */
export function computeXAxisTickInterval(pointCount: number): number | 'preserveStartEnd' {
  if (pointCount <= 12) {
    return 0;
  }
  if (pointCount <= 24) {
    return 1;
  }
  if (pointCount <= 60) {
    return Math.ceil(pointCount / 12);
  }
  return 'preserveStartEnd';
}
