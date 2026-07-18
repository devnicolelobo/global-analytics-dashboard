import { CountryRefDto } from './country-ref.dto';
import { MetricsSnapshotDto } from './metrics-snapshot.dto';

/** GET /covid/countries/:countryCode (API_SPEC §6.4). */
export class CountryDetailResponseDto {
  scope!: 'country';
  country!: CountryRefDto;
  referenceDate!: string | null;
  metrics!: MetricsSnapshotDto | null;
  meta!: {
    hasRegionalBreakdown: boolean;
    lastSuccessfulSyncAt: string | null;
  };
}
