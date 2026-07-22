/**
 * Curated ISO2 list for manual QA of dashboard selection (DEV-90).
 * Map click handlers (DEV-92) must still call parseCountryCodeForSelection /
 * selectCountry — this list is not an ISO registry.
 */
export const QA_COUNTRY_OPTIONS = [
  { code: 'BR', label: 'Brazil' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'JP', label: 'Japan' },
] as const;

export type QaCountryCode = (typeof QA_COUNTRY_OPTIONS)[number]['code'];

const QA_COUNTRY_CODES: ReadonlySet<string> = new Set(
  QA_COUNTRY_OPTIONS.map((option) => option.code),
);

/** Defense-in-depth: only allow known QA option values from the select control. */
export function isQaCountryCode(value: string): value is QaCountryCode {
  return QA_COUNTRY_CODES.has(value);
}
