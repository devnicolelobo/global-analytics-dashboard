import { SyncAcceptedResult, type SyncMode } from '../../ingest/ingest.service';

/**
 * HTTP 202 body for POST /sync (API_SPEC §7.1).
 * `startedAt` is serialized as ISO 8601 UTC string in JSON.
 */
export class SyncAcceptedDto {
  syncRunId!: string;
  status!: 'running';
  startedAt!: string;
  mode!: SyncMode;

  static from(result: SyncAcceptedResult): SyncAcceptedDto {
    const dto = new SyncAcceptedDto();
    dto.syncRunId = result.syncRunId;
    dto.status = result.status;
    dto.startedAt = result.startedAt.toISOString();
    dto.mode = result.mode;
    return dto;
  }
}
