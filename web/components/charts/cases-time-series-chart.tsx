'use client';

/**
 * Confirmed cases line chart (DEV-93 / REQ-F-40–43).
 *
 * Recharts renders SVG client-side only — parent panel is loaded via dynamic(ssr:false).
 * Tooltip content is plain text nodes (no dangerouslySetInnerHTML).
 */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_SERIES_LABEL } from '@/lib/charts/constants';
import { formatChartTooltipValue, formatChartYAxisTick } from '@/lib/charts/format-chart-axis';
import {
  computeXAxisTickInterval,
  formatChartDateTick,
} from '@/lib/charts/map-series-data';
import type { ChartSeriesPoint } from '@/lib/charts/types';

type CasesTimeSeriesChartProps = {
  points: ChartSeriesPoint[];
};

type TooltipPayloadItem = {
  value?: number | null;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
};

function ChartTooltipContent({ active, label, payload }: ChartTooltipProps) {
  if (!active || payload === undefined || payload.length === 0) {
    return null;
  }

  const value = payload[0]?.value ?? null;

  return (
    <div className="rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95">
      <p className="font-medium text-zinc-800 dark:text-zinc-100">{label ?? ''}</p>
      <p className="tabular-nums text-zinc-600 dark:text-zinc-300">
        {CHART_SERIES_LABEL}: {formatChartTooltipValue(value)}
      </p>
    </div>
  );
}

export function CasesTimeSeriesChart({ points }: CasesTimeSeriesChartProps) {
  const tickInterval = computeXAxisTickInterval(points.length);

  return (
    <div
      className="h-[220px] w-full sm:h-[280px]"
      aria-label={`${CHART_SERIES_LABEL} time series chart`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-zinc-200 dark:stroke-zinc-700"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDateTick}
            interval={tickInterval}
            angle={-35}
            textAnchor="end"
            height={56}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-zinc-500 dark:text-zinc-400"
          />
          <YAxis
            tickFormatter={(value: number) => formatChartYAxisTick(value)}
            width={56}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-zinc-500 dark:text-zinc-400"
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={CHART_SERIES_LABEL}
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
