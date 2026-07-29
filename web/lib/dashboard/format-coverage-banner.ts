/**
 * Pure copy formatter for the data coverage banner (Sprint 04 / REQ-F-52 companion).
 *
 * Inputs are already validated counts and a pre-formatted reference date label.
 */
export type CoverageBannerInput = {
  mapCountryCount: number;
  chartReadyCount: number;
  referenceDateLabel: string | null;
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

export function formatCoverageBannerMessage(input: CoverageBannerInput): string {
  const mapCountryCount = normalizeCount(input.mapCountryCount);
  const chartReadyCount = normalizeCount(input.chartReadyCount);

  const mapScope = `Map & KPIs: ${mapCountryCount} ${pluralize(mapCountryCount, 'country', 'countries')}`;
  const chartScope = `Full daily chart: ${chartReadyCount} ${pluralize(chartReadyCount, 'country', 'countries')}`;
  const referenceScope =
    input.referenceDateLabel !== null && input.referenceDateLabel.length > 0
      ? `Reference: ${input.referenceDateLabel}`
      : 'Reference: unavailable';

  return `${mapScope} · ${chartScope} · ${referenceScope}`;
}
