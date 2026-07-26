'use client';

/**
 * World map panel — loads API countries + static GeoJSON, wires selection context (DEV-92 / DEV-94).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDashboardSelection } from '@/components/dashboard/dashboard-selection-provider';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { KPI_METRIC_DEFINITIONS } from '@/lib/kpis/map-kpi-view-model';
import { buildChoroplethLegendStops } from '@/lib/map/choropleth-scale';
import { formatMapDataCoverageSuffix, formatMapReferenceDateSuffix } from '@/lib/map/format-map-subtitle';
import {
  COUNTRIES_GEOJSON_PATH,
  DEFAULT_MAP_METRIC,
  type CountryFeatureCollection,
} from '@/lib/map/types';
import { useMapCountriesData } from '@/lib/map/use-map-countries-data';
import { fetchTextLimited } from '@/lib/fetch/fetch-text-limited';
import {
  isGeoJsonPayloadWithinSizeLimit,
  parseCountryFeatureCollection,
} from '@/lib/map/validate-geojson';

import { WorldMapView } from './world-map-view';

type GeoJsonLoadState = 'loading' | 'success' | 'error';

export function WorldMapPanel() {
  const metric = DEFAULT_MAP_METRIC;
  const { selectedCountry, selectCountry, clearSelection } =
    useDashboardSelection();
  const { loadState, lookup, metricExtent, errorMessage, response, retry } =
    useMapCountriesData(metric);

  const [geojson, setGeojson] = useState<CountryFeatureCollection | null>(null);
  const [geojsonLoadState, setGeojsonLoadState] =
    useState<GeoJsonLoadState>('loading');
  const [geojsonError, setGeojsonError] = useState<string | null>(null);
  const [geojsonRetryCount, setGeojsonRetryCount] = useState(0);

  const retryGeoJson = useCallback(() => {
    setGeojsonRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignoreResult = false;

    async function loadGeoJson() {
      setGeojsonLoadState('loading');
      setGeojsonError(null);

      try {
        const rawText = await fetchTextLimited(COUNTRIES_GEOJSON_PATH, {
          signal: controller.signal,
        });
        if (!isGeoJsonPayloadWithinSizeLimit(rawText)) {
          throw new Error('Map geometry payload too large.');
        }

        const parsedBody: unknown = JSON.parse(rawText);
        const data = parseCountryFeatureCollection(parsedBody);
        if (data === null) {
          throw new Error('Invalid map geometry format.');
        }

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
        setGeojsonError('Unable to load map geometry. Please try again.');
        setGeojsonLoadState('error');
      }
    }

    void loadGeoJson();

    return () => {
      ignoreResult = true;
      controller.abort();
    };
  }, [geojsonRetryCount]);

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

  const handleRetry = useCallback(() => {
    if (loadState === 'error') {
      retry();
    }
    if (geojsonLoadState === 'error') {
      retryGeoJson();
    }
  }, [loadState, geojsonLoadState, retry, retryGeoJson]);

  const metricLabel =
    KPI_METRIC_DEFINITIONS.find((definition) => definition.id === metric)
      ?.label ?? 'Confirmed cases';

  const legendStops = useMemo(
    () => buildChoroplethLegendStops(metricExtent),
    [metricExtent],
  );

  const isLoading = loadState === 'loading' || geojsonLoadState === 'loading';

  const combinedError =
    loadState === 'error' && geojsonLoadState === 'error'
      ? [errorMessage, geojsonError].filter(Boolean).join(' ')
      : loadState === 'error'
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
    <section aria-label="World map" aria-busy={isLoading} className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        World map
      </h2>

      {isLoading ? (
        <LoadingState
          message="Loading map…"
          variant="panel"
          panelSize="map"
        />
      ) : null}

      {combinedError && !isLoading ? (
        <ErrorState message={combinedError} onRetry={handleRetry} />
      ) : null}

      {canRenderMap ? (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Choropleth by {metricLabel.toLowerCase()}
            {formatMapReferenceDateSuffix(response.referenceDate)}
            {formatMapDataCoverageSuffix(response.countries.length)}
            {' · '}
            Gray = no persisted data (not zero)
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
