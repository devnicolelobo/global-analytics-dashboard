import { CountryRefDto } from './country-ref.dto';
import { MetricsSnapshotDto } from './metrics-snapshot.dto';

export class CountryListItemDto {
  code!: string;
  name!: string;
  metrics!: MetricsSnapshotDto | null;

  static from(
    country: CountryRefDto,
    metrics: MetricsSnapshotDto | null,
  ): CountryListItemDto {
    const dto = new CountryListItemDto();
    dto.code = country.code;
    dto.name = country.name;
    dto.metrics = metrics;
    return dto;
  }
}

/** GET /covid/countries (API_SPEC §6.3). */
export class CountriesResponseDto {
  referenceDate!: string | null;
  countries!: CountryListItemDto[];
  meta!: {
    count: number;
    lastSuccessfulSyncAt: string | null;
  };
}
