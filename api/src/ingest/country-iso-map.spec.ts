import { listCatalogueIso2, resolveCountry } from './country-iso-map';

describe('country-iso-map', () => {
  it('resolves upstream names logged as unmapped before catalogue expansion', () => {
    const previouslyUnmapped = [
      'Andorra',
      'Burma',
      'Congo (Brazzaville)',
      'Congo (Kinshasa)',
      "Cote d'Ivoire",
      'Eswatini',
      'Holy See',
      'Korea, North',
      'Kosovo',
      'North Macedonia',
      'Timor-Leste',
      'West Bank and Gaza',
    ] as const;

    for (const upstreamName of previouslyUnmapped) {
      expect(resolveCountry(upstreamName)?.iso2).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('does not invent ISO codes for non-sovereign upstream labels', () => {
    expect(resolveCountry('Diamond Princess')).toBeUndefined();
    expect(resolveCountry('MS Zaandam')).toBeUndefined();
    expect(resolveCountry('Summer Olympics 2020')).toBeUndefined();
    expect(resolveCountry('Winter Olympics 2022')).toBeUndefined();
  });

  it('resolves common aliases to the same ISO2 as canonical upstream names', () => {
    expect(resolveCountry('Burma')?.iso2).toBe('MM');
    expect(resolveCountry('Myanmar')?.iso2).toBe('MM');
    expect(resolveCountry('Ivory Coast')?.iso2).toBe('CI');
    expect(resolveCountry('Swaziland')?.iso2).toBe('SZ');
  });

  it('lists unique ISO2 codes from the catalogue', () => {
    const iso2Codes = listCatalogueIso2();
    expect(iso2Codes.length).toBeGreaterThan(150);
    expect(new Set(iso2Codes).size).toBe(iso2Codes.length);
  });
});
