import { describe, expect, it } from 'vitest';

import {
  EMPTY_METRIC_DISPLAY,
  formatMetricValue,
  formatReferenceDateSubtitle,
} from '../format-metric';

describe('formatMetricValue', () => {
  it('formats integers with en-US thousands separators', () => {
    expect(formatMetricValue(1234567)).toBe('1,234,567');
    expect(formatMetricValue(0)).toBe('0');
  });

  it('returns em dash for null, undefined, and NaN', () => {
    expect(formatMetricValue(null)).toBe(EMPTY_METRIC_DISPLAY);
    expect(formatMetricValue(undefined)).toBe(EMPTY_METRIC_DISPLAY);
    expect(formatMetricValue(Number.NaN)).toBe(EMPTY_METRIC_DISPLAY);
  });
});

describe('formatReferenceDateSubtitle', () => {
  it('returns a reference date subtitle for valid dates', () => {
    expect(formatReferenceDateSubtitle('2024-06-15')).toBe(
      'Reference date: 2024-06-15',
    );
    expect(formatReferenceDateSubtitle(' 2024-06-15 ')).toBe(
      'Reference date: 2024-06-15',
    );
  });

  it('returns undefined when reference date is missing or blank', () => {
    expect(formatReferenceDateSubtitle(null)).toBeUndefined();
    expect(formatReferenceDateSubtitle(undefined)).toBeUndefined();
    expect(formatReferenceDateSubtitle('')).toBeUndefined();
    expect(formatReferenceDateSubtitle('   ')).toBeUndefined();
  });
});
