import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CovidMetricRepository } from './covid-metric.repository';
import { NormalizedMetricInput } from './normalized-metric.types';

type MetricUpsertCall = {
  where: {
    countryCode_region_referenceDate: {
      countryCode: string;
      region: string;
      referenceDate: Date;
    };
  };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

function firstUpsertCall(mock: jest.Mock): MetricUpsertCall {
  const args = mock.mock.calls[0] as unknown[] | undefined;
  if (!args?.[0] || typeof args[0] !== 'object') {
    throw new Error('Expected metric upsert to be called with an object');
  }
  return args[0] as MetricUpsertCall;
}

describe('CovidMetricRepository', () => {
  let repository: CovidMetricRepository;
  let countryUpsert: jest.Mock;
  let metricUpsert: jest.Mock;
  let transaction: jest.Mock;

  const baseMetric: NormalizedMetricInput = {
    countryCode: 'BR',
    countryName: 'Brazil',
    upstreamName: 'Brazil',
    region: '',
    referenceDate: '2023-03-09',
    source: 'api-ninjas',
  };

  const referenceDate = new Date('2023-03-09T00:00:00.000Z');

  beforeEach(async () => {
    countryUpsert = jest.fn().mockResolvedValue({});
    metricUpsert = jest.fn().mockResolvedValue({});

    // $transaction runs the callback with a fake tx client (unit test, no real DB).
    transaction = jest.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        country: { upsert: countryUpsert },
        covidDailyMetric: { upsert: metricUpsert },
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CovidMetricRepository,
        {
          provide: PrismaService,
          useValue: {
            $transaction: transaction,
          },
        },
      ],
    }).compile();

    repository = module.get(CovidMetricRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns zeros for an empty batch without opening a transaction', async () => {
    const result = await repository.upsertNormalizedMetrics([]);

    expect(result).toEqual({ recordsUpserted: 0, countriesUpserted: 0 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('upserts country before metric and counts records', async () => {
    const result = await repository.upsertNormalizedMetrics([
      {
        ...baseMetric,
        casesTotal: 100,
        casesNew: 2,
      },
    ]);

    expect(result).toEqual({ recordsUpserted: 1, countriesUpserted: 1 });
    expect(countryUpsert).toHaveBeenCalledWith({
      where: { iso2: 'BR' },
      create: {
        iso2: 'BR',
        name: 'Brazil',
        upstreamName: 'Brazil',
      },
      update: {
        name: 'Brazil',
        upstreamName: 'Brazil',
      },
    });
    expect(metricUpsert).toHaveBeenCalledTimes(1);
  });

  it('dedupes countries when multiple metrics share the same iso2', async () => {
    await repository.upsertNormalizedMetrics([
      { ...baseMetric, casesTotal: 1, casesNew: 0 },
      {
        ...baseMetric,
        referenceDate: '2023-03-10',
        casesTotal: 2,
        casesNew: 1,
      },
    ]);

    expect(countryUpsert).toHaveBeenCalledTimes(1);
    expect(metricUpsert).toHaveBeenCalledTimes(2);
  });

  it('merges deaths into update without sending cases fields (DATA_MODEL §5.2)', async () => {
    await repository.upsertNormalizedMetrics([
      {
        ...baseMetric,
        casesTotal: 100,
        casesNew: 3,
      },
    ]);

    const createCall = firstUpsertCall(metricUpsert);
    expect(createCall.create).toMatchObject({
      casesTotal: 100,
      casesNew: 3,
      deathsTotal: null,
      deathsNew: null,
    });

    metricUpsert.mockClear();

    await repository.upsertNormalizedMetrics([
      {
        ...baseMetric,
        deathsTotal: 10,
        deathsNew: 1,
      },
    ]);

    const updateCall = firstUpsertCall(metricUpsert);
    expect(updateCall.where).toEqual({
      countryCode_region_referenceDate: {
        countryCode: 'BR',
        region: '',
        referenceDate,
      },
    });
    expect(updateCall.update).toMatchObject({
      deathsTotal: 10,
      deathsNew: 1,
      source: 'api-ninjas',
    });
    expect(updateCall.update).not.toHaveProperty('casesTotal');
    expect(updateCall.update).not.toHaveProperty('casesNew');
  });

  it('uses empty string region in the composite unique key', async () => {
    await repository.upsertNormalizedMetrics([
      {
        ...baseMetric,
        region: '',
        casesTotal: 1,
        casesNew: 0,
      },
    ]);

    const call = firstUpsertCall(metricUpsert);
    expect(call.where).toEqual({
      countryCode_region_referenceDate: {
        countryCode: 'BR',
        region: '',
        referenceDate,
      },
    });
  });
});
