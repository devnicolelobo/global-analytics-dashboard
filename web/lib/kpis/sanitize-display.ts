/**
 * Sanitize untrusted API strings before React text rendering.
 * Strips HTML-like tags and control characters — never use as HTML.
 */
export function sanitizeDisplayText(
  raw: unknown,
  maxLength = 120,
): string {
  if (typeof raw !== 'string') {
    return '';
  }

  const withoutTags = raw.replace(/<[^>]*>/g, '');
  const cleaned = withoutTags.replace(/[\u0000-\u001F\u007F]/g, '').trim();

  if (cleaned.length === 0) {
    return '';
  }

  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/** Calendar date shape returned by API (YYYY-MM-DD). Display-only guard. */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateString(value: string): boolean {
  return ISO_DATE_PATTERN.test(value);
}
