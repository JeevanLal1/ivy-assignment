/**
 * Browser-safe verified analytics and findings from the Ivy Homes Take-Home audit.
 * Sourced directly from verified submission data and analysis runner outputs.
 */

export const MARKET_KPIS = {
  totalListings: {
    value: 3800,
    formatted: '3,800',
    label: 'Total Listing Records',
    context: 'Full retrievable catalog across 5 portals in Pune',
    tag: 'Catalog'
  },
  uniqueProperties: {
    value: 3230,
    formatted: '3,230',
    label: 'Unique Physical Properties',
    context: 'Deduped clusters after resolving cross-portal duplicate listings',
    tag: 'Deduplicated'
  },
  activeListings: {
    value: 2998,
    formatted: '2,998',
    label: 'Active Listings',
    context: '78.9% of catalog currently verified live and available',
    tag: 'Live Inventory'
  },
  corruptListings: {
    value: 28,
    formatted: '28',
    label: 'Corrupt / Impossible',
    context: 'Physical impossibilities: negative price, floor overflow, flipped coords',
    tag: 'Data Quality',
    highlight: 'text-rose-600'
  },
  fakeListings: {
    value: 205,
    formatted: '205',
    label: 'Syndicate / Fake Listings',
    context: 'Coordinated 7-broker syndicate undercutting market rates by ~47%',
    tag: 'Fraud Detection',
    highlight: 'text-amber-600'
  },
  projectMismatch: {
    value: 95,
    formatted: '95',
    label: 'Project Count Mismatches',
    context: 'Discrepancy between reported total_listings and live linked units',
    tag: 'Registry Audit',
    highlight: 'text-indigo-600'
  },
  recentListings: {
    value: 128,
    formatted: '128',
    label: 'Listings in Last 7 Days',
    context: 'Posted strictly between Sep 3 and Sep 10, 2026 (IST)',
    tag: 'Recent Velocity'
  },
  avgPricePerSqft2BHK: {
    value: 10859.27,
    formatted: '₹10,859.27',
    unit: '/sqft',
    label: 'Avg 2BHK Price / sqft',
    context: 'Arithmetic mean across 889 legitimate 2BHK listings (corrupt/fake excluded)',
    tag: 'Market Pricing'
  },
  magarpattaRent: {
    value: 4855700,
    formatted: '₹48,55,700',
    unit: '/mo',
    label: 'Magarpatta Monthly Rent',
    context: 'Total monthly rental volume across 130 rental properties in Magarpatta',
    tag: 'Rental Volume'
  },
  costliestProject: {
    projectId: 'P30288',
    priceMaxInr: 44700000,
    formattedPrice: '₹4.47 Cr',
    label: 'Costliest Project',
    context: 'Project P30288 in Pune with peak normalized price of ₹4,47,00,000',
    tag: 'Peak Value'
  }
};

export const CORRUPT_BREAKDOWN = [
  {
    category: 'Negative Price',
    count: 7,
    percentage: 25,
    rule: 'price < 0',
    description: 'Impossible negative pricing (e.g. -₹45,00,000) indicating sign-bit inversion.',
    color: 'bg-rose-500'
  },
  {
    category: 'Floor > Total Floors',
    count: 7,
    percentage: 25,
    rule: 'floor > total_floors',
    description: 'Units placed on floors exceeding the structural building height (e.g. floor 15 of 10).',
    color: 'bg-amber-500'
  },
  {
    category: 'Super Built-up < Carpet',
    count: 7,
    percentage: 25,
    rule: 'super_area < carpet_area',
    description: 'Geometric impossibility where gross area is smaller than usable carpet area.',
    color: 'bg-violet-500'
  },
  {
    category: 'Swapped Coordinates',
    count: 7,
    percentage: 25,
    rule: 'latitude / longitude inverted',
    description: 'Coordinates transposed (e.g. Lat ~73°E, Lng ~18°N) placing properties into the Indian Ocean.',
    color: 'bg-sky-500'
  }
];

export const PROJECT_AUDIT_BREAKDOWN = [
  {
    category: 'Phantom Over-Reported',
    count: 48,
    percentage: 50.5,
    description: 'Projects reporting significantly more listings than currently live in the registry.',
    badge: 'Over-reported',
    color: 'bg-amber-500'
  },
  {
    category: 'Stale Zero Counts',
    count: 41,
    percentage: 43.2,
    description: 'Projects reporting total_listings: 0 despite active verified inventory linked to them.',
    badge: 'Stale 0',
    color: 'bg-rose-500'
  },
  {
    category: 'Under-Reported Counts',
    count: 6,
    percentage: 6.3,
    description: 'Projects reporting fewer units than actually active in the live portal.',
    badge: 'Under-reported',
    color: 'bg-indigo-500'
  }
];

export const SYNDICATE_DATA = {
  totalListings: 205,
  scamPhraseEvidence: 110,
  corroboratingListings: 95,
  burnerPhoneCount: 7,
  burnerPhones: [
    '+912061298414',
    '+912068962253',
    '+912068177582',
    '+912062635959',
    '+912061596767',
    '+912066803273',
    '+912063854728'
  ],
  fictitiousAgencies: [
    'Elite Properties',
    'Orbit Estates',
    'Metro Realtors',
    'Nexus Properties',
    'Prime Realty Pune'
  ],
  avgUndercutPercent: 47,
  syndicateAvgPriceSqft: 5595,
  marketAvgPriceSqft: 10645,
  finding16Wording:
    '205 listings belong to a coordinated 7-broker syndicate, supported by shared contact numbers, repeated fictitious identities, copied inventory, systematic price undercutting, and corroborating scam-language evidence in 110 records.'
};

