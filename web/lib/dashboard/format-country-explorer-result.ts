import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

import { normalizeCountrySearchQuery } from './filter-countries-by-query';

/** User-facing result count — query sanitized before interpolation (REQ-NF-01). */
export function formatCountryExplorerResultCopy(
  visibleCount: number,
  totalCount: number,
  query: string,
): string {
  if (totalCount === 0) {
    return 'No countries available';
  }

  const displayQuery = sanitizeDisplayText(
    normalizeCountrySearchQuery(query),
    64,
  );

  if (displayQuery.length === 0) {
    return `Showing all ${totalCount} countries`;
  }

  if (visibleCount === 0) {
    return `No countries match “${displayQuery}”`;
  }

  return `Showing ${visibleCount} of ${totalCount} countries`;
}
