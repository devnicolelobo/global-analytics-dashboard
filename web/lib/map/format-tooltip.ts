/**
 * Plain-text map tooltip formatting (REQ-F-23).
 *
 * Uses list-row metrics from GET /covid/countries — no per-hover getCountry calls.
 *
 * Security: Leaflet assigns string tooltips via innerHTML. Always bind an HTMLElement
 * with textContent (see createCountryTooltipElement) — never pass raw API strings.
 */
import type { CountryListItem } from '@/lib/api/types';
import { KPI_METRIC_DEFINITIONS } from '@/lib/kpis/map-kpi-view-model';
import { formatMetricValue } from '@/lib/kpis/format-metric';
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

function resolveCountryTitle(country: CountryListItem): string {
  const name = sanitizeDisplayText(country.name);
  const code = sanitizeDisplayText(country.code);

  if (name.length > 0 && code.length > 0) {
    return `${name} (${code})`;
  }
  if (name.length > 0) {
    return name;
  }
  if (code.length > 0) {
    return code;
  }
  return 'Unknown country';
}

/** Multi-line English tooltip: country name + primary KPI metrics. */
export function formatCountryTooltipText(country: CountryListItem): string {
  const lines = [resolveCountryTitle(country)];

  for (const definition of KPI_METRIC_DEFINITIONS) {
    const value = formatMetricValue(country.metrics[definition.id]);
    lines.push(`${definition.label}: ${value}`);
  }

  return lines.join('\n');
}

/**
 * Build a Leaflet-safe tooltip node (textContent only — no HTML interpretation).
 * Call from Client Components after country row join succeeds.
 */
export function createCountryTooltipElement(
  country: CountryListItem,
): HTMLDivElement {
  const node = document.createElement('div');
  node.style.whiteSpace = 'pre-line';
  node.textContent = formatCountryTooltipText(country);
  return node;
}
