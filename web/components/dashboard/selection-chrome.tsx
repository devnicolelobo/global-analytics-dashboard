'use client';

import { useDashboardSelection } from './dashboard-selection-provider';

/** Minimal ISO2 samples for manual QA until DEV-92 map click wiring. */
const QA_COUNTRY_OPTIONS = [
  { code: 'BR', label: 'Brazil' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'JP', label: 'Japan' },
] as const;

/**
 * Lightweight selection chrome — shows global vs country context and clear control (REQ-F-24).
 * Includes an accessible country picker for QA; map will call selectCountry in DEV-92.
 */
export function SelectionChrome() {
  const { selectedCountry, selectCountry, clearSelection } =
    useDashboardSelection();

  const isGlobal = selectedCountry === null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
      <span aria-live="polite" className="font-medium text-zinc-700 dark:text-zinc-300">
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
            selectCountry(value);
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
