/**
 * Latest (or rolled-up) metric snapshot (API_SPEC §9.1).
 * Null fields when the source row/aggregate has no value.
 */
export class MetricsSnapshotDto {
  casesTotal!: number | null;
  deathsTotal!: number | null;
  casesNew!: number | null;
  deathsNew!: number | null;

  static from(fields: {
    casesTotal: number | null;
    deathsTotal: number | null;
    casesNew: number | null;
    deathsNew: number | null;
  }): MetricsSnapshotDto {
    const dto = new MetricsSnapshotDto();
    dto.casesTotal = fields.casesTotal;
    dto.deathsTotal = fields.deathsTotal;
    dto.casesNew = fields.casesNew;
    dto.deathsNew = fields.deathsNew;
    return dto;
  }
}
