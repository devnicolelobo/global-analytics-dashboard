/**
 * Allowed `metric` query values (API_SPEC §9.4).
 * Default for charts / country list sort: `casesTotal`.
 */
export enum MetricType {
  casesTotal = 'casesTotal',
  deathsTotal = 'deathsTotal',
  casesNew = 'casesNew',
  deathsNew = 'deathsNew',
}

export const METRIC_TYPES = Object.values(MetricType) as MetricType[];

export const DEFAULT_METRIC = MetricType.casesTotal;
