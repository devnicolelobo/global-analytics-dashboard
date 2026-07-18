import { InvalidCountryCodeException } from '../common/errors';

/** Uppercase ISO 3166-1 alpha-2 only (API_SPEC §4.3 / §6.4). */
const ISO2_UPPERCASE = /^[A-Z]{2}$/;

/**
 * Max chars echoed in 400 messages — avoids oversized reflected input
 * in logs/clients if a caller tampers with the path segment.
 */
const MAX_ECHO_LENGTH = 16;

/**
 * Assert path `countryCode` is exactly two uppercase A–Z letters.
 * Lowercase / mixed / digits / symbols → 400 (not 404).
 */
export function assertUppercaseIso2(countryCode: string): void {
  if (typeof countryCode === 'string' && ISO2_UPPERCASE.test(countryCode)) {
    return;
  }

  const safeEcho =
    typeof countryCode === 'string'
      ? countryCode.slice(0, MAX_ECHO_LENGTH)
      : '';
  throw new InvalidCountryCodeException(safeEcho);
}

/** Type guard after successful assert (for typed call sites). */
export function isUppercaseIso2(countryCode: string): boolean {
  return typeof countryCode === 'string' && ISO2_UPPERCASE.test(countryCode);
}
