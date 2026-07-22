import { describe, expect, it } from 'vitest';

import {
  applyClearSelection,
  applySelectCountry,
  parseCountryCodeForSelection,
} from '../selection';

describe('parseCountryCodeForSelection', () => {
  it('accepts uppercase ISO2 codes', () => {
    expect(parseCountryCodeForSelection('BR')).toBe('BR');
    expect(parseCountryCodeForSelection(' US ')).toBe('US');
  });

  it('rejects lowercase, wrong length, and empty input', () => {
    expect(parseCountryCodeForSelection('br')).toBeNull();
    expect(parseCountryCodeForSelection('BRA')).toBeNull();
    expect(parseCountryCodeForSelection('')).toBeNull();
    expect(parseCountryCodeForSelection('zz')).toBeNull();
  });
});

describe('applySelectCountry', () => {
  it('selects a valid country code', () => {
    expect(applySelectCountry(null, 'BR')).toBe('BR');
    expect(applySelectCountry('US', 'BR')).toBe('BR');
  });

  it('leaves state unchanged for invalid codes', () => {
    expect(applySelectCountry(null, 'br')).toBeNull();
    expect(applySelectCountry('BR', 'BRA')).toBe('BR');
    expect(applySelectCountry(null, '')).toBeNull();
  });
});

describe('applyClearSelection', () => {
  it('returns global (null)', () => {
    expect(applyClearSelection()).toBeNull();
  });
});
