/**
 * Best-effort sync reference date for coverage banner (Sprint 04).
 *
 * Returns null when sync status is unavailable; rethrows abort so callers can
 * honour unmount / stale guards.
 */
import { getSyncStatus } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { formatLatestReferenceDate } from '@/lib/sync/format-sync-status';

export async function loadSyncReferenceLabel(
  signal: AbortSignal,
): Promise<string | null> {
  try {
    const syncStatus = await getSyncStatus({ signal });
    return formatLatestReferenceDate(syncStatus.latestReferenceDate);
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'abort') {
      throw error;
    }

    return null;
  }
}
