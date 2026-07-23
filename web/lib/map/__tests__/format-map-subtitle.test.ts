import { describe, expect, it } from 'vitest';

import {
  formatMapDataCoverageSuffix,
  formatMapReferenceDateSuffix,
} from '../format-map-subtitle';

describe('formatMapReferenceDateSuffix', () => {
  it('returns suffix for valid ISO dates', () => {
    expect(formatMapReferenceDateSuffix('2023-03-09')).toBe(
      ' · Reference date: 2023-03-09',
    );
  });

  it('returns empty string for invalid or missing dates', () => {
    expect(formatMapReferenceDateSuffix(null)).toBe('');
    expect(formatMapReferenceDateSuffix('<script>')).toBe('');
    expect(formatMapReferenceDateSuffix('2023-3-9')).toBe('');
  });
});

describe('formatMapDataCoverageSuffix', () => {
  it('formats country count for map transparency', () => {
    expect(formatMapDataCoverageSuffix(87)).toBe(' · 87 countries with data');
    expect(formatMapDataCoverageSuffix(1)).toBe(' · 1 country with data');
  });

  it('returns empty string for invalid counts', () => {
    expect(formatMapDataCoverageSuffix(null)).toBe('');
    expect(formatMapDataCoverageSuffix(-1)).toBe('');
  });
});
