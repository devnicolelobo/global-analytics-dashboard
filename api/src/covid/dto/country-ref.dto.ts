/**
 * Country identity for map join / UI labels (API_SPEC §9.2).
 */
export class CountryRefDto {
  code!: string;
  name!: string;

  static from(iso2: string, name: string): CountryRefDto {
    const dto = new CountryRefDto();
    dto.code = iso2;
    dto.name = name;
    return dto;
  }
}
