import { describe, expect, it } from 'vitest';

import {
  applyClearSelection,
  applySelectCountry,
  isGlobalSelection,
  parseCountryCodeForSelection,
  toSelectionState,
} from '../selection';

describe('parseCountryCodeForSelection', () => {
  it('accepts uppercase ISO2 codes', () => {
    expect(parseCountryCodeForSelection('BR')).toBe('BR');
    expect(parseCountryCodeForSelection(' US ')).toBe('US');
  });

  it('rejects lowercase, wrong length, and empty input', () => {
    expect(parseCountryCodeForSelection('br')).toBeNull();
    expect(parseCountryCodeForSelection('Br')).toBeNull();
    expect(parseCountryCodeForSelection('BRA')).toBeNull();
    expect(parseCountryCodeForSelection('')).toBeNull();
    expect(parseCountryCodeForSelection('zz')).toBeNull();
  });

  it('rejects non-string and oversized payloads', () => {
    expect(parseCountryCodeForSelection(null)).toBeNull();
    expect(parseCountryCodeForSelection(undefined)).toBeNull();
    expect(parseCountryCodeForSelection(['BR'])).toBeNull();
    expect(parseCountryCodeForSelection('A'.repeat(33))).toBeNull();
  });
});

describe('applySelectCountry', () => {
  it('selects a valid country code', () => {
    expect(applySelectCountry(null, 'BR')).toBe('BR');
    expect(applySelectCountry('US', 'BR')).toBe('BR');
  });

  it('is idempotent when re-selecting the same valid code', () => {
    expect(applySelectCountry('BR', 'BR')).toBe('BR');
  });

  it('leaves state unchanged for invalid codes', () => {
    expect(applySelectCountry(null, 'br')).toBeNull();
    expect(applySelectCountry('BR', 'BRA')).toBe('BR');
    expect(applySelectCountry(null, '')).toBeNull();
    expect(applySelectCountry('US', null)).toBe('US');
  });
});

describe('applyClearSelection', () => {
  it('returns global (null) from any prior state', () => {
    expect(applyClearSelection()).toBeNull();
  });
});

describe('isGlobalSelection', () => {
  it('returns true only for null', () => {
    expect(isGlobalSelection(null)).toBe(true);
    expect(isGlobalSelection('BR')).toBe(false);
  });
});

describe('toSelectionState', () => {
  it('derives isGlobal from selectedCountry', () => {
    expect(toSelectionState(null)).toEqual({
      selectedCountry: null,
      isGlobal: true,
    });
    expect(toSelectionState('BR')).toEqual({
      selectedCountry: 'BR',
      isGlobal: false,
    });
  });
});
