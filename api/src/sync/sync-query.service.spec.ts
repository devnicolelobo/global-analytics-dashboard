import { SyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncQueryService } from './sync-query.service';

describe('SyncQueryService', () => {
  let findFirst: jest.Mock;
  let aggregate: jest.Mock;
  let service: SyncQueryService;

  beforeEach(() => {
    findFirst = jest.fn();
    aggregate = jest.fn();
    const prisma = {
      syncRun: { findFirst },
      covidDailyMetric: { aggregate },
    } as unknown as PrismaService;
    service = new SyncQueryService(prisma);
  });

  it('returns null freshness fields when the database is empty', async () => {
    findFirst.mockResolvedValue(null);
    aggregate.mockResolvedValue({ _max: { referenceDate: null } });

    const status = await service.getStatus();

    expect(status).toEqual({
      lastSuccessfulSyncAt: null,
      lastSyncStatus: null,
      dataSource: 'api-ninjas',
      latestReferenceDate: null,
    });
  });

  it('maps successful sync and latest metric date', async () => {
    findFirst
      .mockResolvedValueOnce({
        completedAt: new Date('2026-07-08T06:00:00.000Z'),
      })
      .mockResolvedValueOnce({ status: SyncStatus.success });
    aggregate.mockResolvedValue({
      _max: { referenceDate: new Date('2023-03-09T00:00:00.000Z') },
    });

    const status = await service.getStatus();

    expect(status.lastSuccessfulSyncAt).toBe('2026-07-08T06:00:00.000Z');
    expect(status.lastSyncStatus).toBe('success');
    expect(status.dataSource).toBe('api-ninjas');
    expect(status.latestReferenceDate).toBe('2023-03-09');
  });
});
