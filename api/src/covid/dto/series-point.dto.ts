/**
 * Single time-series point (API_SPEC §9.3).
 * `value` is null when the metric is missing for that date.
 */
export class SeriesPointDto {
  date!: string;
  value!: number | null;

  static from(date: string, value: number | null): SeriesPointDto {
    const dto = new SeriesPointDto();
    dto.date = date;
    dto.value = value;
    return dto;
  }
}
