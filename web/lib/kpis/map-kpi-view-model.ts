import type { CountryDetailResponse, SummaryResponse } from '@/lib/api/types';
import { ApiError, sanitizeErrorMessage } from '@/lib/api/errors';

import {
  formatMetricValue,
  formatReferenceDateSubtitle,
} from './format-metric';
import { isIsoDateString, sanitizeDisplayText } from './sanitize-display';

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

function normalizeReferenceDate(
  referenceDate: string | null | undefined,
): string | null {
  if (typeof referenceDate !== 'string') {
    return null;
  }
  const trimmed = referenceDate.trim();
  return isIsoDateString(trimmed) ? trimmed : null;
}

function resolveCountryScopeLabel(country: CountryDetailResponse['country']): string {
  const sanitizedName = sanitizeDisplayText(country.name);
  if (sanitizedName.length > 0) {
    return sanitizedName;
  }
  return sanitizeDisplayText(country.code) || 'Unknown country';
}

/** Map GET /covid/summary to KPI panel view model (global scope). */
export function mapSummaryToKpiPanel(
  response: SummaryResponse,
): KpiPanelViewModel {
  const referenceDate = normalizeReferenceDate(response.referenceDate);

  return {
    scopeLabel: 'Global',
    referenceDate,
    cards: buildCards(response.metrics, referenceDate),
    isEmpty: metricsAreEmpty(response.metrics),
  };
}

/** Map GET /covid/countries/:code to KPI panel view model (country scope). */
export function mapCountryDetailToKpiPanel(
  response: CountryDetailResponse,
): KpiPanelViewModel {
  const referenceDate = normalizeReferenceDate(response.referenceDate);

  return {
    scopeLabel: resolveCountryScopeLabel(response.country),
    referenceDate,
    cards: buildCards(response.metrics, referenceDate),
    isEmpty: metricsAreEmpty(response.metrics),
  };
}

/** User-facing error text — sanitized plain text, no stack traces or HTML. */
export function toKpiPanelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }
  return 'Unable to load KPI data. Please try again later.';
}
