/**
 * ISO calendar date helpers for COVID read query params.
 * Format alone is not enough — reject impossible dates (e.g. 2020-02-30).
 */

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Milliseconds in one UTC calendar day. */
const MS_PER_DAY = 86_400_000;

/**
 * Upper bound on inclusive day span for series queries.
 * Prevents unbounded memory pressure on global series while covering
 * the full COVID historical window used in MVP (~2020–2023).
 */
export const MAX_SERIES_SPAN_DAYS = 4000;

/** True when `value` is a real UTC calendar date in YYYY-MM-DD form. */
export function isValidIsoDateOnly(value: string): boolean {
  if (!ISO_DATE_ONLY.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  // Round-trip rejects overflow days (Feb 30 → Mar 01, etc.).
  return parsed.toISOString().slice(0, 10) === value;
}

/**
 * Parse a validated YYYY-MM-DD into a UTC Date at midnight.
 * Callers must validate first (DTO layer) — throws on invalid input.
 */
export function parseIsoDateOnly(value: string): Date {
  if (!isValidIsoDateOnly(value)) {
    throw new Error(`Invalid ISO calendar date: ${value}`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

/** Inclusive day count between two validated ISO dates (`from` ≤ `to`). */
export function inclusiveDaySpan(from: string, to: string): number {
  const start = parseIsoDateOnly(from).getTime();
  const end = parseIsoDateOnly(to).getTime();
  return Math.floor((end - start) / MS_PER_DAY) + 1;
}