export const CONFIRMED_FINDINGS = [
  {
    id: 1,
    title: 'API Key Header Mandate',
    category: 'Authentication',
    icon: '🔑',
    documented: 'GET /v1/listings?api_key=...',
    actual: 'Must use X-API-Key HTTP header. Query parameter returns 401 Unauthorized.',
    impact: 'All API requests require custom header injection.'
  },
  {
    id: 2,
    title: 'Bearer Token Enforced on Listings',
    category: 'Authentication',
    icon: '🛡️',
    documented: 'API key alone grants catalog access.',
    actual: 'GET /v1/listings requires Authorization: Bearer <token> after login.',
    impact: 'Unauthenticated users cannot browse listings.'
  },
  {
    id: 3,
    title: '15-Minute Token Expiry & Refresh Flow',
    category: 'Authentication',
    icon: '⏳',
    documented: '24-hour token validity with no refresh flow.',
    actual: 'Tokens expire after 900 seconds (15 min) with active POST /auth/refresh endpoint.',
    impact: 'Client implements automatic proactive token refresh.'
  },
  {
    id: 4,
    title: 'Plural Endpoint for Listing Details',
    category: 'Routing',
    icon: '🔗',
    documented: 'GET /v1/listing/{id} (singular)',
    actual: 'Singular route returns 404. Working route is GET /v1/listings/{id} (plural).',
    impact: 'Listing detail views routed to plural endpoint.'
  },
  {
    id: 5,
    title: 'Similar Listings Computed Client-Side',
    category: 'Recommendation',
    icon: '🎯',
    documented: 'GET /v1/listings/{id}/similar',
    actual: 'Returns 404 Not Found.',
    impact: 'Similarity score calculated client-side by locality, BHK, and price proximity.'
  },
  {
    id: 6,
    title: 'Saved Listings at /v1/saved',
    category: 'State',
    icon: '❤️',
    documented: 'GET / POST / DELETE /v1/favourites',
    actual: 'Favourites routes return 404. Working endpoint is /v1/saved with { listing_id } payload.',
    impact: 'Full saved shortlist workflow integrated with /v1/saved.'
  },
  {
    id: 7,
    title: 'Analytics Summary Endpoint Unavailable',
    category: 'Analytics',
    icon: '📊',
    documented: 'Pre-computed summary at GET /v1/analytics/summary',
    actual: 'Returns 404 Not Found.',
    impact: 'Insights dashboard calculates and surfaces validated metrics deterministically.'
  },
  {
    id: 8,
    title: 'Strict Offset Pagination (limit ≤ 50)',
    category: 'Data Access',
    icon: '📑',
    documented: 'Page-based pagination (?page=1)',
    actual: 'page parameter is rejected. Must use offset and limit (max 50).',
    impact: 'All collection fetchers use deterministic offset stepping.'
  },
  {
    id: 9,
    title: 'Server Total Under-reports Catalog',
    category: 'Data Integrity',
    icon: '📦',
    documented: 'Server total claims exact record count.',
    actual: 'API initial response reports total ~1,000, but pagination retrieves all 3,800 records.',
    impact: 'Pagination relies on has_more and offset rather than server total.'
  },
  {
    id: 10,
    title: 'Project Price Unit Encoding (Cr vs Lakhs)',
    category: 'Normalization',
    icon: '💰',
    documented: 'Unified price representation.',
    actual: 'Values < 10 represent Crores (×10^7 INR); values ≥ 10 represent Lakhs (×10^5 INR).',
    impact: 'Normalized project prices into standardized Indian Rupees.'
  },
  {
    id: 11,
    title: 'MagicHomes Carpet Area Normalization',
    category: 'Normalization',
    icon: '📐',
    documented: 'All carpet areas in square feet.',
    actual: 'MagicHomes records with area < 300 are recorded in square meters (×10.7639 for sqft).',
    impact: 'Prevents massive unit distortion when comparing properties.'
  },
  {
    id: 12,
    title: 'Rental Deposit Multiplier Encoding',
    category: 'Normalization',
    icon: '🏦',
    documented: 'Deposit recorded directly in INR.',
    actual: 'Values between 2 and 10 represent monthly rent multipliers (e.g. 3 = 3× rent).',
    impact: 'Normalizes deposit calculation to avoid displaying ₹3 as total deposit.'
  },
  {
    id: 13,
    title: 'Local IST Timestamps',
    category: 'Date & Time',
    icon: '🕒',
    documented: 'Standard ISO timestamps.',
    actual: 'Timestamps without timezone designators are local Indian Standard Time (UTC+05:30).',
    impact: 'Strict 7-day interval window accurately anchored to IST.'
  },
  {
    id: 14,
    title: 'Project Count Inconsistencies (95 projects)',
    category: 'Audit',
    icon: '⚠️',
    documented: 'total_listings reflects active units.',
    actual: '95 projects diverge (41 stale zeroes, 48 phantom over-counts, 6 under-counts).',
    impact: 'Reported counts flagged clearly in UI without altering source numbers.'
  },
  {
    id: 15,
    title: '28 Physically Impossible Listings',
    category: 'Audit',
    icon: '🚫',
    documented: 'Clean verified portal listings.',
    actual: '28 records violate physical laws (7 negative price, 7 floor overflow, 7 super < carpet, 7 ocean coords).',
    impact: 'Defensibly segregated from market pricing metrics.'
  },
  {
    id: 16,
    title: '205-Listing Syndicate Lead Gen Network',
    category: 'Security',
    icon: '🚨',
    documented: 'Individual independent verified sellers.',
    actual: 'Coordinated syndicate across 7 burner phones systematically undercutting market by 47%.',
    impact: 'Isolated to prevent skewing legitimate market averages.'
  }
];
