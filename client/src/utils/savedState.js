/**
 * Utility functions for synchronized saved listings state.
 * Encapsulates ID extraction, membership check, and optimistic updates.
 */

/**
 * Extract a Set of unique string IDs from saved listings.
 * Handles both `listing_id` and `id` properties.
 * 
 * @param {Array<object>} listings
 * @returns {Set<string>}
 */
export function extractSavedIds(listings) {
  if (!Array.isArray(listings)) return new Set();
  const ids = new Set();
  for (const item of listings) {
    const id = item?.listing_id || item?.id;
    if (id) ids.add(String(id));
  }
  return ids;
}

/**
 * Check if a listing ID is in the saved IDs set.
 * 
 * @param {Set<string>} savedIds
 * @param {string} listingId
 * @returns {boolean}
 */
export function isListingSaved(savedIds, listingId) {
  if (!savedIds || !listingId) return false;
  return savedIds.has(String(listingId));
}

/**
 * Optimistically add an item to the saved listings array and update count and IDs.
 * Deduplicates by listing ID and places newly saved items first.
 * 
 * @param {Array<object>} currentListings
 * @param {object|string} itemToAdd
 * @returns {{ listings: Array<object>, count: number, ids: Set<string> }}
 */
export function optimisticAddSaved(currentListings, itemToAdd) {
  const listings = Array.isArray(currentListings) ? [...currentListings] : [];
  const id = itemToAdd?.listing_id || itemToAdd?.id || (typeof itemToAdd === 'string' ? itemToAdd : null);
  if (!id) {
    return { listings, count: listings.length, ids: extractSavedIds(listings) };
  }

  const strId = String(id);
  const exists = listings.some((l) => String(l.listing_id || l.id) === strId);
  if (!exists) {
    const normalizedItem = typeof itemToAdd === 'object' && itemToAdd !== null
      ? itemToAdd
      : { listing_id: strId };
    listings.unshift(normalizedItem);
  }

  return {
    listings,
    count: listings.length,
    ids: extractSavedIds(listings),
  };
}

/**
 * Optimistically remove an item from the saved listings array by ID.
 * 
 * @param {Array<object>} currentListings
 * @param {string} listingId
 * @returns {{ listings: Array<object>, count: number, ids: Set<string> }}
 */
export function optimisticRemoveSaved(currentListings, listingId) {
  const targetId = String(listingId || '');
  const listings = Array.isArray(currentListings)
    ? currentListings.filter((l) => String(l.listing_id || l.id) !== targetId)
    : [];

  return {
    listings,
    count: listings.length,
    ids: extractSavedIds(listings),
  };
}
