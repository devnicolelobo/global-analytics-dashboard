'use client';

/**
 * Global top-N countries panel — discovery entry point (Sprint 04 / DEV-98).
 *
 * Row activation drives DashboardSelectionProvider (REQ-F-22). API strings render as
 * text nodes only; metric values use formatMetricValue.
 */
import { useId, useState } from 'react';

import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  formatTopCountriesHeading,
  type RankedCountryRow,
} from '@/lib/dashboard/rank-top-countries';
import {
  DEFAULT_TOP_COUNTRIES_METRIC,
  getTopCountriesMetricLabel,
  isTopCountriesMetric,
  TOP_COUNTRIES_METRIC_OPTIONS,
  type TopCountriesMetric,
} from '@/lib/dashboard/top-countries-metrics';
import { useTopCountriesPanelData } from '@/lib/dashboard/use-top-countries-panel-data';
import { formatMetricValue } from '@/lib/kpis/format-metric';

import { useDashboardSelection } from './dashboard-selection-provider';

function TopCountriesTable({
  rows,
  metricLabel,
  selectedCountry,
  onSelectCountry,
}: {
  rows: RankedCountryRow[];
  metricLabel: string;
  selectedCountry: string | null;
  onSelectCountry: (code: string) => void;
}) {
  function activateRow(code: string) {
    onSelectCountry(code);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[320px] text-left text-xs">
        <caption className="sr-only">
          {metricLabel} ranking. Activate a row to filter KPIs and chart.
        </caption>
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              #
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Country
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Code
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              {metricLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selectedCountry === row.code;

            return (
              <tr
                key={row.code}
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={`Select ${row.name}`}
                onClick={() => activateRow(row.code)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activateRow(row.code);
                  }
                }}
                className={[
                  'cursor-pointer outline-none transition-colors',
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800/60'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30',
                  'focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 dark:focus-visible:bg-zinc-800/60 dark:focus-visible:ring-zinc-500',
                ].join(' ')}
              >
                <td className="px-3 py-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.rank}
                </td>
                <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-100">
                  {row.name}
                </td>
                <td className="px-3 py-2 font-mono text-zinc-600 dark:text-zinc-400">
                  {row.code}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium text-zinc-800 dark:text-zinc-100">
                  {formatMetricValue(row.metricValue)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TopCountriesPanel() {
  const sortSelectId = useId();
  const [metric, setMetric] = useState<TopCountriesMetric>(
    DEFAULT_TOP_COUNTRIES_METRIC,
  );
  const { selectedCountry, selectCountry } = useDashboardSelection();
  const {
    loadState,
    isRefreshing,
    rows,
    referenceDateSubtitle,
    errorMessage,
    retry,
  } = useTopCountriesPanelData(metric);

  const metricLabel = getTopCountriesMetricLabel(metric);
  const heading = formatTopCountriesHeading(rows.length);

  return (
    <section aria-label={heading}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {heading}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Ranked by {metricLabel.toLowerCase()}
            {referenceDateSubtitle ? ` · ${referenceDateSubtitle}` : ''}. Select a
            row to filter KPIs and chart.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {isRefreshing ? (
            <p role="status" aria-live="polite" className="text-xs text-zinc-500">
              Updating…
            </p>
          ) : null}
          <label
            htmlFor={sortSelectId}
            className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <span className="font-medium">Sort by</span>
            <select
              id={sortSelectId}
              value={metric}
              onChange={(event) => {
                const value = event.target.value;
                if (isTopCountriesMetric(value)) {
                  setMetric(value);
                }
              }}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {TOP_COUNTRIES_METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loadState === 'success' && errorMessage ? (
        <div className="mb-3">
          <ErrorState message={errorMessage} onRetry={retry} variant="compact" />
        </div>
      ) : null}

      {loadState === 'loading' ? (
        <LoadingState message="Loading top countries…" variant="panel" />
      ) : null}

      {loadState === 'error' && errorMessage ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : null}

      {loadState === 'success' && rows.length === 0 && !isRefreshing ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No country rankings available for this metric.
        </p>
      ) : null}

      {loadState === 'success' && rows.length > 0 ? (
        <TopCountriesTable
          rows={rows}
          metricLabel={metricLabel}
          selectedCountry={selectedCountry}
          onSelectCountry={selectCountry}
        />
      ) : null}
    </section>
  );
}
