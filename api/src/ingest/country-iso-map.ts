import { ResolvedCountry } from './normalized-metric.types';

/**
 * Static upstream country name → ISO 3166-1 alpha-2 catalogue for MVP.
 * Keys are lowercased / trimmed; lookup is case-insensitive.
 * `upstreamName` must match API Ninjas spellings exactly (G-04).
 * @see docs/EXTERNAL_APIS.md §4 / G-04 · docs/DATA_MODEL.md §6.3
 */

type CountryCatalogueEntry = ResolvedCountry;

/** Canonical catalogue: ISO2 primary identity + display name + upstream spelling. */
const COUNTRY_CATALOGUE: CountryCatalogueEntry[] = [
  { iso2: 'AF', name: 'Afghanistan', upstreamName: 'Afghanistan' },
  { iso2: 'AL', name: 'Albania', upstreamName: 'Albania' },
  { iso2: 'DZ', name: 'Algeria', upstreamName: 'Algeria' },
  { iso2: 'AD', name: 'Andorra', upstreamName: 'Andorra' },
  { iso2: 'AO', name: 'Angola', upstreamName: 'Angola' },
  {
    iso2: 'AG',
    name: 'Antigua and Barbuda',
    upstreamName: 'Antigua and Barbuda',
  },
  { iso2: 'AR', name: 'Argentina', upstreamName: 'Argentina' },
  { iso2: 'AM', name: 'Armenia', upstreamName: 'Armenia' },
  { iso2: 'AU', name: 'Australia', upstreamName: 'Australia' },
  { iso2: 'AT', name: 'Austria', upstreamName: 'Austria' },
  { iso2: 'AZ', name: 'Azerbaijan', upstreamName: 'Azerbaijan' },
  { iso2: 'BS', name: 'Bahamas', upstreamName: 'Bahamas' },
  { iso2: 'BH', name: 'Bahrain', upstreamName: 'Bahrain' },
  { iso2: 'BD', name: 'Bangladesh', upstreamName: 'Bangladesh' },
  { iso2: 'BB', name: 'Barbados', upstreamName: 'Barbados' },
  { iso2: 'BY', name: 'Belarus', upstreamName: 'Belarus' },
  { iso2: 'BE', name: 'Belgium', upstreamName: 'Belgium' },
  { iso2: 'BZ', name: 'Belize', upstreamName: 'Belize' },
  { iso2: 'BJ', name: 'Benin', upstreamName: 'Benin' },
  { iso2: 'BT', name: 'Bhutan', upstreamName: 'Bhutan' },
  { iso2: 'BO', name: 'Bolivia', upstreamName: 'Bolivia' },
  {
    iso2: 'BA',
    name: 'Bosnia and Herzegovina',
    upstreamName: 'Bosnia and Herzegovina',
  },
  { iso2: 'BW', name: 'Botswana', upstreamName: 'Botswana' },
  { iso2: 'BR', name: 'Brazil', upstreamName: 'Brazil' },
  { iso2: 'BN', name: 'Brunei', upstreamName: 'Brunei' },
  { iso2: 'BG', name: 'Bulgaria', upstreamName: 'Bulgaria' },
  { iso2: 'BF', name: 'Burkina Faso', upstreamName: 'Burkina Faso' },
  { iso2: 'MM', name: 'Myanmar', upstreamName: 'Burma' },
  { iso2: 'BI', name: 'Burundi', upstreamName: 'Burundi' },
  { iso2: 'CV', name: 'Cabo Verde', upstreamName: 'Cabo Verde' },
  { iso2: 'KH', name: 'Cambodia', upstreamName: 'Cambodia' },
  { iso2: 'CM', name: 'Cameroon', upstreamName: 'Cameroon' },
  { iso2: 'CA', name: 'Canada', upstreamName: 'Canada' },
  {
    iso2: 'CF',
    name: 'Central African Republic',
    upstreamName: 'Central African Republic',
  },
  { iso2: 'TD', name: 'Chad', upstreamName: 'Chad' },
  { iso2: 'CL', name: 'Chile', upstreamName: 'Chile' },
  { iso2: 'CN', name: 'China', upstreamName: 'China' },
  { iso2: 'CO', name: 'Colombia', upstreamName: 'Colombia' },
  { iso2: 'KM', name: 'Comoros', upstreamName: 'Comoros' },
  {
    iso2: 'CG',
    name: 'Republic of the Congo',
    upstreamName: 'Congo (Brazzaville)',
  },
  {
    iso2: 'CD',
    name: 'Democratic Republic of the Congo',
    upstreamName: 'Congo (Kinshasa)',
  },
  { iso2: 'CR', name: 'Costa Rica', upstreamName: 'Costa Rica' },
  { iso2: 'CI', name: "Cote d'Ivoire", upstreamName: "Cote d'Ivoire" },
  { iso2: 'HR', name: 'Croatia', upstreamName: 'Croatia' },
  { iso2: 'CU', name: 'Cuba', upstreamName: 'Cuba' },
  { iso2: 'CY', name: 'Cyprus', upstreamName: 'Cyprus' },
  { iso2: 'CZ', name: 'Czechia', upstreamName: 'Czechia' },
  { iso2: 'DK', name: 'Denmark', upstreamName: 'Denmark' },
  { iso2: 'DJ', name: 'Djibouti', upstreamName: 'Djibouti' },
  { iso2: 'DM', name: 'Dominica', upstreamName: 'Dominica' },
  {
    iso2: 'DO',
    name: 'Dominican Republic',
    upstreamName: 'Dominican Republic',
  },
  { iso2: 'EC', name: 'Ecuador', upstreamName: 'Ecuador' },
  { iso2: 'EG', name: 'Egypt', upstreamName: 'Egypt' },
  { iso2: 'SV', name: 'El Salvador', upstreamName: 'El Salvador' },
  {
    iso2: 'GQ',
    name: 'Equatorial Guinea',
    upstreamName: 'Equatorial Guinea',
  },
  { iso2: 'ER', name: 'Eritrea', upstreamName: 'Eritrea' },
  { iso2: 'EE', name: 'Estonia', upstreamName: 'Estonia' },
  { iso2: 'SZ', name: 'Eswatini', upstreamName: 'Eswatini' },
  { iso2: 'ET', name: 'Ethiopia', upstreamName: 'Ethiopia' },
  { iso2: 'FJ', name: 'Fiji', upstreamName: 'Fiji' },
  { iso2: 'FI', name: 'Finland', upstreamName: 'Finland' },
  { iso2: 'FR', name: 'France', upstreamName: 'France' },
  { iso2: 'GA', name: 'Gabon', upstreamName: 'Gabon' },
  { iso2: 'GM', name: 'Gambia', upstreamName: 'Gambia' },
  { iso2: 'GE', name: 'Georgia', upstreamName: 'Georgia' },
  { iso2: 'DE', name: 'Germany', upstreamName: 'Germany' },
  { iso2: 'GH', name: 'Ghana', upstreamName: 'Ghana' },
  { iso2: 'GR', name: 'Greece', upstreamName: 'Greece' },
  { iso2: 'GD', name: 'Grenada', upstreamName: 'Grenada' },
  { iso2: 'GT', name: 'Guatemala', upstreamName: 'Guatemala' },
  { iso2: 'GN', name: 'Guinea', upstreamName: 'Guinea' },
  { iso2: 'GW', name: 'Guinea-Bissau', upstreamName: 'Guinea-Bissau' },
  { iso2: 'GY', name: 'Guyana', upstreamName: 'Guyana' },
  { iso2: 'HT', name: 'Haiti', upstreamName: 'Haiti' },
  { iso2: 'VA', name: 'Holy See', upstreamName: 'Holy See' },
  { iso2: 'HN', name: 'Honduras', upstreamName: 'Honduras' },
  { iso2: 'HK', name: 'Hong Kong', upstreamName: 'Hong Kong' },
  { iso2: 'HU', name: 'Hungary', upstreamName: 'Hungary' },
  { iso2: 'IS', name: 'Iceland', upstreamName: 'Iceland' },
  { iso2: 'IN', name: 'India', upstreamName: 'India' },
  { iso2: 'ID', name: 'Indonesia', upstreamName: 'Indonesia' },
  { iso2: 'IR', name: 'Iran', upstreamName: 'Iran' },
  { iso2: 'IQ', name: 'Iraq', upstreamName: 'Iraq' },
  { iso2: 'IE', name: 'Ireland', upstreamName: 'Ireland' },
  { iso2: 'IL', name: 'Israel', upstreamName: 'Israel' },
  { iso2: 'IT', name: 'Italy', upstreamName: 'Italy' },
  { iso2: 'JM', name: 'Jamaica', upstreamName: 'Jamaica' },
  { iso2: 'JP', name: 'Japan', upstreamName: 'Japan' },
  { iso2: 'JO', name: 'Jordan', upstreamName: 'Jordan' },
  { iso2: 'KZ', name: 'Kazakhstan', upstreamName: 'Kazakhstan' },
  { iso2: 'KE', name: 'Kenya', upstreamName: 'Kenya' },
  { iso2: 'KI', name: 'Kiribati', upstreamName: 'Kiribati' },
  { iso2: 'KP', name: 'North Korea', upstreamName: 'Korea, North' },
  { iso2: 'XK', name: 'Kosovo', upstreamName: 'Kosovo' },
  { iso2: 'KW', name: 'Kuwait', upstreamName: 'Kuwait' },
  { iso2: 'KG', name: 'Kyrgyzstan', upstreamName: 'Kyrgyzstan' },
  { iso2: 'LA', name: 'Laos', upstreamName: 'Laos' },
  { iso2: 'LV', name: 'Latvia', upstreamName: 'Latvia' },
  { iso2: 'LB', name: 'Lebanon', upstreamName: 'Lebanon' },
  { iso2: 'LS', name: 'Lesotho', upstreamName: 'Lesotho' },
  { iso2: 'LR', name: 'Liberia', upstreamName: 'Liberia' },
  { iso2: 'LY', name: 'Libya', upstreamName: 'Libya' },
  { iso2: 'LI', name: 'Liechtenstein', upstreamName: 'Liechtenstein' },
  { iso2: 'LT', name: 'Lithuania', upstreamName: 'Lithuania' },
  { iso2: 'LU', name: 'Luxembourg', upstreamName: 'Luxembourg' },
  { iso2: 'MG', name: 'Madagascar', upstreamName: 'Madagascar' },
  { iso2: 'MW', name: 'Malawi', upstreamName: 'Malawi' },
  { iso2: 'MY', name: 'Malaysia', upstreamName: 'Malaysia' },
  { iso2: 'MV', name: 'Maldives', upstreamName: 'Maldives' },
  { iso2: 'ML', name: 'Mali', upstreamName: 'Mali' },
  { iso2: 'MT', name: 'Malta', upstreamName: 'Malta' },
  { iso2: 'MH', name: 'Marshall Islands', upstreamName: 'Marshall Islands' },
  { iso2: 'MR', name: 'Mauritania', upstreamName: 'Mauritania' },
  { iso2: 'MU', name: 'Mauritius', upstreamName: 'Mauritius' },
  { iso2: 'MX', name: 'Mexico', upstreamName: 'Mexico' },
  { iso2: 'FM', name: 'Micronesia', upstreamName: 'Micronesia' },
  { iso2: 'MD', name: 'Moldova', upstreamName: 'Moldova' },
  { iso2: 'MC', name: 'Monaco', upstreamName: 'Monaco' },
  { iso2: 'MN', name: 'Mongolia', upstreamName: 'Mongolia' },
  { iso2: 'ME', name: 'Montenegro', upstreamName: 'Montenegro' },
  { iso2: 'MA', name: 'Morocco', upstreamName: 'Morocco' },
  { iso2: 'MZ', name: 'Mozambique', upstreamName: 'Mozambique' },
  { iso2: 'MM', name: 'Myanmar', upstreamName: 'Myanmar' },
  { iso2: 'NA', name: 'Namibia', upstreamName: 'Namibia' },
  { iso2: 'NR', name: 'Nauru', upstreamName: 'Nauru' },
  { iso2: 'NP', name: 'Nepal', upstreamName: 'Nepal' },
  { iso2: 'NL', name: 'Netherlands', upstreamName: 'Netherlands' },
  { iso2: 'NZ', name: 'New Zealand', upstreamName: 'New Zealand' },
  { iso2: 'NI', name: 'Nicaragua', upstreamName: 'Nicaragua' },
  { iso2: 'NE', name: 'Niger', upstreamName: 'Niger' },
  { iso2: 'NG', name: 'Nigeria', upstreamName: 'Nigeria' },
  { iso2: 'MK', name: 'North Macedonia', upstreamName: 'North Macedonia' },
  { iso2: 'NO', name: 'Norway', upstreamName: 'Norway' },
  { iso2: 'OM', name: 'Oman', upstreamName: 'Oman' },
  { iso2: 'PK', name: 'Pakistan', upstreamName: 'Pakistan' },
  { iso2: 'PW', name: 'Palau', upstreamName: 'Palau' },
  { iso2: 'PA', name: 'Panama', upstreamName: 'Panama' },
  {
    iso2: 'PG',
    name: 'Papua New Guinea',
    upstreamName: 'Papua New Guinea',
  },
  { iso2: 'PY', name: 'Paraguay', upstreamName: 'Paraguay' },
  { iso2: 'PE', name: 'Peru', upstreamName: 'Peru' },
  { iso2: 'PH', name: 'Philippines', upstreamName: 'Philippines' },
  { iso2: 'PL', name: 'Poland', upstreamName: 'Poland' },
  { iso2: 'PT', name: 'Portugal', upstreamName: 'Portugal' },
  {
    iso2: 'PS',
    name: 'Palestine',
    upstreamName: 'West Bank and Gaza',
  },
  { iso2: 'QA', name: 'Qatar', upstreamName: 'Qatar' },
  { iso2: 'RO', name: 'Romania', upstreamName: 'Romania' },
  { iso2: 'RU', name: 'Russia', upstreamName: 'Russia' },
  { iso2: 'RW', name: 'Rwanda', upstreamName: 'Rwanda' },
  {
    iso2: 'KN',
    name: 'Saint Kitts and Nevis',
    upstreamName: 'Saint Kitts and Nevis',
  },
  { iso2: 'LC', name: 'Saint Lucia', upstreamName: 'Saint Lucia' },
  {
    iso2: 'VC',
    name: 'Saint Vincent and the Grenadines',
    upstreamName: 'Saint Vincent and the Grenadines',
  },
  { iso2: 'WS', name: 'Samoa', upstreamName: 'Samoa' },
  { iso2: 'SM', name: 'San Marino', upstreamName: 'San Marino' },
  {
    iso2: 'ST',
    name: 'Sao Tome and Principe',
    upstreamName: 'Sao Tome and Principe',
  },
  { iso2: 'SA', name: 'Saudi Arabia', upstreamName: 'Saudi Arabia' },
  { iso2: 'SN', name: 'Senegal', upstreamName: 'Senegal' },
  { iso2: 'RS', name: 'Serbia', upstreamName: 'Serbia' },
  { iso2: 'SC', name: 'Seychelles', upstreamName: 'Seychelles' },
  { iso2: 'SL', name: 'Sierra Leone', upstreamName: 'Sierra Leone' },
  { iso2: 'SG', name: 'Singapore', upstreamName: 'Singapore' },
  { iso2: 'SK', name: 'Slovakia', upstreamName: 'Slovakia' },
  { iso2: 'SI', name: 'Slovenia', upstreamName: 'Slovenia' },
  { iso2: 'SB', name: 'Solomon Islands', upstreamName: 'Solomon Islands' },
  { iso2: 'SO', name: 'Somalia', upstreamName: 'Somalia' },
  { iso2: 'ZA', name: 'South Africa', upstreamName: 'South Africa' },
  { iso2: 'KR', name: 'South Korea', upstreamName: 'South Korea' },
  { iso2: 'SS', name: 'South Sudan', upstreamName: 'South Sudan' },
  { iso2: 'ES', name: 'Spain', upstreamName: 'Spain' },
  { iso2: 'LK', name: 'Sri Lanka', upstreamName: 'Sri Lanka' },
  { iso2: 'SD', name: 'Sudan', upstreamName: 'Sudan' },
  { iso2: 'SR', name: 'Suriname', upstreamName: 'Suriname' },
  { iso2: 'SE', name: 'Sweden', upstreamName: 'Sweden' },
  { iso2: 'CH', name: 'Switzerland', upstreamName: 'Switzerland' },
  { iso2: 'SY', name: 'Syria', upstreamName: 'Syria' },
  { iso2: 'TW', name: 'Taiwan', upstreamName: 'Taiwan' },
  { iso2: 'TJ', name: 'Tajikistan', upstreamName: 'Tajikistan' },
  { iso2: 'TZ', name: 'Tanzania', upstreamName: 'Tanzania' },
  { iso2: 'TH', name: 'Thailand', upstreamName: 'Thailand' },
  { iso2: 'TL', name: 'Timor-Leste', upstreamName: 'Timor-Leste' },
  { iso2: 'TG', name: 'Togo', upstreamName: 'Togo' },
  { iso2: 'TO', name: 'Tonga', upstreamName: 'Tonga' },
  {
    iso2: 'TT',
    name: 'Trinidad and Tobago',
    upstreamName: 'Trinidad and Tobago',
  },
  { iso2: 'TN', name: 'Tunisia', upstreamName: 'Tunisia' },
  { iso2: 'TR', name: 'Turkey', upstreamName: 'Turkey' },
  { iso2: 'TV', name: 'Tuvalu', upstreamName: 'Tuvalu' },
  { iso2: 'UG', name: 'Uganda', upstreamName: 'Uganda' },
  { iso2: 'UA', name: 'Ukraine', upstreamName: 'Ukraine' },
  {
    iso2: 'AE',
    name: 'United Arab Emirates',
    upstreamName: 'United Arab Emirates',
  },
  { iso2: 'GB', name: 'United Kingdom', upstreamName: 'United Kingdom' },
  { iso2: 'US', name: 'United States', upstreamName: 'United States' },
  { iso2: 'UY', name: 'Uruguay', upstreamName: 'Uruguay' },
  { iso2: 'UZ', name: 'Uzbekistan', upstreamName: 'Uzbekistan' },
  { iso2: 'VU', name: 'Vanuatu', upstreamName: 'Vanuatu' },
  { iso2: 'VE', name: 'Venezuela', upstreamName: 'Venezuela' },
  { iso2: 'VN', name: 'Vietnam', upstreamName: 'Vietnam' },
  { iso2: 'YE', name: 'Yemen', upstreamName: 'Yemen' },
  { iso2: 'ZM', name: 'Zambia', upstreamName: 'Zambia' },
  { iso2: 'ZW', name: 'Zimbabwe', upstreamName: 'Zimbabwe' },
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
  burma: 'Burma',
  myanmar: 'Burma',
  'ivory coast': "Cote d'Ivoire",
  "côte d'ivoire": "Cote d'Ivoire",
  swaziland: 'Eswatini',
  'north korea': 'Korea, North',
  'democratic republic of the congo': 'Congo (Kinshasa)',
  'republic of the congo': 'Congo (Brazzaville)',
  'dr congo': 'Congo (Kinshasa)',
  'palestine': 'West Bank and Gaza',
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
 * Non-sovereign labels (cruise ships, Olympic teams) are intentionally omitted.
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
  return [...new Set(COUNTRY_CATALOGUE.map((entry) => entry.iso2))];
}
