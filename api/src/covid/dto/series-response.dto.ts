import { CountryRefDto } from './country-ref.dto';
import { MetricType } from './metric-type';
import { SeriesPointDto } from './series-point.dto';

/** Shared meta for series responses (API_SPEC §6.5–6.6). */
export class SeriesMetaDto {
  pointCount!: number;
  from!: string | null;
  to!: string | null;
}

/** GET /covid/countries/:countryCode/series (API_SPEC §6.5). */
export class CountrySeriesResponseDto {
  scope!: 'country';
  country!: CountryRefDto;
  metric!: MetricType;
  points!: SeriesPointDto[];
  meta!: SeriesMetaDto;
}

/** GET /covid/series (API_SPEC §6.6). */
export class GlobalSeriesResponseDto {
  scope!: 'global';
  metric!: MetricType;
  points!: SeriesPointDto[];
  meta!: SeriesMetaDto;
}
