import { UpstreamInvalidParamsError } from './api-ninjas.errors';
import { ApiNinjasMetricType } from './api-ninjas.types';

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
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
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

export function assertOptionalRegion(region: string | undefined): string | undefined {
  if (region === undefined) {
    return undefined;
  }

  const trimmed = region.trim();
  return trimmed === '' ? undefined : trimmed;
}
