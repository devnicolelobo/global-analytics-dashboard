import { describe, expect, it } from 'vitest';

import { formatChartTooltipValue, formatChartYAxisTick } from '../format-chart-axis';

describe('formatChartYAxisTick', () => {
  it('formats large totals compactly', () => {
    expect(formatChartYAxisTick(103802702)).toMatch(/103.8M|104M/);
  });

  it('returns empty string for null', () => {
    expect(formatChartYAxisTick(null)).toBe('');
  });
});

describe('formatChartTooltipValue', () => {
  it('formats full numbers for tooltips', () => {
    expect(formatChartTooltipValue(37076053)).toBe('37,076,053');
  });

  it('renders em dash for null points', () => {
    expect(formatChartTooltipValue(null)).toBe('—');
  });
});
