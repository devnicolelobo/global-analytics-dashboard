'use client';

/**
 * Global top-N countries panel — analyst-friendly discovery (Sprint 04 / DEV-98).
 *
 * Shows cases, deaths, and new cases side by side; sort control re-orders rows.
 * Row activation drives DashboardSelectionProvider (REQ-F-22).
 */
import { useState } from 'react';

import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  formatTopCountriesHeading,
  getSortMetricValue,
  type RankedCountryRow,
} from '@/lib/dashboard/rank-top-countries';
import {
  DEFAULT_TOP_COUNTRIES_METRIC,
  getTopCountriesMetricLabel,
  TOP_COUNTRIES_METRIC_OPTIONS,
  type TopCountriesMetric,
} from '@/lib/dashboard/top-countries-metrics';
import { useTopCountriesPanelData } from '@/lib/dashboard/use-top-countries-panel-data';
import { formatMetricValue } from '@/lib/kpis/format-metric';

import { useDashboardSelection } from './dashboard-selection-provider';

const METRIC_COLUMNS: ReadonlyArray<{
  key: TopCountriesMetric;
  label: string;
}> = [
  { key: 'casesTotal', label: 'Confirmed cases' },
  { key: 'deathsTotal', label: 'Deaths' },
  { key: 'casesNew', label: 'New cases' },
];

function RankBadge({ rank }: { rank: number }) {
  /** Podium: gold / silver / bronze — ranks 4+ stay neutral so top 3 read clearly. */
  const palette =
    rank === 1
      ? 'border-yellow-400 bg-yellow-100 text-yellow-950 dark:border-yellow-500 dark:bg-yellow-500/25 dark:text-yellow-100'
      : rank === 2
        ? 'border-slate-300 bg-slate-200 text-slate-900 dark:border-slate-400 dark:bg-slate-500/35 dark:text-slate-50'
        : rank === 3
          ? 'border-orange-800 bg-orange-900 text-orange-50 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-200'
          : 'border-transparent bg-zinc-100 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-400';

  return (
    <span
      className={`inline-flex h-6 min-w-7 items-center justify-center rounded-full border px-1.5 text-xs font-semibold tabular-nums ${palette}`}
    >
      {rank}
    </span>
  );
}

function MetricCell({
  value,
  highlighted,
}: {
  value: number | null;
  highlighted: boolean;
}) {
  return (
    <td
      className={[
        'px-3 py-2.5 text-right tabular-nums text-sm',
        highlighted
          ? 'bg-sky-50/80 font-semibold text-sky-950 dark:bg-sky-950/30 dark:text-sky-100'
          : 'font-medium text-zinc-800 dark:text-zinc-100',
      ].join(' ')}
    >
      {formatMetricValue(value)}
    </td>
  );
}

function TopCountriesTable({
  rows,
  sortMetric,
  selectedCountry,
  onSelectCountry,
}: {
  rows: RankedCountryRow[];
  sortMetric: TopCountriesMetric;
  selectedCountry: string | null;
  onSelectCountry: (code: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[540px] text-left">
        <caption className="sr-only">
          Country rankings with confirmed cases, deaths, and new cases. Sorted by{' '}
          {getTopCountriesMetricLabel(sortMetric)}.
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th scope="col" className="px-3 py-3 font-semibold">
              Rank
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Country
            </th>
            {METRIC_COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={[
                  'px-3 py-3 text-right font-semibold',
                  sortMetric === column.key
                    ? 'bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200'
                    : '',
                ].join(' ')}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => {
            const isSelected = selectedCountry === row.code;

            return (
              <tr
                key={row.code}
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={`Explore ${row.name}`}
                onClick={() => onSelectCountry(row.code)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectCountry(row.code);
                  }
                }}
                className={[
                  'cursor-pointer outline-none transition-colors',
                  isSelected
                    ? 'bg-sky-50/60 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/20 dark:ring-sky-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                  'focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 dark:focus-visible:bg-zinc-800/60',
                ].join(' ')}
              >
                <td className="px-3 py-2.5">
                  <RankBadge rank={row.rank} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {row.name}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {row.code}
                    </span>
                  </div>
                </td>
                {METRIC_COLUMNS.map((column) => (
                  <MetricCell
                    key={column.key}
                    value={getSortMetricValue(row, column.key)}
                    highlighted={sortMetric === column.key}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TopCountriesPanel() {
  const [sortMetric, setSortMetric] = useState<TopCountriesMetric>(
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
  } = useTopCountriesPanelData(sortMetric);

  const heading = formatTopCountriesHeading(rows.length);
  const activeSortLabel = getTopCountriesMetricLabel(sortMetric);

  return (
    <section
      aria-label={heading}
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {heading}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Compare persisted totals at a glance — confirmed cases, deaths, and
            daily new cases in one view
            {referenceDateSubtitle ? ` (${referenceDateSubtitle.replace('Reference date: ', '')})` : ''}.
            Select a country to drill into KPIs and the chart.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Rank rows by
          </span>
          <div
            className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-950"
            role="group"
            aria-label="Sort ranking by metric"
          >
            {TOP_COUNTRIES_METRIC_OPTIONS.map((option) => {
              const isActive = sortMetric === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSortMetric(option.value)}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-sky-300 bg-sky-100 text-sky-950 shadow-sm dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100'
                      : 'border-transparent text-zinc-700 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {isRefreshing ? (
            <p role="status" aria-live="polite" className="text-xs text-zinc-500">
              Updating rankings…
            </p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sorted by {activeSortLabel.toLowerCase()} · highlighted column
            </p>
          )}
        </div>
      </div>

      {loadState === 'success' && errorMessage ? (
        <div className="mb-4">
          <ErrorState message={errorMessage} onRetry={retry} variant="compact" />
        </div>
      ) : null}

      {loadState === 'loading' ? (
        <LoadingState message="Loading country rankings…" variant="panel" />
      ) : null}

      {loadState === 'error' && errorMessage ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : null}

      {loadState === 'success' && rows.length === 0 && !isRefreshing ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No country rankings available yet.
        </p>
      ) : null}

      {loadState === 'success' && rows.length > 0 ? (
        <TopCountriesTable
          rows={rows}
          sortMetric={sortMetric}
          selectedCountry={selectedCountry}
          onSelectCountry={selectCountry}
        />
      ) : null}
    </section>
  );
}
