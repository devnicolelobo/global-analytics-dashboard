import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncRunDto } from './dto/sync-run.dto';
import { SyncStatusDto } from './dto/sync-status.dto';

/**
 * Prisma `@default(cuid())` ids look like `c` + 24 base36 chars.
 * Malformed ids → 400; well-formed but missing → 404.
 */
const SYNC_RUN_ID_PATTERN = /^c[a-z0-9]{24}$/i;

/**
 * Read-side sync queries (API_SPEC §5.1 / §7.2–7.3).
 * Separated from IngestService (write/orchestration).
 */
@Injectable()
export class SyncQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Freshness metadata for operators and dashboard footer.
   * Empty DB → null fields (never 500).
   */
  async getStatus(): Promise<SyncStatusDto> {
    const [lastSuccessful, latestRun, latestMetric] = await Promise.all([
      this.prisma.syncRun.findFirst({
        where: { status: SyncStatus.success, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
      this.prisma.syncRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { status: true },
      }),
      this.prisma.covidDailyMetric.aggregate({
        _max: { referenceDate: true },
      }),
    ]);

    const dto = new SyncStatusDto();
    dto.lastSuccessfulSyncAt = lastSuccessful?.completedAt
      ? lastSuccessful.completedAt.toISOString()
      : null;
    dto.lastSyncStatus = latestRun?.status ?? null;
    dto.dataSource = 'api-ninjas';
    dto.latestReferenceDate = latestMetric._max.referenceDate
      ? toIsoDateOnly(latestMetric._max.referenceDate)
      : null;
    return dto;
  }

  /** Single SyncRun for debugging (API_SPEC §7.3). */
  async getRunById(id: string): Promise<SyncRunDto> {
    assertSyncRunIdFormat(id);

    const run = await this.prisma.syncRun.findUnique({ where: { id } });
    if (!run) {
      throw new NotFoundException(`Sync run '${id}' not found`);
    }

    return SyncRunDto.fromPrisma(run);
  }
}

/** Exported for unit tests. */
export function assertSyncRunIdFormat(id: string): void {
  if (!SYNC_RUN_ID_PATTERN.test(id)) {
    throw new BadRequestException(
      'Invalid sync run id format: expected a cuid',
    );
  }
}

/** Format Prisma @db.Date as YYYY-MM-DD (UTC calendar date). */
function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
