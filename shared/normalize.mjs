/**
 * Normalizes project price values to INR.
 * - If value < 10: expressed in Crores (1 Cr = 10,000,000 INR)
 * - If value >= 10: expressed in Lakhs (1 Lakh = 100,000 INR)
 *
 * @param {number} val - Raw project price value
 * @returns {number} Price in INR
 */
export function normalizeProjectPrice(val) {
  if (typeof val !== 'number' || isNaN(val) || val <= 0) {
    return 0;
  }
  if (val < 10) {
    return Math.round(val * 1e7);
  }
  return Math.round(val * 1e5);
}

/**
 * Normalizes area values to square feet.
 * - If website is 'magichomes' and area < 300: recorded in square meters (1 sqm = 10.7639 sqft)
 * - Otherwise: already in square feet
 *
 * @param {number} area - Raw area value
 * @param {string} [website] - Listing website source
 * @returns {number} Area in square feet
 */
export function normalizeArea(area, website = '') {
  if (typeof area !== 'number' || isNaN(area) || area <= 0) {
    return 0;
  }
  if (website === 'magichomes' && area < 300) {
    return Math.round(area * 10.7639);
  }
  return area;
}

/**
 * Normalizes rental deposit to INR.
 * - If deposit <= 10: expressed as number of months of rent
 * - If deposit > 10: expressed directly in INR
 *
 * @param {number} deposit - Raw deposit value
 * @param {number} monthlyRent - Normalized monthly rent in INR
 * @returns {number} Deposit in INR
 */
export function normalizeRentalDeposit(deposit, monthlyRent = 0) {
  if (typeof deposit !== 'number' || isNaN(deposit) || deposit <= 0) {
    return 0;
  }
  if (deposit <= 10) {
    return Math.round(deposit * monthlyRent);
  }
  return deposit;
}
