import { MetricNormalizer, coerceInteger, normalizeRegion } from './metric-normalizer';

describe('normalizeRegion', () => {
  it('converts null/undefined/blank to empty string', () => {
    expect(normalizeRegion(null)).toBe('');
    expect(normalizeRegion(undefined)).toBe('');
    expect(normalizeRegion('  ')).toBe('');
  });

  it('trims non-empty regions', () => {
    expect(normalizeRegion(' Alberta ')).toBe('Alberta');
  });
});

describe('coerceInteger', () => {
  it('returns null for missing values', () => {
    expect(coerceInteger(null)).toBeNull();
    expect(coerceInteger(undefined)).toBeNull();
  });

  it('truncates finite numbers', () => {
    expect(coerceInteger(10.9)).toBe(10);
    expect(coerceInteger(0)).toBe(0);
  });

  it('rejects NaN and non-numbers', () => {
    expect(coerceInteger(Number.NaN)).toBeUndefined();
    expect(coerceInteger('10')).toBeUndefined();
  });
});

describe('MetricNormalizer', () => {
  let normalizer: MetricNormalizer;

  beforeEach(() => {
    normalizer = new MetricNormalizer();
  });

  describe('normalizeSeries (Mode A)', () => {
    it('expands cases time series into one row per date', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Brazil',
          region: '',
          cases: {
            '2023-03-08': { total: 100, new: 2 },
            '2023-03-09': { total: 110, new: 10 },
          },
        },
      ]);

      expect(result.skippedUnmappedCountries).toEqual([]);
      expect(result.skippedInvalidDates).toBe(0);
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            countryCode: 'BR',
            region: '',
            referenceDate: '2023-03-09',
            casesTotal: 110,
            casesNew: 10,
            source: 'api-ninjas',
          }),
        ]),
      );
    });

    it('handles deaths key separately from cases (G-06)', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Brazil',
          region: '',
          deaths: {
            '2023-03-09': { total: 5, new: 1 },
          },
        },
      ]);

      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0]).toMatchObject({
        countryCode: 'BR',
        referenceDate: '2023-03-09',
        deathsTotal: 5,
        deathsNew: 1,
      });
      expect(result.metrics[0]).not.toHaveProperty('casesTotal');
    });

    it('merges cases and deaths on the same natural key', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Brazil',
          region: '',
          cases: { '2023-03-09': { total: 100, new: 3 } },
          deaths: { '2023-03-09': { total: 10, new: 1 } },
        },
      ]);

      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0]).toMatchObject({
        countryCode: 'BR',
        referenceDate: '2023-03-09',
        casesTotal: 100,
        casesNew: 3,
        deathsTotal: 10,
        deathsNew: 1,
      });
    });

    it('normalizes blank region to empty string', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Canada',
          region: '  ',
          cases: { '2023-03-09': { total: 1, new: 0 } },
        },
      ]);

      expect(result.metrics[0].region).toBe('');
    });

    it('keeps subnational region names', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Canada',
          region: 'Alberta',
          cases: { '2023-03-09': { total: 1, new: 0 } },
        },
      ]);

      expect(result.metrics[0].region).toBe('Alberta');
    });

    it('skips invalid date keys and counts them', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Brazil',
          region: '',
          cases: {
            '2023-02-30': { total: 1, new: 0 },
            '2023-03-09': { total: 2, new: 0 },
          },
        },
      ]);

      expect(result.skippedInvalidDates).toBe(1);
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].referenceDate).toBe('2023-03-09');
    });

    it('skips unmapped countries without failing the batch (G-04)', () => {
      const result = normalizer.normalizeSeries([
        {
          country: 'Neverland',
          region: '',
          cases: { '2023-03-09': { total: 1, new: 0 } },
        },
        {
          country: 'Brazil',
          region: '',
          cases: { '2023-03-09': { total: 2, new: 0 } },
        },
      ]);

      expect(result.skippedUnmappedCountries).toEqual(['Neverland']);
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].countryCode).toBe('BR');
    });
  });

  describe('normalizeSnapshot (Mode B)', () => {
    it('maps snapshot cases for the provided date', () => {
      const result = normalizer.normalizeSnapshot(
        [
          {
            country: 'Brazil',
            region: '',
            cases: { total: 37076053, new: 0 },
          },
        ],
        '2023-03-09',
      );

      expect(result.metrics).toEqual([
        expect.objectContaining({
          countryCode: 'BR',
          referenceDate: '2023-03-09',
          casesTotal: 37076053,
          casesNew: 0,
          source: 'api-ninjas',
        }),
      ]);
    });

    it('maps snapshot deaths key', () => {
      const result = normalizer.normalizeSnapshot(
        [
          {
            country: 'Brazil',
            region: '',
            deaths: { total: 699276, new: 0 },
          },
        ],
        '2023-03-09',
      );

      expect(result.metrics[0]).toMatchObject({
        deathsTotal: 699276,
        deathsNew: 0,
      });
    });

    it('rejects invalid reference date for the whole batch', () => {
      const result = normalizer.normalizeSnapshot(
        [
          {
            country: 'Brazil',
            region: '',
            cases: { total: 1, new: 0 },
          },
        ],
        '03-09-2023',
      );

      expect(result.metrics).toEqual([]);
      expect(result.skippedInvalidDates).toBe(1);
    });

    it('resolves aliases like USA to US', () => {
      const result = normalizer.normalizeSnapshot(
        [
          {
            country: 'USA',
            region: '',
            cases: { total: 1, new: 0 },
          },
        ],
        '2023-03-09',
      );

      expect(result.metrics[0].countryCode).toBe('US');
    });
  });
});
