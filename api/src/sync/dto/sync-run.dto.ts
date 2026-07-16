import { SyncRun, SyncStatus } from '@prisma/client';

/**
 * Single SyncRun detail for GET /sync/runs/:id (API_SPEC §7.3).
 * Datetimes are ISO 8601 UTC strings in the JSON response.
 */
export class SyncRunDto {
  id!: string;
  startedAt!: string;
  completedAt!: string | null;
  status!: SyncStatus;
  source!: string;
  mode!: string;
  recordsUpserted!: number;
  errorMessage!: string | null;
  metadata!: Record<string, unknown> | null;

  static fromPrisma(run: SyncRun): SyncRunDto {
    const dto = new SyncRunDto();
    dto.id = run.id;
    dto.startedAt = run.startedAt.toISOString();
    dto.completedAt = run.completedAt ? run.completedAt.toISOString() : null;
    dto.status = run.status;
    dto.source = run.source;
    dto.mode = run.mode;
    dto.recordsUpserted = run.recordsUpserted;
    dto.errorMessage = run.errorMessage;
    dto.metadata = toPlainMetadata(run.metadata);
    return dto;
  }
}

function toPlainMetadata(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}
