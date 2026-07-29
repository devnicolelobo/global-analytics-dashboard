'use client';

/**
 * Data coverage banner — map/KPI scope vs chart scope vs reference date (Sprint 04).
 *
 * Untrusted API strings are formatted through existing sync helpers; message copy
 * is built from numeric counts and plain-text date labels only.
 */
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';

import { useCoverageBannerData } from '@/lib/dashboard/use-coverage-banner-data';

export function CoverageBanner() {
  const { loadState, message, errorMessage, retry } = useCoverageBannerData();

  return (
    <div
      aria-label="Data coverage"
      className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mx-auto max-w-7xl">
        {loadState === 'loading' ? (
          <LoadingState message="Loading data coverage…" />
        ) : null}

        {loadState === 'error' && errorMessage ? (
          <ErrorState message={errorMessage} onRetry={retry} variant="compact" />
        ) : null}

        {loadState === 'success' && message ? (
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-zinc-600 dark:text-zinc-400"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
