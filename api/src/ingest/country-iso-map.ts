import { ResolvedCountry } from './normalized-metric.types';

/**
 * Static upstream country name → ISO 3166-1 alpha-2 catalogue for MVP.
 * Keys are lowercased / trimmed; lookup is case-insensitive.
 * @see docs/EXTERNAL_APIS.md §4 / G-04 · docs/DATA_MODEL.md §6.3
 */

type CountryCatalogueEntry = ResolvedCountry;

/** Canonical catalogue: ISO2 primary identity + display name + upstream spelling. */
const COUNTRY_CATALOGUE: CountryCatalogueEntry[] = [
  { iso2: 'AF', name: 'Afghanistan', upstreamName: 'Afghanistan' },
  { iso2: 'AL', name: 'Albania', upstreamName: 'Albania' },
  { iso2: 'DZ', name: 'Algeria', upstreamName: 'Algeria' },
  { iso2: 'AR', name: 'Argentina', upstreamName: 'Argentina' },
  { iso2: 'AU', name: 'Australia', upstreamName: 'Australia' },
  { iso2: 'AT', name: 'Austria', upstreamName: 'Austria' },
  { iso2: 'BD', name: 'Bangladesh', upstreamName: 'Bangladesh' },
  { iso2: 'BE', name: 'Belgium', upstreamName: 'Belgium' },
  { iso2: 'BO', name: 'Bolivia', upstreamName: 'Bolivia' },
  { iso2: 'BR', name: 'Brazil', upstreamName: 'Brazil' },
  { iso2: 'BG', name: 'Bulgaria', upstreamName: 'Bulgaria' },
  { iso2: 'CA', name: 'Canada', upstreamName: 'Canada' },
  { iso2: 'CL', name: 'Chile', upstreamName: 'Chile' },
  { iso2: 'CN', name: 'China', upstreamName: 'China' },
  { iso2: 'CO', name: 'Colombia', upstreamName: 'Colombia' },
  { iso2: 'CR', name: 'Costa Rica', upstreamName: 'Costa Rica' },
  { iso2: 'HR', name: 'Croatia', upstreamName: 'Croatia' },
  { iso2: 'CU', name: 'Cuba', upstreamName: 'Cuba' },
  { iso2: 'CZ', name: 'Czechia', upstreamName: 'Czechia' },
  { iso2: 'DK', name: 'Denmark', upstreamName: 'Denmark' },
  {
    iso2: 'DO',
    name: 'Dominican Republic',
    upstreamName: 'Dominican Republic',
  },
  { iso2: 'EC', name: 'Ecuador', upstreamName: 'Ecuador' },
  { iso2: 'EG', name: 'Egypt', upstreamName: 'Egypt' },
  { iso2: 'SV', name: 'El Salvador', upstreamName: 'El Salvador' },
  { iso2: 'EE', name: 'Estonia', upstreamName: 'Estonia' },
  { iso2: 'ET', name: 'Ethiopia', upstreamName: 'Ethiopia' },
  { iso2: 'FI', name: 'Finland', upstreamName: 'Finland' },
  { iso2: 'FR', name: 'France', upstreamName: 'France' },
  { iso2: 'DE', name: 'Germany', upstreamName: 'Germany' },
  { iso2: 'GH', name: 'Ghana', upstreamName: 'Ghana' },
  { iso2: 'GR', name: 'Greece', upstreamName: 'Greece' },
  { iso2: 'GT', name: 'Guatemala', upstreamName: 'Guatemala' },
  { iso2: 'HN', name: 'Honduras', upstreamName: 'Honduras' },
  { iso2: 'HK', name: 'Hong Kong', upstreamName: 'Hong Kong' },
  { iso2: 'HU', name: 'Hungary', upstreamName: 'Hungary' },
  { iso2: 'IN', name: 'India', upstreamName: 'India' },
  { iso2: 'ID', name: 'Indonesia', upstreamName: 'Indonesia' },
  { iso2: 'IR', name: 'Iran', upstreamName: 'Iran' },
  { iso2: 'IQ', name: 'Iraq', upstreamName: 'Iraq' },
  { iso2: 'IE', name: 'Ireland', upstreamName: 'Ireland' },
  { iso2: 'IL', name: 'Israel', upstreamName: 'Israel' },
  { iso2: 'IT', name: 'Italy', upstreamName: 'Italy' },
  { iso2: 'JP', name: 'Japan', upstreamName: 'Japan' },
  { iso2: 'JO', name: 'Jordan', upstreamName: 'Jordan' },
  { iso2: 'KZ', name: 'Kazakhstan', upstreamName: 'Kazakhstan' },
  { iso2: 'KE', name: 'Kenya', upstreamName: 'Kenya' },
  { iso2: 'KR', name: 'South Korea', upstreamName: 'South Korea' },
  { iso2: 'KW', name: 'Kuwait', upstreamName: 'Kuwait' },
  { iso2: 'LV', name: 'Latvia', upstreamName: 'Latvia' },
  { iso2: 'LB', name: 'Lebanon', upstreamName: 'Lebanon' },
  { iso2: 'LT', name: 'Lithuania', upstreamName: 'Lithuania' },
  { iso2: 'LU', name: 'Luxembourg', upstreamName: 'Luxembourg' },
  { iso2: 'MY', name: 'Malaysia', upstreamName: 'Malaysia' },
  { iso2: 'MX', name: 'Mexico', upstreamName: 'Mexico' },
  { iso2: 'MA', name: 'Morocco', upstreamName: 'Morocco' },
  { iso2: 'NL', name: 'Netherlands', upstreamName: 'Netherlands' },
  { iso2: 'NZ', name: 'New Zealand', upstreamName: 'New Zealand' },
  { iso2: 'NG', name: 'Nigeria', upstreamName: 'Nigeria' },
  { iso2: 'NO', name: 'Norway', upstreamName: 'Norway' },
  { iso2: 'PK', name: 'Pakistan', upstreamName: 'Pakistan' },
  { iso2: 'PA', name: 'Panama', upstreamName: 'Panama' },
  { iso2: 'PY', name: 'Paraguay', upstreamName: 'Paraguay' },
  { iso2: 'PE', name: 'Peru', upstreamName: 'Peru' },
  { iso2: 'PH', name: 'Philippines', upstreamName: 'Philippines' },
  { iso2: 'PL', name: 'Poland', upstreamName: 'Poland' },
  { iso2: 'PT', name: 'Portugal', upstreamName: 'Portugal' },
  { iso2: 'QA', name: 'Qatar', upstreamName: 'Qatar' },
  { iso2: 'RO', name: 'Romania', upstreamName: 'Romania' },
  { iso2: 'RU', name: 'Russia', upstreamName: 'Russia' },
  { iso2: 'SA', name: 'Saudi Arabia', upstreamName: 'Saudi Arabia' },
  { iso2: 'RS', name: 'Serbia', upstreamName: 'Serbia' },
  { iso2: 'SG', name: 'Singapore', upstreamName: 'Singapore' },
  { iso2: 'SK', name: 'Slovakia', upstreamName: 'Slovakia' },
  { iso2: 'SI', name: 'Slovenia', upstreamName: 'Slovenia' },
  { iso2: 'ZA', name: 'South Africa', upstreamName: 'South Africa' },
  { iso2: 'ES', name: 'Spain', upstreamName: 'Spain' },
  { iso2: 'SE', name: 'Sweden', upstreamName: 'Sweden' },
  { iso2: 'CH', name: 'Switzerland', upstreamName: 'Switzerland' },
  { iso2: 'TW', name: 'Taiwan', upstreamName: 'Taiwan' },
  { iso2: 'TH', name: 'Thailand', upstreamName: 'Thailand' },
  { iso2: 'TR', name: 'Turkey', upstreamName: 'Turkey' },
  { iso2: 'UA', name: 'Ukraine', upstreamName: 'Ukraine' },
  {
    iso2: 'AE',
    name: 'United Arab Emirates',
    upstreamName: 'United Arab Emirates',
  },
  { iso2: 'GB', name: 'United Kingdom', upstreamName: 'United Kingdom' },
  { iso2: 'US', name: 'United States', upstreamName: 'United States' },
  { iso2: 'UY', name: 'Uruguay', upstreamName: 'Uruguay' },
  { iso2: 'VE', name: 'Venezuela', upstreamName: 'Venezuela' },
  { iso2: 'VN', name: 'Vietnam', upstreamName: 'Vietnam' },
];

