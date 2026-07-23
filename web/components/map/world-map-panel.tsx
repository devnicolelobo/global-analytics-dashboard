'use client';

/**
 * World map panel — loads API countries + static GeoJSON, wires selection context (DEV-92).
 *
 * Fetches geometry once (memoized by mount); country metrics refetch only when metric changes.
 * Click toggles selection: same ISO2 clears, different ISO2 selects (REQ-F-22, REQ-F-24).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import { KPI_METRIC_DEFINITIONS } from '@/lib/kpis/map-kpi-view-model';
import { buildChoroplethLegendStops } from '@/lib/map/choropleth-scale';
import {
  COUNTRIES_GEOJSON_PATH,
  DEFAULT_MAP_METRIC,
  type CountryFeatureCollection,
} from '@/lib/map/types';
import { useMapCountriesData } from '@/lib/map/use-map-countries-data';

import { WorldMapView } from './world-map-view';

type GeoJsonLoadState = 'idle' | 'loading' | 'success' | 'error';

export function WorldMapPanel() {
  const metric = DEFAULT_MAP_METRIC;
  const { selectedCountry, selectCountry, clearSelection } =
    useDashboardSelection();
  const { loadState, lookup, metricExtent, errorMessage, response } =
    useMapCountriesData(metric);

  const [geojson, setGeojson] = useState<CountryFeatureCollection | null>(null);
  const [geojsonLoadState, setGeojsonLoadState] =
    useState<GeoJsonLoadState>('idle');
  const [geojsonError, setGeojsonError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadGeoJson() {
      setGeojsonLoadState('loading');
      setGeojsonError(null);

      try {
        const fetchResponse = await fetch(COUNTRIES_GEOJSON_PATH, {
          signal: controller.signal,
        });
        if (!fetchResponse.ok) {
          throw new Error('Map geometry request failed.');
        }

        const data = (await fetchResponse.json()) as CountryFeatureCollection;
        if (ignoreResult) {
          return;
        }

        setGeojson(data);
        setGeojsonLoadState('success');
      } catch (error) {
        if (ignoreResult) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setGeojson(null);
        setGeojsonError('Unable to load map geometry. Please refresh the page.');
        setGeojsonLoadState('error');
      }
    }

    void loadGeoJson();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, []);

  const handleCountryClick = useCallback(
    (code: string) => {
      if (code === selectedCountry) {
        clearSelection();
        return;
      }
      selectCountry(code);
    },
    [selectedCountry, selectCountry, clearSelection],
  );

  const metricLabel =
    KPI_METRIC_DEFINITIONS.find((definition) => definition.id === metric)
      ?.label ?? 'Confirmed cases';

  const legendStops = useMemo(
    () => buildChoroplethLegendStops(metricExtent),
    [metricExtent],
  );

  const isLoading =
    loadState === 'idle' ||
    loadState === 'loading' ||
    geojsonLoadState === 'idle' ||
    geojsonLoadState === 'loading';

  const combinedError =
    loadState === 'error'
      ? errorMessage
      : geojsonLoadState === 'error'
        ? geojsonError
        : null;

  const canRenderMap =
    loadState === 'success' &&
    geojsonLoadState === 'success' &&
    geojson !== null &&
    response !== null;

  return (
    <section aria-label="World map" className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        World map
      </h2>

      {isLoading ? (
        <p
          role="status"
          aria-live="polite"
          className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-600 sm:min-h-[360px] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400"
        >
          Loading map…
        </p>
      ) : null}

      {combinedError ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {combinedError}
        </p>
      ) : null}

      {canRenderMap ? (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Choropleth by {metricLabel.toLowerCase()}
            {response.referenceDate
              ? ` · Reference date: ${response.referenceDate}`
              : ''}
            {' · '}
            Click a country to filter KPIs and chart
          </p>
          <WorldMapView
            geojson={geojson}
            lookup={lookup}
            metricExtent={metricExtent}
            metric={metric}
            metricLabel={metricLabel}
            legendStops={legendStops}
            selectedCountry={selectedCountry}
            onCountryClick={handleCountryClick}
          />
        </>
      ) : null}
    </section>
  );
}
