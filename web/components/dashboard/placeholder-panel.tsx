type PlaceholderPanelProps = {
  title: string;
  description: string;
  minHeightClass?: string;
};

/**
 * Empty region reserved for a dashboard feature (map, KPIs, chart).
 * Replaced by real components in Sprint 03 cards 4–6.
 */
export function PlaceholderPanel({
  title,
  description,
  minHeightClass = "min-h-48",
}: PlaceholderPanelProps) {
  return (
    <section
      aria-label={title}
      className={`flex flex-col justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-6 dark:border-zinc-700 dark:bg-zinc-900/50 ${minHeightClass}`}
    >
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </section>
  );
}
