import { MetricsSnapshotDto } from './metrics-snapshot.dto';

/** GET /covid/summary (API_SPEC §6.2). */
export class SummaryResponseDto {
  scope!: 'global';
  referenceDate!: string | null;
  metrics!: MetricsSnapshotDto | null;
  meta!: {
    lastSuccessfulSyncAt: string | null;
    dataSource: string;
  };
}
