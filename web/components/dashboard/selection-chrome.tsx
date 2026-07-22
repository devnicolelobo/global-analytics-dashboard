'use client';

import {
  QA_COUNTRY_OPTIONS,
  isQaCountryCode,
} from '@/lib/dashboard/qa-countries';

import { useDashboardSelection } from './dashboard-selection-provider';

/**
 * Lightweight selection chrome — shows global vs country context and clear control (REQ-F-24).
 * Includes an accessible country picker for QA; map will call selectCountry in DEV-92.
 *
 * Security: status text uses React text nodes (auto-escaped). The select only applies
 * whitelisted QA codes before calling selectCountry (defense in depth).
 */
export function SelectionChrome() {
  const { selectedCountry, isGlobal, selectCountry, clearSelection } =
    useDashboardSelection();

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

      <label className="flex items-center gap-1.5">
        <span className="sr-only">Select country for dashboard context</span>
        <select
          value={selectedCountry ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '') {
              clearSelection();
              return;
            }
            if (isQaCountryCode(value)) {
              selectCountry(value);
            }
          }}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Global view</option>
          {QA_COUNTRY_OPTIONS.map(({ code, label }) => (
            <option key={code} value={code}>
              {label} ({code})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
