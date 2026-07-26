'use client';

/**
 * Fetches GET /sync/status for the dashboard footer (DEV-94 / REQ-F-52).
 *
 * Canonical freshness metadata — separate from summary.meta so footer stays
 * accurate even when KPI/map/chart endpoints fail.
 */
import { useCallback, useEffect, useState } from 'react';

import { getSyncStatus } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { SyncStatus } from '@/lib/api/types';
import { toFetchErrorMessage } from '@/lib/ui/fetch-error-message';

export type SyncStatusLoadState = 'loading' | 'success' | 'error';

export type UseSyncStatusDataResult = {
  loadState: SyncStatusLoadState;
  syncStatus: SyncStatus | null;
  errorMessage: string | null;
  retry: () => void;
};

export function useSyncStatusData(): UseSyncStatusDataResult {
  const [loadState, setLoadState] = useState<SyncStatusLoadState>('loading');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadSyncStatus() {
      setLoadState('loading');
      setErrorMessage(null);

      try {
        const data = await getSyncStatus({ signal: controller.signal });
        if (ignoreResult) {
          return;
        }

        setSyncStatus(data);
        setLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof ApiError && error.kind === 'abort') {
          return;
        }

        setSyncStatus(null);
        setErrorMessage(
          toFetchErrorMessage(
            error,
            'Sync status unavailable. Please try again.',
          ),
        );
        setLoadState('error');
      }
    }

    void loadSyncStatus();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [retryCount]);

  return { loadState, syncStatus, errorMessage, retry };
}
