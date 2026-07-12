import { UpstreamInvalidParamsError } from './api-ninjas.errors';
import { ApiNinjasMetricType } from './api-ninjas.types';

// Reject invalid inputs before spending an upstream HTTP call.
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function assertNonEmptyCountry(country: string): string {
  const trimmed = country?.trim();

  if (!trimmed) {
    throw new UpstreamInvalidParamsError('country must be a non-empty string');
  }

  return trimmed;
}

export function assertIsoDate(date: string): string {
  const trimmed = date?.trim();

  if (!trimmed || !ISO_DATE_PATTERN.test(trimmed)) {
    throw new UpstreamInvalidParamsError(
      'date must be in ISO format YYYY-MM-DD',
    );
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  // Regex alone accepts impossible dates (e.g. 2023-02-30).
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== trimmed
  ) {
    throw new UpstreamInvalidParamsError('date is not a valid calendar day');
  }

  return trimmed;
}

export function assertMetricType(
  type: string | undefined,
): ApiNinjasMetricType | undefined {
  if (type === undefined) {
    return undefined;
  }

  if (type !== 'cases' && type !== 'deaths') {
    throw new UpstreamInvalidParamsError('type must be "cases" or "deaths"');
  }

  return type;
}

export function assertOptionalRegion(
  region: string | undefined,
): string | undefined {
  if (region === undefined) {
    return undefined;
  }

  const trimmed = region.trim();
  // Omit empty region from query — API Ninjas treats blank as national row.
  return trimmed === '' ? undefined : trimmed;
}
