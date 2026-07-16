/**
 * Freshness metadata for GET /sync/status (API_SPEC §5.1).
 * Null fields when the database has no sync/metrics yet (not 500).
 */
export class SyncStatusDto {
  lastSuccessfulSyncAt!: string | null;
  lastSyncStatus!: 'running' | 'success' | 'failed' | null;
  dataSource!: string;
  latestReferenceDate!: string | null;
}
