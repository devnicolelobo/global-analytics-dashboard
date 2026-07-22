import { describe, expect, it } from 'vitest';

import {
  assertCountryCode,
  COUNTRY_CODE_INPUT_MAX_LENGTH,
  normalizeCountryCodeInput,
} from '../country-code';

describe('normalizeCountryCodeInput', () => {
  it('accepts uppercase ISO2 codes with optional surrounding whitespace', () => {
    expect(normalizeCountryCodeInput('BR')).toBe('BR');
    expect(normalizeCountryCodeInput(' US ')).toBe('US');
  });

  it('rejects lowercase, mixed case, wrong length, and non-letters', () => {
    expect(normalizeCountryCodeInput('br')).toBeNull();
    expect(normalizeCountryCodeInput('Br')).toBeNull();
    expect(normalizeCountryCodeInput('BRA')).toBeNull();
    expect(normalizeCountryCodeInput('B')).toBeNull();
    expect(normalizeCountryCodeInput('B1')).toBeNull();
    expect(normalizeCountryCodeInput('12')).toBeNull();
  });

  it('rejects empty, whitespace-only, and non-string input', () => {
    expect(normalizeCountryCodeInput('')).toBeNull();
    expect(normalizeCountryCodeInput('   ')).toBeNull();
    expect(normalizeCountryCodeInput(null)).toBeNull();
    expect(normalizeCountryCodeInput(undefined)).toBeNull();
    expect(normalizeCountryCodeInput(42)).toBeNull();
    expect(normalizeCountryCodeInput({ code: 'BR' })).toBeNull();
  });

  it('rejects injection-like and unicode payloads', () => {
    expect(normalizeCountryCodeInput('BR<script>')).toBeNull();
    expect(normalizeCountryCodeInput('../BR')).toBeNull();
    expect(normalizeCountryCodeInput('B\u0000R')).toBeNull();
    expect(normalizeCountryCodeInput('B\u00c9')).toBeNull();
  });

  it('rejects inputs longer than the client max length guard', () => {
    const tooLong = 'A'.repeat(COUNTRY_CODE_INPUT_MAX_LENGTH + 1);
    expect(normalizeCountryCodeInput(tooLong)).toBeNull();
  });
});

describe('assertCountryCode', () => {
  it('returns normalized codes for valid input', () => {
    expect(assertCountryCode('BR')).toBe('BR');
  });

  it('throws for invalid input with a descriptive message', () => {
    expect(() => assertCountryCode('br')).toThrow(/Invalid countryCode/);
    expect(() => assertCountryCode('')).toThrow(/Invalid countryCode/);
  });
});
