'use client';

/**
 * GeoJSON choropleth layer — fill by metric, tooltip on hover, click → selection (REQ-F-21–23).
 *
 * Client-only (react-leaflet). Tooltips use list-row metrics; bindTooltip receives plain text only.
 */
import type { Layer, PathOptions } from 'leaflet';
import { useCallback } from 'react';
import { GeoJSON } from 'react-leaflet';

import {
  getChoroplethColor,
  type MetricExtent,
} from '@/lib/map/choropleth-scale';
import { formatCountryTooltipText } from '@/lib/map/format-tooltip';
import {
  getMapMetricValue,
  joinFeatureToCountry,
  parseGeoJsonIso2,
  type CountryListLookup,
} from '@/lib/map/join-metrics';
import type {
  CountryFeature,
  CountryFeatureCollection,
  MapMetric,
} from '@/lib/map/types';

type ChoroplethLayerProps = {
  data: CountryFeatureCollection;
  lookup: CountryListLookup;
  metricExtent: MetricExtent | null;
  metric: MapMetric;
  selectedCountry: string | null;
  /** Called with uppercase ISO2 when a country polygon is clicked. */
  onCountryClick: (code: string) => void;
};

export function ChoroplethLayer({
  data,
  lookup,
  metricExtent,
  metric,
  selectedCountry,
  onCountryClick,
}: ChoroplethLayerProps) {
  const style = useCallback(
    (feature?: GeoJSON.Feature): PathOptions => {
      if (feature === undefined) {
        return {};
      }

      const countryFeature = feature as CountryFeature;
      const country = joinFeatureToCountry(countryFeature, lookup);
      const value = getMapMetricValue(country, metric);
      const iso2 = parseGeoJsonIso2(countryFeature.properties);
      const isSelected = iso2 !== null && iso2 === selectedCountry;

      return {
        fillColor: getChoroplethColor(value, metricExtent),
        weight: isSelected ? 2.5 : 1,
        opacity: 1,
        color: isSelected ? '#f59e0b' : '#52525b',
        fillOpacity: 0.75,
      };
    },
    [lookup, metric, metricExtent, selectedCountry],
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: Layer) => {
      const countryFeature = feature as CountryFeature;
      const country = joinFeatureToCountry(countryFeature, lookup);
      const iso2 = parseGeoJsonIso2(countryFeature.properties);

      if (country !== null) {
        layer.bindTooltip(formatCountryTooltipText(country), {
          sticky: false,
          direction: 'auto',
        });
      }

      layer.on('click', () => {
        if (iso2 === null) {
          return;
        }
        onCountryClick(iso2);
      });
    },
    [lookup, onCountryClick],
  );

  return (
    <GeoJSON
      key={`choropleth-${selectedCountry ?? 'global'}-${metric}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
