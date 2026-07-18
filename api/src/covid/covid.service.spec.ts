import { CountryNotFoundException } from '../common/errors';
import { CovidQueryService } from './covid-query.service';
import { CovidService } from './covid.service';
import { MetricType } from './dto';

describe('CovidService (critical / edge)', () => {
  let service: CovidService;
  let query: jest.Mocked<
    Pick<
      CovidQueryService,
      | 'findLatestReferenceDate'
      | 'findLastSuccessfulSyncAt'
      | 'findAllCountries'
      | 'findCountryByCode'
      | 'findMetricsForDate'
      | 'findMetricsForCountryOnDate'
      | 'findLatestReferenceDateForCountry'
      | 'hasRegionalBreakdown'
      | 'findSeriesRows'
    >
  >;

  beforeEach(() => {
    query = {
      findLatestReferenceDate: jest.fn(),
      findLastSuccessfulSyncAt: jest.fn().mockResolvedValue(null),
      findAllCountries: jest.fn(),
      findCountryByCode: jest.fn(),
      findMetricsForDate: jest.fn(),
      findMetricsForCountryOnDate: jest.fn(),
      findLatestReferenceDateForCountry: jest.fn(),
      hasRegionalBreakdown: jest.fn(),
      findSeriesRows: jest.fn(),
    };
    service = new CovidService(query as unknown as CovidQueryService);
  });

  it('getSummary returns null metrics when DB has no reference dates', async () => {
    query.findLatestReferenceDate.mockResolvedValue(null);

    const result = await service.getSummary();

    expect(result).toEqual({
      scope: 'global',
      referenceDate: null,
      metrics: null,
      meta: {
        lastSuccessfulSyncAt: null,
        dataSource: 'api-ninjas',
      },
    });
    expect(query.findMetricsForDate).not.toHaveBeenCalled();
  });

  it('getSummary rolls up multi-region countries without double-counting national', async () => {
    const date = new Date('2023-03-09T00:00:00.000Z');
    query.findLatestReferenceDate.mockResolvedValue(date);
    query.findMetricsForDate.mockResolvedValue([
      {
        countryCode: 'CA',
        region: '',
        referenceDate: date,
        casesTotal: 100,
        deathsTotal: 10,
        casesNew: 1,
        deathsNew: 0,
      },
      {
        countryCode: 'CA',
        region: 'Ontario',
        referenceDate: date,
        casesTotal: 40,
        deathsTotal: 4,
        casesNew: 2,
        deathsNew: 1,
      },
      {
        countryCode: 'BR',
        region: '',
        referenceDate: date,
        casesTotal: 50,
        deathsTotal: 5,
        casesNew: 0,
        deathsNew: 0,
      },
    ]);

    const result = await service.getSummary();

    expect(result.metrics).toEqual({
      casesTotal: 150,
      deathsTotal: 15,
      casesNew: 1,
      deathsNew: 0,
    });
  });

  it('getCountryDetail throws 404 for unknown ISO2 that is format-valid', async () => {
    query.findCountryByCode.mockResolvedValue(null);

    await expect(service.getCountryDetail('ZZ')).rejects.toBeInstanceOf(
      CountryNotFoundException,
    );
  });

  it('getCountryDetail returns null metrics when country exists but has no rows', async () => {
    query.findCountryByCode.mockResolvedValue({ iso2: 'BR', name: 'Brazil' });
    query.findLatestReferenceDateForCountry.mockResolvedValue(null);
    query.hasRegionalBreakdown.mockResolvedValue(false);

    const result = await service.getCountryDetail('BR');

    expect(result.metrics).toBeNull();
    expect(result.referenceDate).toBeNull();
    expect(result.country).toEqual({ code: 'BR', name: 'Brazil' });
  });

  it('getCountrySeries returns empty points for known country with no history', async () => {
    query.findCountryByCode.mockResolvedValue({ iso2: 'BR', name: 'Brazil' });
    query.findSeriesRows.mockResolvedValue([]);

    const result = await service.getCountrySeries(
      'BR',
      MetricType.casesTotal,
      '2020-01-01',
      '2020-12-31',
    );

    expect(result.points).toEqual([]);
    expect(result.meta.pointCount).toBe(0);
    expect(result.meta.from).toBe('2020-01-01');
    expect(result.meta.to).toBe('2020-12-31');
  });

  it('getCountries sorts null metrics last and never includes region names', async () => {
    const date = new Date('2023-03-09T00:00:00.000Z');
    query.findAllCountries.mockResolvedValue([
      { iso2: 'AA', name: 'Emptyland' },
      { iso2: 'BR', name: 'Brazil' },
    ]);
    query.findLatestReferenceDate.mockResolvedValue(date);
    query.findMetricsForDate.mockResolvedValue([
      {
        countryCode: 'BR',
        region: 'Sao Paulo',
        referenceDate: date,
        casesTotal: 10,
        deathsTotal: 1,
        casesNew: 1,
        deathsNew: 0,
      },
      {
        countryCode: 'BR',
        region: 'Rio',
        referenceDate: date,
        casesTotal: 5,
        deathsTotal: 0,
        casesNew: 0,
        deathsNew: 0,
      },
    ]);

    const result = await service.getCountries(MetricType.casesTotal);

    expect(result.countries.map((c) => c.code)).toEqual(['BR', 'AA']);
    expect(result.countries[0].metrics?.casesTotal).toBe(15);
    expect(JSON.stringify(result)).not.toMatch(/Sao Paulo|Rio/);
  });

  it('getGlobalSeries aggregates per date after country roll-up', async () => {
    const d1 = new Date('2020-03-01T00:00:00.000Z');
    query.findSeriesRows.mockResolvedValue([
      {
        countryCode: 'BR',
        region: '',
        referenceDate: d1,
        casesTotal: 1,
        deathsTotal: 0,
        casesNew: 1,
        deathsNew: 0,
      },
      {
        countryCode: 'US',
        region: '',
        referenceDate: d1,
        casesTotal: 2,
        deathsTotal: 0,
        casesNew: 1,
        deathsNew: 0,
      },
    ]);

    const result = await service.getGlobalSeries(MetricType.casesTotal);

    expect(result.points).toEqual([{ date: '2020-03-01', value: 3 }]);
  });
});