/**
 * Alternate spellings / provider-specific labels → same ResolvedCountry.
 * Keep overrides small; extend only when live sync logs unmapped names (G-04).
 */
const UPSTREAM_ALIASES: Record<string, string> = {
  'united states of america': 'United States',
  usa: 'United States',
  us: 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  'czech republic': 'Czechia',
  'korea, south': 'South Korea',
  'republic of korea': 'South Korea',
  'russian federation': 'Russia',
  'viet nam': 'Vietnam',
  'taiwan*': 'Taiwan',
  'bolivia (plurinational state of)': 'Bolivia',
  'iran (islamic republic of)': 'Iran',
  'venezuela (bolivarian republic of)': 'Venezuela',
};

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function buildLookup(): Map<string, ResolvedCountry> {
  const byUpstream = new Map<string, ResolvedCountry>();

  for (const entry of COUNTRY_CATALOGUE) {
    byUpstream.set(normalizeLookupKey(entry.upstreamName), entry);
    byUpstream.set(normalizeLookupKey(entry.name), entry);
  }

  for (const [alias, canonicalUpstream] of Object.entries(UPSTREAM_ALIASES)) {
    const resolved = byUpstream.get(normalizeLookupKey(canonicalUpstream));
    if (resolved) {
      byUpstream.set(normalizeLookupKey(alias), resolved);
    }
  }

  return byUpstream;
}

const LOOKUP = buildLookup();

/**
 * Resolve an API Ninjas country string to ISO2 catalogue entry.
 * Returns undefined for unmapped names — caller must skip the row (G-04), not fail the batch.
 */
export function resolveCountry(
  upstreamCountryName: string,
): ResolvedCountry | undefined {
  if (!upstreamCountryName?.trim()) {
    return undefined;
  }

  return LOOKUP.get(normalizeLookupKey(upstreamCountryName));
}

/** Exposed for tests and ingest diagnostics — list of known ISO2 codes. */
export function listCatalogueIso2(): string[] {
  return COUNTRY_CATALOGUE.map((entry) => entry.iso2);
}
