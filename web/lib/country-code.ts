/**
 * Shared ISO 3166-1 alpha-2 country code validation for the web client.
 *
 * Shape-only guard (two uppercase ASCII letters) — not a full ISO registry lookup.
 * Server-side validation remains authoritative (400/404). Used by API URL builders and
 * dashboard selection state so both paths reject malformed input consistently.
 */

/** Reject oversized strings before trim — cheap DoS guard in client event handlers. */
export const COUNTRY_CODE_INPUT_MAX_LENGTH = 32;

/** ISO 3166-1 alpha-2 uppercase segment (e.g. BR, US). */
export const ISO2_UPPERCASE_PATTERN = /^[A-Z]{2}$/;

/**
 * Normalize untrusted country code input.
 * Returns null when type, length, or shape is invalid — never throws.
 */
export function normalizeCountryCodeInput(code: unknown): string | null {
  if (typeof code !== 'string') {
    return null;
  }
  if (code.length > COUNTRY_CODE_INPUT_MAX_LENGTH) {
    return null;
  }

  const trimmed = code.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!ISO2_UPPERCASE_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Assert country code shape before building a request URL.
 * Throws a plain Error (not ApiError) — client programming/UX guard, not HTTP failure.
 */
export function assertCountryCode(code: string): string {
  const normalized = normalizeCountryCodeInput(code);
  if (normalized === null) {
    throw new Error(
      `Invalid countryCode: expected uppercase ISO 3166-1 alpha-2 (got "${String(code)}")`,
    );
  }
  return normalized;
}
