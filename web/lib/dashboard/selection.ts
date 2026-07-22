/**
 * Dashboard selection domain model.
 *
 * `null` = global view (default). Non-null = uppercase ISO 3166-1 alpha-2 country code.
 * Validation delegates to `lib/country-code.ts` so API URL builders and selection state
 * share one boundary. Invalid/untrusted input is rejected without throwing.
 */

import { normalizeCountryCodeInput } from '@/lib/country-code';

/** Global when null; otherwise a validated ISO2 country code. */
export type SelectedCountry = string | null;

export type DashboardSelectionState = {
  selectedCountry: SelectedCountry;
  /** True when no country is selected (global KPI/chart scope). */
  isGlobal: boolean;
};

export type DashboardSelectionActions = {
  /** Select a country; invalid codes are ignored (no state change). */
  selectCountry: (code: unknown) => void;
  /** Return to global view without navigation or reload (REQ-F-24). */
  clearSelection: () => void;
};

export type DashboardSelectionContextValue = DashboardSelectionState &
  DashboardSelectionActions;

/**
 * Parse user/API-facing country input for selection state.
 * Returns null when type, length, or shape is invalid — no throw, no auto-uppercase.
 */
export function parseCountryCodeForSelection(code: unknown): string | null {
  return normalizeCountryCodeInput(code);
}

/** Apply selectCountry semantics to current state (immutable). */
export function applySelectCountry(
  current: SelectedCountry,
  code: unknown,
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

/** Type guard for global dashboard scope. */
export function isGlobalSelection(
  selectedCountry: SelectedCountry,
): selectedCountry is null {
  return selectedCountry === null;
}

/** Derive context flags from stored selection (single place for consumers). */
export function toSelectionState(
  selectedCountry: SelectedCountry,
): DashboardSelectionState {
  return {
    selectedCountry,
    isGlobal: isGlobalSelection(selectedCountry),
  };
}
