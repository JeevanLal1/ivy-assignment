import { normalizeArea, normalizeProjectPrice, normalizeRentalDeposit } from '../../../shared/normalize.mjs';

/**
 * Formats numeric price into standard Indian currency representation.
 * 
 * @param {number} price - Amount in INR
 * @returns {string} Formatted price (e.g. "₹85.50 L" or "₹1.45 Cr")
 */
export function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return '₹0';
  }
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Formats monthly rent into standard representation (e.g. "₹25,000/mo").
 * 
 * @param {number} rent - Monthly rent in INR
 * @returns {string}
 */
export function formatRentalRent(rent) {
  if (typeof rent !== 'number' || isNaN(rent) || rent <= 0) {
    return '₹0/mo';
  }
  return `₹${rent.toLocaleString('en-IN')}/mo`;
}

/**
 * Normalizes rental deposit (handling 2-10 month multipliers vs direct INR).
 * 
 * @param {number} deposit - Raw deposit value
 * @param {number} monthlyRent - Monthly rent in INR
 * @returns {{ amount: number, label: string, isMultiplier: boolean, multiplier: number }}
 */
export function formatRentalDeposit(deposit, monthlyRent = 0) {
  const normalized = normalizeRentalDeposit(deposit, monthlyRent);
  const isMultiplier = typeof deposit === 'number' && deposit > 0 && deposit <= 10;
  
  let label = '₹0';
  if (normalized >= 100000) {
    label = formatPrice(normalized);
  } else if (normalized > 0) {
    label = `₹${normalized.toLocaleString('en-IN')}`;
  }

  return {
    amount: normalized,
    label,
    isMultiplier,
    multiplier: isMultiplier ? deposit : 0,
  };
}

/**
 * Normalizes and formats raw project prices (< 10 -> Cr, >= 10 -> Lakhs).
 * 
 * @param {number} rawPrice
 * @returns {string}
 */
export function formatProjectPrice(rawPrice) {
  const inr = normalizeProjectPrice(rawPrice);
  return formatPrice(inr);
}

/**
 * Formats a project's price range into readable INR representation.
 * 
 * @param {number} minRaw - price_min
 * @param {number} maxRaw - price_max
 * @returns {string} e.g. "₹80.00 L - ₹3.22 Cr"
 */
export function formatProjectPriceRange(minRaw, maxRaw) {
  const minInr = normalizeProjectPrice(minRaw);
  const maxInr = normalizeProjectPrice(maxRaw);

  if (minInr <= 0 && maxInr <= 0) return 'Price on Request';
  if (minInr <= 0) return `Up to ${formatPrice(maxInr)}`;
  if (maxInr <= 0) return `From ${formatPrice(minInr)}`;
  if (minInr === maxInr) return formatPrice(minInr);

  // If min is higher than max due to source recording inversion, ensure proper order
  const lower = Math.min(minInr, maxInr);
  const higher = Math.max(minInr, maxInr);
  return `${formatPrice(lower)} – ${formatPrice(higher)}`;
}

/**
 * Normalizes and formats carpet area in sqft.
 * Applies MagicHomes < 300 sqm conversion rule.
 * 
 * @param {number} area - Raw carpet area
 * @param {string} [website] - Listing website source
 * @returns {{ sqft: number, label: string, wasConverted: boolean }}
 */
export function formatArea(area, website = '') {
  if (typeof area !== 'number' || isNaN(area) || area <= 0) {
    return { sqft: 0, label: '0 sqft', wasConverted: false };
  }
  const wasConverted = website === 'magichomes' && area < 300;
  const sqft = normalizeArea(area, website);
  return {
    sqft,
    label: `${sqft.toLocaleString('en-IN')} sqft`,
    wasConverted
  };
}

/**
 * Cleanly capitalizes a string (e.g. "viman nagar" -> "Viman Nagar").
 */
export function formatTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns a human-friendly portal display name.
 */
export function formatPortalName(website) {
  const map = {
    dwelling: 'Dwelling',
    magichomes: 'MagicHomes',
    squareyards: 'SquareYards',
    '100acres': '100Acres',
    zerobroker: 'ZeroBroker'
  };
  return map[website?.toLowerCase()] || formatTitleCase(website) || 'Portal';
}
