import type { CountryDetailResponse, SummaryResponse } from '@/lib/api/types';

import {
  formatMetricValue,
  formatReferenceDateSubtitle,
} from './format-metric';

/** Single KPI card view data — safe strings for React text nodes only. */
export type KpiCardViewModel = {
  id: KpiMetricKey;
  label: string;
  value: string;
  subtitle?: string;
};

export type KpiPanelViewModel = {
  scopeLabel: string;
  referenceDate: string | null;
  cards: [KpiCardViewModel, KpiCardViewModel, KpiCardViewModel];
  isEmpty: boolean;
};

export type KpiMetricKey = 'casesTotal' | 'deathsTotal' | 'casesNew';

/**
 * MVP KPI definitions (REQ-F-33).
 * Third metric uses casesNew — EXTERNAL_APIS G-01: upstream active cases unavailable;
 * label must read "New cases (daily)", not "Active cases".
 */
export const KPI_METRIC_DEFINITIONS: ReadonlyArray<{
  id: KpiMetricKey;
  label: string;
}> = [
  { id: 'casesTotal', label: 'Confirmed cases' },
  { id: 'deathsTotal', label: 'Deaths' },
  { id: 'casesNew', label: 'New cases (daily)' },
];

type MetricsLike = {
  casesTotal: number | null;
  deathsTotal: number | null;
  casesNew: number | null;
};

function buildCards(
  metrics: MetricsLike,
  referenceDate: string | null | undefined,
): [KpiCardViewModel, KpiCardViewModel, KpiCardViewModel] {
  const subtitle = formatReferenceDateSubtitle(referenceDate);

  return KPI_METRIC_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    value: formatMetricValue(metrics[definition.id]),
    subtitle,
  })) as [KpiCardViewModel, KpiCardViewModel, KpiCardViewModel];
}

function metricsAreEmpty(metrics: MetricsLike): boolean {
  return KPI_METRIC_DEFINITIONS.every(
    (definition) => metrics[definition.id] === null,
  );
}

/** Map GET /covid/summary to KPI panel view model (global scope). */
export function mapSummaryToKpiPanel(
  response: SummaryResponse,
): KpiPanelViewModel {
  return {
    scopeLabel: 'Global',
    referenceDate: response.referenceDate ?? null,
    cards: buildCards(response.metrics, response.referenceDate),
    isEmpty: metricsAreEmpty(response.metrics),
  };
}

/** Map GET /covid/countries/:code to KPI panel view model (country scope). */
export function mapCountryDetailToKpiPanel(
  response: CountryDetailResponse,
): KpiPanelViewModel {
  const countryName =
    typeof response.country.name === 'string' && response.country.name.trim()
      ? response.country.name.trim()
      : response.country.code;

  return {
    scopeLabel: countryName,
    referenceDate: response.referenceDate ?? null,
    cards: buildCards(response.metrics, response.referenceDate),
    isEmpty: metricsAreEmpty(response.metrics),
  };
}

/** User-facing error text from ApiError — plain text only, no stack traces. */
export function toKpiPanelErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Unable to load KPI data. Please try again later.';
}
