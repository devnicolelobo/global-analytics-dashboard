'use client';

/**
 * Leaflet map shell (DEV-92) — OSM tiles + choropleth layer + legend overlay.
 *
 * Client-only MapContainer (ADR-005 / risk R3). Leaflet CSS loads globally via globals.css.
 * Parent loads GeoJSON and API data; this component renders the interactive map only.
 */
import { MapContainer, TileLayer } from 'react-leaflet';

import type {
  ChoroplethLegendStop,
  MetricExtent,
} from '@/lib/map/choropleth-scale';
import type { CountryListLookup } from '@/lib/map/join-metrics';
import type {
  CountryFeatureCollection,
  MapMetric,
} from '@/lib/map/types';

import { ChoroplethLayer } from './choropleth-layer';
import { MapLegend } from './map-legend';

const MAP_CENTER: [number, number] = [20, 0];
const MAP_DEFAULT_ZOOM = 2;

type WorldMapViewProps = {
  geojson: CountryFeatureCollection;
  lookup: CountryListLookup;
  metricExtent: MetricExtent | null;
  metric: MapMetric;
  metricLabel: string;
  legendStops: ChoroplethLegendStop[];
  selectedCountry: string | null;
  onCountryClick: (code: string) => void;
};

export function WorldMapView({
  geojson,
  lookup,
  metricExtent,
  metric,
  metricLabel,
  legendStops,
  selectedCountry,
  onCountryClick,
}: WorldMapViewProps) {
  return (
    <div
      className="relative h-[280px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 sm:h-[360px] dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Interactive world map"
    >
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChoroplethLayer
          data={geojson}
          lookup={lookup}
          metricExtent={metricExtent}
          metric={metric}
          selectedCountry={selectedCountry}
          onCountryClick={onCountryClick}
        />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[1000]">
        <div className="pointer-events-auto">
          <MapLegend metricLabel={metricLabel} stops={legendStops} />
        </div>
      </div>
    </div>
  );
}
