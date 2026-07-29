import type { Metric } from '@/lib/api/types';

/** Sort metrics exposed in the top-countries panel (Sprint 04 / DEV-98). */
export type TopCountriesMetric = Extract<
  Metric,
  'casesTotal' | 'deathsTotal' | 'casesNew'
>;

export const DEFAULT_TOP_COUNTRIES_METRIC: TopCountriesMetric = 'casesTotal';

export const TOP_COUNTRIES_LIMIT = 10;

export type TopCountriesMetricOption = {
  value: TopCountriesMetric;
  label: string;
};

export const TOP_COUNTRIES_METRIC_OPTIONS: readonly TopCountriesMetricOption[] =
  [
    { value: 'casesTotal', label: 'Confirmed cases' },
    { value: 'deathsTotal', label: 'Deaths' },
    { value: 'casesNew', label: 'New cases (daily)' },
  ] as const;

export function isTopCountriesMetric(value: string): value is TopCountriesMetric {
  return TOP_COUNTRIES_METRIC_OPTIONS.some((option) => option.value === value);
}

export function getTopCountriesMetricLabel(metric: TopCountriesMetric): string {
  return (
    TOP_COUNTRIES_METRIC_OPTIONS.find((option) => option.value === metric)
      ?.label ?? 'Metric'
  );
}
