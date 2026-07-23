import type { KpiCardViewModel } from '@/lib/kpis/map-kpi-view-model';

type KpiCardProps = {
  card: KpiCardViewModel;
};

/**
 * Presentational KPI card (REQ-F-30, REQ-F-32).
 * Renders label/value as React text nodes — API strings are never injected as HTML.
 */
export function KpiCard({ card }: KpiCardProps) {
  return (
    <article
      aria-label={card.label}
      className="flex min-h-28 flex-col justify-center rounded-lg border border-zinc-200 bg-white px-4 py-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {card.label}
      </h3>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {card.value}
      </p>
      {card.subtitle ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {card.subtitle}
        </p>
      ) : null}
    </article>
  );
}
