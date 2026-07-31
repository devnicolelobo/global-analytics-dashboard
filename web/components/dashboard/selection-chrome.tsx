'use client';

import { COUNTRY_EXPLORER_SECTION_ID } from '@/lib/dashboard/country-explorer-constants';

import { useDashboardSelection } from './dashboard-selection-provider';

/**
 * Lightweight selection chrome — global vs country context (REQ-F-24).
 *
 * Country discovery lives in the Country Explorer panel (DEV-99); map and Top 10
 * also call selectCountry (REQ-F-22).
 */
export function SelectionChrome() {
  const { selectedCountry, isGlobal, clearSelection } = useDashboardSelection();

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
      <span
        aria-live="polite"
        aria-atomic="true"
        className="font-medium text-zinc-700 dark:text-zinc-300"
      >
        {isGlobal ? 'Global view' : `Country: ${selectedCountry}`}
      </span>

      {!isGlobal ? (
        <button
          type="button"
          onClick={clearSelection}
          className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Back to global
        </button>
      ) : null}

      <a
        href={`#${COUNTRY_EXPLORER_SECTION_ID}`}
        className="rounded border border-transparent px-2 py-1 text-xs font-medium text-sky-700 underline-offset-2 transition hover:text-sky-900 hover:underline dark:text-sky-300 dark:hover:text-sky-100"
      >
        Search countries
      </a>
    </div>
  );
}
