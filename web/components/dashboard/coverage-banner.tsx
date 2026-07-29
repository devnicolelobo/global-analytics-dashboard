'use client';

/**
 * Data coverage banner — map/KPI scope vs chart scope vs reference date (Sprint 04).
 *
 * Untrusted API strings are formatted through existing sync helpers; counts render
 * as React text nodes with emphasized numerals for scanability.
 */
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';

import { useCoverageBannerData } from '@/lib/dashboard/use-coverage-banner-data';

function CoverageMetric({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  const unit = count === 1 ? 'country' : 'countries';

  return (
    <>
      {label}:{' '}
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{count}</span>{' '}
      {unit}
    </>
  );
}

export function CoverageBanner() {
  const { loadState, display, message, errorMessage, retry } =
    useCoverageBannerData();

  return (
    <section
      aria-label={message ?? 'Data coverage'}
      className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mx-auto max-w-7xl">
        {loadState === 'loading' ? (
          <LoadingState message="Loading data coverage…" />
        ) : null}

        {loadState === 'error' && errorMessage ? (
          <ErrorState message={errorMessage} onRetry={retry} variant="compact" />
        ) : null}

        {loadState === 'success' && display ? (
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-zinc-600 dark:text-zinc-400"
          >
            <CoverageMetric label="Map & KPIs" count={display.mapCountryCount} />
            {' · '}
            <CoverageMetric
              label="Full daily chart"
              count={display.chartReadyCount}
            />
            {' · '}
            Reference:{' '}
            {display.referenceUnavailable ? (
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                unavailable
              </span>
            ) : (
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {display.referenceDateLabel}
              </span>
            )}
          </p>
        ) : null}
      </div>
    </section>
  );
}
