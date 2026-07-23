import { describe, expect, it } from 'vitest';

import {
  buildChoroplethLegendStops,
  CHOROPLETH_NO_DATA_COLOR,
  CHOROPLETH_SCALE_MAX_COLOR,
  CHOROPLETH_SCALE_MIN_COLOR,
  computeMetricExtent,
  getChoroplethColor,
  interpolateHexColor,
} from '../choropleth-scale';

describe('computeMetricExtent', () => {
  it('returns min and max over finite values', () => {
    expect(computeMetricExtent([10, null, 50, 30])).toEqual({ min: 10, max: 50 });
  });

  it('returns null when all values are null or missing', () => {
    expect(computeMetricExtent([null, undefined])).toBeNull();
    expect(computeMetricExtent([])).toBeNull();
  });

  it('bumps max when all values are equal to avoid zero range', () => {
    expect(computeMetricExtent([100, 100])).toEqual({ min: 100, max: 101 });
  });

  it('skips NaN values', () => {
    expect(computeMetricExtent([Number.NaN, 5])).toEqual({ min: 5, max: 6 });
  });
});

describe('interpolateHexColor', () => {
  it('returns the start color at ratio 0 and end color at ratio 1', () => {
    expect(
      interpolateHexColor(
        CHOROPLETH_SCALE_MIN_COLOR,
        CHOROPLETH_SCALE_MAX_COLOR,
        0,
      ),
    ).toBe(CHOROPLETH_SCALE_MIN_COLOR);
    expect(
      interpolateHexColor(
        CHOROPLETH_SCALE_MIN_COLOR,
        CHOROPLETH_SCALE_MAX_COLOR,
        1,
      ),
    ).toBe(CHOROPLETH_SCALE_MAX_COLOR);
  });

  it('clamps ratios below 0 and above 1', () => {
    expect(interpolateHexColor('#000000', '#ffffff', -0.5)).toBe('#000000');
    expect(interpolateHexColor('#000000', '#ffffff', 1.5)).toBe('#ffffff');
  });
});

describe('getChoroplethColor', () => {
  const extent = { min: 0, max: 100 };

  it('uses no-data color for null, undefined, and NaN', () => {
    expect(getChoroplethColor(null, extent)).toBe(CHOROPLETH_NO_DATA_COLOR);
    expect(getChoroplethColor(undefined, extent)).toBe(
      CHOROPLETH_NO_DATA_COLOR,
    );
    expect(getChoroplethColor(Number.NaN, extent)).toBe(
      CHOROPLETH_NO_DATA_COLOR,
    );
  });

  it('uses no-data color when extent is null', () => {
    expect(getChoroplethColor(50, null)).toBe(CHOROPLETH_NO_DATA_COLOR);
  });

  it('maps min and max values to scale endpoints', () => {
    expect(getChoroplethColor(0, extent)).toBe(CHOROPLETH_SCALE_MIN_COLOR);
    expect(getChoroplethColor(100, extent)).toBe(CHOROPLETH_SCALE_MAX_COLOR);
  });
});

describe('buildChoroplethLegendStops', () => {
  it('returns empty array when extent is null', () => {
    expect(buildChoroplethLegendStops(null)).toEqual([]);
  });

  it('builds five labeled stops across the extent', () => {
    const stops = buildChoroplethLegendStops({ min: 0, max: 100 }, 5);

    expect(stops).toHaveLength(5);
    expect(stops[0]?.label).toBe('0');
    expect(stops[4]?.label).toBe('100');
    expect(stops[0]?.color).toBe(CHOROPLETH_SCALE_MIN_COLOR);
    expect(stops[4]?.color).toBe(CHOROPLETH_SCALE_MAX_COLOR);
  });
});
