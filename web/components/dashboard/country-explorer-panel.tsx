'use client';

/**
 * Country Explorer — searchable full country list (Sprint 04 / DEV-99).
 *
 * Multi-metric rows, debounced search, selection synced with map and Top 10 (REQ-F-22).
 */
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import type { ExplorerCountryRow } from '@/lib/dashboard/map-explorer-country-rows';
import { type TopCountriesMetric } from '@/lib/dashboard/top-countries-metrics';
import { useCountryExplorerData } from '@/lib/dashboard/use-country-explorer-data';
import { formatMetricValue } from '@/lib/kpis/format-metric';

import { useDashboardSelection } from './dashboard-selection-provider';

export const COUNTRY_EXPLORER_SECTION_ID = 'country-explorer';

const METRIC_COLUMNS: ReadonlyArray<{
  key: TopCountriesMetric;
  label: string;
}> = [
  { key: 'casesTotal', label: 'Confirmed cases' },
  { key: 'deathsTotal', label: 'Deaths' },
  { key: 'casesNew', label: 'New cases' },
];

function formatResultCountCopy(
  visibleCount: number,
  totalCount: number,
  query: string,
): string {
  if (totalCount === 0) {
    return 'No countries available';
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return `Showing all ${totalCount} countries`;
  }

  if (visibleCount === 0) {
    return `No countries match “${trimmedQuery}”`;
  }

  return `Showing ${visibleCount} of ${totalCount} countries`;
}

function MetricCell({ value }: { value: number | null }) {
  return (
    <span className="tabular-nums text-sm font-medium text-zinc-800 dark:text-zinc-100">
      {formatMetricValue(value)}
    </span>
  );
}

function CountryExplorerRow({
  row,
  isSelected,
  isFocused,
  onSelect,
  onFocus,
}: {
  row: ExplorerCountryRow;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (code: string) => void;
  onFocus: () => void;
}) {
  return (
    <li
      id={`country-explorer-option-${row.code}`}
      role="option"
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      onClick={() => onSelect(row.code)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(row.code);
        }
      }}
      className={[
        'grid cursor-pointer grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(4.5rem,1fr))] items-center gap-2 px-3 py-2.5 outline-none transition-colors',
        isSelected
          ? 'bg-sky-50/60 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/20 dark:ring-sky-800'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
        isFocused
          ? 'bg-zinc-50 dark:bg-zinc-800/60'
          : '',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {row.name}
        </div>
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {row.code}
        </div>
      </div>
      {METRIC_COLUMNS.map((column) => (
        <div key={column.key} className="text-right">
          <MetricCell value={row.metrics[column.key]} />
        </div>
      ))}
    </li>
  );
}

export function CountryExplorerPanel() {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const { selectedCountry, selectCountry } = useDashboardSelection();
  const {
    loadState,
    isRefreshing,
    rows,
    totalCount,
    visibleCount,
    debouncedQuery,
    referenceDateSubtitle,
    errorMessage,
    retry,
  } = useCountryExplorerData(searchQuery);

  const resultCopy = formatResultCountCopy(
    visibleCount,
    totalCount,
    debouncedQuery,
  );

  const focusedIndex = focusedCode
    ? Math.max(
        0,
        rows.findIndex((row) => row.code === focusedCode),
      )
    : 0;

  const handleSelect = useCallback(
    (code: string) => {
      selectCountry(code);
    },
    [selectCountry],
  );

  useLayoutEffect(() => {
    if (selectedCountry === null || rows.length === 0) {
      return;
    }

    listRef.current
      ?.querySelector<HTMLElement>(`#country-explorer-option-${selectedCountry}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedCountry, rows]);

  const moveFocus = useCallback(
    (direction: 1 | -1) => {
      if (rows.length === 0) {
        return;
      }

      const currentIndex = focusedCode
        ? rows.findIndex((row) => row.code === focusedCode)
        : 0;
      const baseIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (baseIndex + direction + rows.length) % rows.length;
      const nextCode = rows[nextIndex]?.code ?? null;
      setFocusedCode(nextCode);
      if (nextCode) {
        listRef.current
          ?.querySelector<HTMLElement>(`#country-explorer-option-${nextCode}`)
          ?.focus();
      }
    },
    [focusedCode, rows],
  );

  const handleListKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLUListElement>) => {
      if (rows.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(-1);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        const firstCode = rows[0]?.code ?? null;
        setFocusedCode(firstCode);
        if (firstCode) {
          listRef.current
            ?.querySelector<HTMLElement>(`#country-explorer-option-${firstCode}`)
            ?.focus();
        }
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        const lastCode = rows[rows.length - 1]?.code ?? null;
        setFocusedCode(lastCode);
        if (lastCode) {
          listRef.current
            ?.querySelector<HTMLElement>(`#country-explorer-option-${lastCode}`)
            ?.focus();
        }
      }
    },
    [moveFocus, rows],
  );

  return (
    <section
      id={COUNTRY_EXPLORER_SECTION_ID}
      aria-label="Explore all countries"
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5"
    >
      <div className="mb-4 space-y-3">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            Explore all countries
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Search by name or code · snapshot totals for each country · select a
            row to update KPIs, map, and chart
            {referenceDateSubtitle
              ? ` (${referenceDateSubtitle.replace('Reference date: ', '')})`
              : ''}
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor={`${listboxId}-search`}
              className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              Search countries
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id={`${listboxId}-search`}
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setFocusedCode(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchQuery('');
                    inputRef.current?.blur();
                  }
                  if (event.key === 'ArrowDown' && rows.length > 0) {
                    event.preventDefault();
                    (listRef.current?.children[focusedIndex] as HTMLElement | undefined)?.focus();
                  }
                }}
                placeholder="e.g. Peru or PE"
                autoComplete="off"
                aria-controls={listboxId}
                aria-autocomplete="list"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus-visible:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
              {searchQuery.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFocusedCode(null);
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-xs text-zinc-500 dark:text-zinc-400 sm:pb-2"
          >
            {isRefreshing ? 'Updating countries…' : resultCopy}
          </p>
        </div>
      </div>

      {loadState === 'success' && errorMessage ? (
        <div className="mb-4">
          <ErrorState message={errorMessage} onRetry={retry} variant="compact" />
        </div>
      ) : null}

      {loadState === 'loading' ? (
        <LoadingState message="Loading countries…" variant="panel" />
      ) : null}

      {loadState === 'error' && errorMessage ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : null}

      {loadState === 'success' && rows.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(4.5rem,1fr))] gap-2 border-b border-zinc-200 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span>Country</span>
            {METRIC_COLUMNS.map((column) => (
              <span key={column.key} className="text-right">
                {column.label}
              </span>
            ))}
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Country search results"
            onKeyDown={handleListKeyDown}
            className="max-h-[380px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800"
          >
            {rows.map((row, index) => (
              <CountryExplorerRow
                key={row.code}
                row={row}
                isSelected={selectedCountry === row.code}
                isFocused={focusedIndex === index}
                onSelect={handleSelect}
                onFocus={() => setFocusedCode(row.code)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {loadState === 'success' &&
      rows.length === 0 &&
      totalCount > 0 &&
      !isRefreshing ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{resultCopy}</p>
      ) : null}

      {loadState === 'success' && totalCount === 0 && !isRefreshing ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No countries available yet.
        </p>
      ) : null}
    </section>
  );
}
