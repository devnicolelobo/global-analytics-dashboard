import type { Metric } from '@/lib/api/types';

/**
 * MVP chart metric — fixed enum value for series requests (REQ-F-43 / API_SPEC §9.4).
 * Do not accept free-text metric from URL or user input without validation.
 */
export const CHART_METRIC: Metric = 'casesTotal';

/** English chart title (REQ-F-43). */
export const CHART_TITLE = 'Confirmed cases over time';

/** Legend / series label identifying the metric (REQ-F-43). */
export const CHART_SERIES_LABEL = 'Confirmed cases';

/** Empty history copy when API returns points: [] (REQ-F-42). */
export const CHART_EMPTY_MESSAGE =
  'No historical data for this scope. Run a full sync on the API or select another country.';
