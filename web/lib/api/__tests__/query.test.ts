import { describe, expect, it } from 'vitest';
import {
  assertCountryCode,
  buildCountriesQuery,
  buildSeriesQuery,
  isMetric,
  withQuery,
} from '../query';

describe('assertCountryCode', () => {
  it('accepts uppercase ISO2 codes', () => {
    expect(assertCountryCode('BR')).toBe('BR');
    expect(assertCountryCode(' US ')).toBe('US');
  });

  it('rejects lowercase or malformed codes', () => {
    expect(() => assertCountryCode('br')).toThrow(/Invalid countryCode/);
    expect(() => assertCountryCode('BRA')).toThrow(/Invalid countryCode/);
    expect(() => assertCountryCode('1')).toThrow(/Invalid countryCode/);
  });
});

describe('isMetric', () => {
  it('accepts known metrics and rejects unknown ones', () => {
    expect(isMetric('casesTotal')).toBe(true);
    expect(isMetric('notAMetric')).toBe(false);
  });
});

describe('buildSeriesQuery', () => {
  it('returns an empty string when no params are provided', () => {
    expect(buildSeriesQuery()).toBe('');
  });

  it('encodes metric, from, and to with URLSearchParams', () => {
    expect(
      buildSeriesQuery({
        metric: 'casesTotal',
        from: '2020-01-01',
        to: '2020-12-31',
      }),
    ).toBe('?metric=casesTotal&from=2020-01-01&to=2020-12-31');
  });
});

describe('buildCountriesQuery', () => {
  it('builds an optional metric query', () => {
    expect(buildCountriesQuery()).toBe('');
    expect(buildCountriesQuery({ metric: 'deathsTotal' })).toBe(
      '?metric=deathsTotal',
    );
  });
});

describe('withQuery', () => {
  it('joins path and query without duplicating ?', () => {
    expect(withQuery('/covid/series', '')).toBe('/covid/series');
    expect(withQuery('/covid/series', '?metric=casesTotal')).toBe(
      '/covid/series?metric=casesTotal',
    );
    expect(withQuery('/covid/series', 'metric=casesTotal')).toBe(
      '/covid/series?metric=casesTotal',
    );
  });
});
