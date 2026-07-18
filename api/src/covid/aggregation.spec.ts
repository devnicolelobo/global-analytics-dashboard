import {
  pickMetricValue,
  rollupCountryMetrics,
  rollupGlobalMetrics,
  rollupSeriesByDate,
  sumMetricFields,
  sumNullable,
  toIsoDateOnly,
} from './aggregation';

describe('sumNullable', () => {
  it('returns null when all values are null', () => {
    expect(sumNullable([null, null])).toBeNull();
  });

  it('treats null as 0 when at least one value is present', () => {
    expect(sumNullable([null, 5, 3])).toBe(8);
  });

  it('returns null for empty input', () => {
    expect(sumNullable([])).toBeNull();
  });
});

describe('rollupCountryMetrics', () => {
  it('uses national row (region="") when present', () => {
    const result = rollupCountryMetrics([
      {
        region: '',
        casesTotal: 100,
        deathsTotal: 10,
        casesNew: 1,
        deathsNew: 0,
      },
      {
        region: 'Ontario',
        casesTotal: 40,
        deathsTotal: 4,
        casesNew: 2,
        deathsNew: 1,
      },
    ]);

    expect(result).toEqual({
      casesTotal: 100,
      deathsTotal: 10,
      casesNew: 1,
      deathsNew: 0,
    });
  });

  it('sums regional rows when no national row exists', () => {
    const result = rollupCountryMetrics([
      {
        region: 'Ontario',
        casesTotal: 40,
        deathsTotal: 4,
        casesNew: 2,
        deathsNew: null,
      },
      {
        region: 'Quebec',
        casesTotal: 60,
        deathsTotal: 6,
        casesNew: null,
        deathsNew: 1,
      },
    ]);

    expect(result).toEqual({
      casesTotal: 100,
      deathsTotal: 10,
      casesNew: 2,
      deathsNew: 1,
    });
  });

  it('returns all-null metrics when every field is null across regions', () => {
    const result = rollupCountryMetrics([
      {
        region: 'A',
        casesTotal: null,
        deathsTotal: null,
        casesNew: null,
        deathsNew: null,
      },
      {
        region: 'B',
        casesTotal: null,
        deathsTotal: null,
        casesNew: null,
        deathsNew: null,
      },
    ]);

    expect(result).toEqual({
      casesTotal: null,
      deathsTotal: null,
      casesNew: null,
      deathsNew: null,
    });
  });

  it('sums a single regional row unchanged', () => {
    expect(
      rollupCountryMetrics([
        {
          region: 'Ontario',
          casesTotal: 7,
          deathsTotal: null,
          casesNew: null,
          deathsNew: null,
        },
      ]),
    ).toEqual({
      casesTotal: 7,
      deathsTotal: null,
      casesNew: null,
      deathsNew: null,
    });
  });

  it('returns null for empty input', () => {
    expect(rollupCountryMetrics([])).toBeNull();
  });
});

describe('rollupGlobalMetrics', () => {
  it('rolls up each country then sums countries', () => {
    const result = rollupGlobalMetrics([
      {
        countryCode: 'BR',
        region: '',
        casesTotal: 100,
        deathsTotal: 10,
        casesNew: 1,
        deathsNew: 0,
      },
      {
        countryCode: 'CA',
        region: 'Ontario',
        casesTotal: 40,
        deathsTotal: 4,
        casesNew: 2,
        deathsNew: null,
      },
      {
        countryCode: 'CA',
        region: 'Quebec',
        casesTotal: 60,
        deathsTotal: 6,
        casesNew: 3,
        deathsNew: 1,
      },
    ]);

    expect(result).toEqual({
      casesTotal: 200,
      deathsTotal: 20,
      casesNew: 6,
      deathsNew: 1,
    });
  });

  it('does not double-count when national and regional rows coexist', () => {
    const result = rollupGlobalMetrics([
      {
        countryCode: 'CA',
        region: '',
        casesTotal: 100,
        deathsTotal: 10,
        casesNew: 1,
        deathsNew: 0,
      },
      {
        countryCode: 'CA',
        region: 'Ontario',
        casesTotal: 40,
        deathsTotal: 4,
        casesNew: 2,
        deathsNew: 1,
      },
    ]);

    expect(result).toEqual({
      casesTotal: 100,
      deathsTotal: 10,
      casesNew: 1,
      deathsNew: 0,
    });
  });
});

describe('rollupSeriesByDate', () => {
  it('groups by date ascending and maps country rollups', () => {
    const d1 = new Date('2020-03-01T00:00:00.000Z');
    const d2 = new Date('2020-03-02T00:00:00.000Z');

    const points = rollupSeriesByDate(
      [
        {
          countryCode: 'BR',
          region: '',
          referenceDate: d2,
          casesTotal: 2,
          deathsTotal: 0,
          casesNew: 1,
          deathsNew: 0,
        },
        {
          countryCode: 'BR',
          region: '',
          referenceDate: d1,
          casesTotal: 1,
          deathsTotal: 0,
          casesNew: 1,
          deathsNew: 0,
        },
      ],
      'country',
    );

    expect(points).toEqual([
      {
        date: '2020-03-01',
        metrics: {
          casesTotal: 1,
          deathsTotal: 0,
          casesNew: 1,
          deathsNew: 0,
        },
      },
      {
        date: '2020-03-02',
        metrics: {
          casesTotal: 2,
          deathsTotal: 0,
          casesNew: 1,
          deathsNew: 0,
        },
      },
    ]);
  });

  it('global mode sums countries per date after country rollup', () => {
    const d1 = new Date('2020-03-01T00:00:00.000Z');

    const points = rollupSeriesByDate(
      [
        {
          countryCode: 'BR',
          region: '',
          referenceDate: d1,
          casesTotal: 10,
          deathsTotal: 1,
          casesNew: 1,
          deathsNew: 0,
        },
        {
          countryCode: 'US',
          region: '',
          referenceDate: d1,
          casesTotal: 20,
          deathsTotal: 2,
          casesNew: 2,
          deathsNew: 0,
        },
      ],
      'global',
    );

    expect(points).toEqual([
      {
        date: '2020-03-01',
        metrics: {
          casesTotal: 30,
          deathsTotal: 3,
          casesNew: 3,
          deathsNew: 0,
        },
      },
    ]);
  });
});

describe('helpers', () => {
  it('toIsoDateOnly formats UTC calendar date', () => {
    expect(toIsoDateOnly(new Date('2023-03-09T00:00:00.000Z'))).toBe(
      '2023-03-09',
    );
  });

  it('pickMetricValue reads selected field', () => {
    expect(
      pickMetricValue(
        sumMetricFields([
          {
            casesTotal: 5,
            deathsTotal: null,
            casesNew: 1,
            deathsNew: null,
          },
        ]),
        'casesTotal',
      ),
    ).toBe(5);
  });
});
