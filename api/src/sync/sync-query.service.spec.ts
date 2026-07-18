import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertSyncRunIdFormat, SyncQueryService } from './sync-query.service';

const VALID_CUID = 'clx9abc123def456ghi789012';

describe('SyncQueryService', () => {
  let findFirst: jest.Mock;
  let findUnique: jest.Mock;
  let aggregate: jest.Mock;
  let service: SyncQueryService;

  beforeEach(() => {
    findFirst = jest.fn();
    findUnique = jest.fn();
    aggregate = jest.fn();
    const prisma = {
      syncRun: { findFirst, findUnique },
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

  it('getRunById returns mapped SyncRunDto', async () => {
    findUnique.mockResolvedValue({
      id: VALID_CUID,
      startedAt: new Date('2026-07-08T18:30:00.000Z'),
      completedAt: new Date('2026-07-08T18:32:00.000Z'),
      status: SyncStatus.success,
      source: 'api-ninjas',
      mode: 'snapshot',
      recordsUpserted: 10,
      errorMessage: null,
      metadata: { dateParam: '2023-03-09' },
    });

    const dto = await service.getRunById(VALID_CUID);

    expect(dto.id).toBe(VALID_CUID);
    expect(dto.status).toBe('success');
    expect(dto.startedAt).toBe('2026-07-08T18:30:00.000Z');
    expect(dto.metadata).toEqual({ dateParam: '2023-03-09' });
  });

  it('getRunById throws 404 when the run does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getRunById(VALID_CUID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getRunById throws 400 for malformed ids', async () => {
    await expect(service.getRunById('!!invalid!!')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe('assertSyncRunIdFormat', () => {
  it('accepts cuid-shaped ids', () => {
    expect(() => assertSyncRunIdFormat(VALID_CUID)).not.toThrow();
  });

  it('rejects short or punctuation-heavy ids', () => {
    expect(() => assertSyncRunIdFormat('invalid')).toThrow(BadRequestException);
    expect(() => assertSyncRunIdFormat('!!!')).toThrow(BadRequestException);
  });
});
