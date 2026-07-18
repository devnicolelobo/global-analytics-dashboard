import { SyncStatus } from '@prisma/client';
import { SyncRunDto } from './sync-run.dto';

describe('SyncRunDto', () => {
  it('fromPrisma redacts secrets in errorMessage', () => {
    const dto = SyncRunDto.fromPrisma({
      id: 'clx9abc123def456ghi789012',
      startedAt: new Date('2026-07-08T18:30:00.000Z'),
      completedAt: null,
      status: SyncStatus.failed,
      source: 'api-ninjas',
      mode: 'snapshot',
      recordsUpserted: 0,
      errorMessage: 'fail postgresql://gad:secret@db/x API_NINJAS_KEY=abc',
      metadata: null,
    });

    expect(dto.errorMessage).not.toContain('secret');
    expect(dto.errorMessage).not.toContain('abc');
    expect(dto.errorMessage).toContain('postgresql://***');
  });
});
