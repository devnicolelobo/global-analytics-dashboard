/**
 * Dashboard selection domain model.
 *
 * `null` = global view (default). Non-null = uppercase ISO 3166-1 alpha-2 country code.
 * Pure helpers keep validation testable without React; see assertCountryCode in lib/api/query
 * for HTTP request guards (throws on invalid input).
 */

/** ISO 3166-1 alpha-2 uppercase (e.g. BR, US). Matches API_SPEC country path segment. */
const ISO2_UPPER = /^[A-Z]{2}$/;

/** Global when null; otherwise a validated ISO2 country code. */
export type SelectedCountry = string | null;

export type DashboardSelectionState = {
  selectedCountry: SelectedCountry;
};

export type DashboardSelectionActions = {
  /** Select a country; invalid codes are ignored (no state change). */
  selectCountry: (code: string) => void;
  /** Return to global view without navigation or reload (REQ-F-24). */
  clearSelection: () => void;
};

export type DashboardSelectionContextValue = DashboardSelectionState &
  DashboardSelectionActions;

/**
 * Parse user/API-facing country input for selection state.
 * Returns null when the code is not exactly two uppercase letters — no throw, no auto-uppercase.
 */
export function parseCountryCodeForSelection(code: string): string | null {
  const trimmed = code.trim();
  if (!ISO2_UPPER.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Apply selectCountry semantics to current state (immutable). */
export function applySelectCountry(
  current: SelectedCountry,
  code: string,
): SelectedCountry {
  const parsed = parseCountryCodeForSelection(code);
  if (parsed === null) {
    return current;
  }
  return parsed;
}

/** Apply clearSelection — always global. */
export function applyClearSelection(): SelectedCountry {
  return null;
}
