import { describe, expect, it } from 'vitest';

import {
  formatDataSourceLabel,
  formatLastSuccessfulSyncAt,
  formatLastSyncStatus,
  formatLatestReferenceDate,
} from '../format-sync-status';

describe('formatLastSuccessfulSyncAt', () => {
  it('returns Never synced for null', () => {
    expect(formatLastSuccessfulSyncAt(null)).toBe('Never synced');
  });

  it('formats valid ISO instants in English locale', () => {
    const formatted = formatLastSuccessfulSyncAt('2026-07-24T18:30:00.000Z');
    expect(formatted).toMatch(/Jul/);
    expect(formatted).not.toBe('Never synced');
  });

  it('returns Unavailable for invalid timestamps', () => {
    expect(formatLastSuccessfulSyncAt('not-a-date')).toBe('Unavailable');
  });
});

describe('formatDataSourceLabel', () => {
  it('sanitizes untrusted source strings', () => {
    expect(formatDataSourceLabel('api-ninjas')).toBe('api-ninjas');
    expect(formatDataSourceLabel('<script>x</script>')).toBe('x');
  });

  it('returns Unknown source for empty input', () => {
    expect(formatDataSourceLabel('')).toBe('Unknown source');
  });
});

describe('formatLatestReferenceDate', () => {
  it('returns null for missing reference date', () => {
    expect(formatLatestReferenceDate(null)).toBeNull();
  });

  it('formats ISO calendar dates', () => {
    expect(formatLatestReferenceDate('2023-03-09')).toMatch(/Mar/);
  });
});

describe('formatLastSyncStatus', () => {
  it('returns null when status is missing', () => {
    expect(formatLastSyncStatus(null)).toBeNull();
  });

  it('humanizes known sync status values', () => {
    expect(formatLastSyncStatus('success')).toBe('Success');
    expect(formatLastSyncStatus('failed')).toBe('Failed');
    expect(formatLastSyncStatus('running')).toBe('Running');
  });

  it('returns sanitized unknown status text as-is', () => {
    expect(formatLastSyncStatus('custom-status')).toBe('custom-status');
  });
});
