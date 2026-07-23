import { describe, expect, it } from 'vitest';

import { formatMapReferenceDateSuffix } from '../format-map-subtitle';

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
