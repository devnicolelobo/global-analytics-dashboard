/**
 * Client-side country search for the Country Explorer (Sprint 04 / DEV-99).
 */
export type CountrySearchRow = {
  code: string;
  name: string;
};

export const MAX_COUNTRY_SEARCH_QUERY_LENGTH = 64;

/** Trim and cap query length before matching — avoids unbounded work on paste. */
export function normalizeCountrySearchQuery(query: string): string {
  return query.trim().slice(0, MAX_COUNTRY_SEARCH_QUERY_LENGTH);
}

/**
 * Filter rows by country name (substring) or ISO2 prefix — case insensitive.
 * Empty query returns the input list unchanged (caller handles default sort).
 */
export function filterCountriesByQuery<T extends CountrySearchRow>(
  rows: readonly T[],
  query: string,
): T[] {
  const normalized = normalizeCountrySearchQuery(query);
  if (normalized.length === 0) {
    return [...rows];
  }

  const lowerQuery = normalized.toLowerCase();

  return rows.filter((row) => {
    if (row.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return row.code.toLowerCase().startsWith(lowerQuery);
  });
}
