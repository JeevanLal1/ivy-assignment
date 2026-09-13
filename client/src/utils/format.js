import { normalizeArea } from '../../../shared/normalize.mjs';

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
