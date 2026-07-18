import {
  inclusiveDaySpan,
  isValidIsoDateOnly,
  MAX_SERIES_SPAN_DAYS,
  parseIsoDateOnly,
} from './iso-date';
import { assertUppercaseIso2, isUppercaseIso2 } from './country-code';
import { InvalidCountryCodeException } from '../common/errors';

describe('isValidIsoDateOnly', () => {
  it('accepts real calendar dates', () => {
    expect(isValidIsoDateOnly('2020-02-29')).toBe(true); // leap year
    expect(isValidIsoDateOnly('2023-03-09')).toBe(true);
  });

  it('rejects impossible calendar dates', () => {
    expect(isValidIsoDateOnly('2020-02-30')).toBe(false);
    expect(isValidIsoDateOnly('2021-02-29')).toBe(false); // non-leap
    expect(isValidIsoDateOnly('2020-13-01')).toBe(false);
  });

  it('rejects non YYYY-MM-DD shapes', () => {
    expect(isValidIsoDateOnly('03-01-2020')).toBe(false);
    expect(isValidIsoDateOnly('2020-3-1')).toBe(false);
    expect(isValidIsoDateOnly('')).toBe(false);
  });
});

describe('parseIsoDateOnly / inclusiveDaySpan', () => {
  it('parses UTC midnight', () => {
    expect(parseIsoDateOnly('2020-03-01').toISOString()).toBe(
      '2020-03-01T00:00:00.000Z',
    );
  });

  it('throws on invalid calendar date', () => {
    expect(() => parseIsoDateOnly('2020-02-30')).toThrow(/Invalid ISO/);
  });

  it('computes inclusive span', () => {
    expect(inclusiveDaySpan('2020-03-01', '2020-03-01')).toBe(1);
    expect(inclusiveDaySpan('2020-03-01', '2020-03-02')).toBe(2);
  });

  it('MAX_SERIES_SPAN_DAYS covers multi-year COVID history', () => {
    expect(MAX_SERIES_SPAN_DAYS).toBeGreaterThanOrEqual(1500);
  });
});

describe('assertUppercaseIso2', () => {
  it('accepts uppercase ISO2', () => {
    expect(() => assertUppercaseIso2('BR')).not.toThrow();
    expect(isUppercaseIso2('BR')).toBe(true);
  });

  it('rejects lowercase, mixed, digits, and symbols with 400', () => {
    for (const code of ['zz', 'Br', '12', 'B!', '', 'BRA']) {
      expect(() => assertUppercaseIso2(code)).toThrow(
        InvalidCountryCodeException,
      );
      expect(isUppercaseIso2(code)).toBe(false);
    }
  });

  it('truncates oversized reflected input in the exception message', () => {
    const huge = 'x'.repeat(64);
    expect(() => assertUppercaseIso2(huge)).toThrow(
      InvalidCountryCodeException,
    );
    try {
      assertUppercaseIso2(huge);
    } catch (error) {
      const message = (error as InvalidCountryCodeException).message;
      expect(message.length).toBeLessThan(huge.length + 40);
      expect(message).not.toContain(huge);
    }
  });
});
