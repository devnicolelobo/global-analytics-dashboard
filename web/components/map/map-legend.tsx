import {
  CHOROPLETH_NO_DATA_COLOR,
  type ChoroplethLegendStop,
} from '@/lib/map/choropleth-scale';

type MapLegendProps = {
  /** English metric name shown above the scale (REQ-F-21 legend). */
  metricLabel: string;
  stops: ChoroplethLegendStop[];
  /** When true, show a separate swatch for countries without API metrics. */
  showNoData?: boolean;
};

/**
 * Choropleth legend — color scale + optional no-data swatch (REQ-F-21).
 * Presentational only; stops are built from API extent in the map panel.
 */
export function MapLegend({
  metricLabel,
  stops,
  showNoData = true,
}: MapLegendProps) {
  if (stops.length === 0 && !showNoData) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95"
      aria-label={`${metricLabel} map legend`}
    >
      <p className="mb-2 font-semibold text-zinc-700 dark:text-zinc-200">
        {metricLabel}
      </p>

      {stops.length > 0 ? (
        <ul className="flex flex-col gap-1" aria-label="Color scale">
          {stops.map((stop) => (
            <li key={`${stop.label}-${stop.color}`} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-6 shrink-0 rounded-sm border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: stop.color }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                {stop.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {showNoData ? (
        <div className="mt-2 flex items-center gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          <span
            className="inline-block h-3 w-6 shrink-0 rounded-sm border border-zinc-300 dark:border-zinc-600"
            style={{ backgroundColor: CHOROPLETH_NO_DATA_COLOR }}
            aria-hidden="true"
          />
          <span className="text-zinc-600 dark:text-zinc-300">No data</span>
        </div>
      ) : null}
    </div>
  );
}
