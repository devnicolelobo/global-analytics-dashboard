/**
 * Pure copy formatter for the data coverage banner (Sprint 04 / REQ-F-52 companion).
 *
 * Inputs are validated counts and a pre-formatted reference date label.
 */
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

import type { CountriesResponse } from '@/lib/api/types';

export type CoverageBannerInput = {
  mapCountryCount: number;
  chartReadyCount: number;
  referenceDateLabel: string | null;
};

export type CoverageBannerDisplay = {
  mapCountryCount: number;
  chartReadyCount: number;
  referenceDateLabel: string | null;
  referenceUnavailable: boolean;
};

function normalizeCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function sanitizeReferenceDateLabel(label: string | null): string | null {
  if (label === null) {
    return null;
  }

  const sanitized = sanitizeDisplayText(label, 32);
  return sanitized.length > 0 ? sanitized : null;
}

/** Resolve map/KPI country count from API payload — prefers meta.count, falls back to array length. */
export function resolveMapCountryCount(response: CountriesResponse): number {
  const metaCount = response.meta?.count;
  if (
    typeof metaCount === 'number' &&
    Number.isFinite(metaCount) &&
    metaCount >= 0
  ) {
    return Math.floor(metaCount);
  }

  if (Array.isArray(response.countries)) {
    return response.countries.length;
  }

  throw new Error('Invalid countries payload');
}

export function buildCoverageBannerDisplay(
  input: CoverageBannerInput,
): CoverageBannerDisplay {
  const mapCountryCount = normalizeCount(input.mapCountryCount);
  const chartReadyCount = normalizeCount(input.chartReadyCount);
  const referenceDateLabel = sanitizeReferenceDateLabel(input.referenceDateLabel);

  return {
    mapCountryCount,
    chartReadyCount,
    referenceDateLabel,
    referenceUnavailable: referenceDateLabel === null,
  };
}

export function formatCoverageBannerMessage(input: CoverageBannerInput): string {
  const display = buildCoverageBannerDisplay(input);

  const mapScope = `Map & KPIs: ${display.mapCountryCount} ${pluralize(display.mapCountryCount, 'country', 'countries')}`;
  const chartScope = `Full daily chart: ${display.chartReadyCount} ${pluralize(display.chartReadyCount, 'country', 'countries')}`;
  const referenceScope = display.referenceUnavailable
    ? 'Reference: unavailable'
    : `Reference: ${display.referenceDateLabel}`;

  return `${mapScope} · ${chartScope} · ${referenceScope}`;
}
