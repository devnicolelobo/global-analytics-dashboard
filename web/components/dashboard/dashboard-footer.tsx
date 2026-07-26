'use client';

/**
 * Dashboard footer — live sync freshness from GET /sync/status (DEV-94 / REQ-F-52).
 *
 * Does not trigger POST /sync (operator-only). Untrusted API strings render as
 * plain text nodes only.
 */
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  formatDataSourceLabel,
  formatLastSuccessfulSyncAt,
  formatLastSyncStatus,
  formatLatestReferenceDate,
} from '@/lib/sync/format-sync-status';
import { useSyncStatusData } from '@/lib/sync/use-sync-status-data';

export function DashboardFooter() {
  const { loadState, syncStatus, errorMessage, retry } = useSyncStatusData();

  const referenceDateLabel =
    syncStatus !== null
      ? formatLatestReferenceDate(syncStatus.latestReferenceDate)
      : null;
  const statusLabel =
    syncStatus !== null
      ? formatLastSyncStatus(syncStatus.lastSyncStatus)
      : null;

  return (
    <footer
      aria-label="Data freshness"
      className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <div className="space-y-1">
          {loadState === 'loading' ? (
            <LoadingState message="Loading sync status…" />
          ) : null}

          {loadState === 'error' && errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={retry}
              variant="compact"
            />
          ) : null}

          {loadState === 'success' && syncStatus ? (
            <p>
              Data source:{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatDataSourceLabel(syncStatus.dataSource)}
              </span>
              {' · '}
              Last successful sync:{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatLastSuccessfulSyncAt(syncStatus.lastSuccessfulSyncAt)}
              </span>
              {statusLabel ? (
                <>
                  {' · '}
                  Last run:{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {statusLabel}
                  </span>
                </>
              ) : null}
              {referenceDateLabel ? (
                <>
                  {' · '}
                  Latest reference date:{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {referenceDateLabel}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <p>Served from persisted backend storage — not live upstream calls.</p>
      </div>
    </footer>
  );
}
