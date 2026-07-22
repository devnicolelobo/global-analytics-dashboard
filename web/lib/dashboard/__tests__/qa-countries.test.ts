import { describe, expect, it } from 'vitest';

import { isQaCountryCode, QA_COUNTRY_OPTIONS } from '../qa-countries';

describe('isQaCountryCode', () => {
  it('accepts only curated QA option codes', () => {
    for (const { code } of QA_COUNTRY_OPTIONS) {
      expect(isQaCountryCode(code)).toBe(true);
    }
  });

  it('rejects unknown or malformed values', () => {
    expect(isQaCountryCode('XX')).toBe(false);
    expect(isQaCountryCode('br')).toBe(false);
    expect(isQaCountryCode('')).toBe(false);
  });
});
