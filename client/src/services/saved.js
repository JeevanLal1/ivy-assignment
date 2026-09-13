import { apiRequest } from './api.js';

export const savedService = {
  /**
   * Fetch all saved listings with count and results.
   * GET /v1/saved -> returns { count, results }
   * 
   * @returns {Promise<{ count: number, results: Array<object> }>}
   */
  async getSaved() {
    const data = await apiRequest('/v1/saved', { method: 'GET' });
    return {
      count: typeof data?.count === 'number' ? data.count : (data?.results?.length || 0),
      results: Array.isArray(data?.results) ? data.results : [],
    };
  },

  /**
   * Fetch all saved listings for the authenticated user.
   * Backwards-compatible helper returning results array directly.
   * 
   * @returns {Promise<Array<object>>}
   */
  async getSavedListings() {
    const data = await this.getSaved();
    return data.results;
  },

  /**
   * Save a listing to the user's saved list.
   * POST /v1/saved -> requires body: { listing_id }
   * 
   * @param {string} listingId - Valid listing ID
   * @returns {Promise<{ ok: boolean, listing_id: string, saved_count: number }>}
   */
  async saveListing(listingId) {
    if (!listingId) throw new Error('listingId is required');
    return apiRequest('/v1/saved', {
      method: 'POST',
      body: { listing_id: listingId },
    });
  },

  /**
   * Remove a listing from the user's saved list.
   * DELETE /v1/saved/{listingId}
   * 
   * @param {string} listingId - Listing ID to remove
   * @returns {Promise<{ ok: boolean, listing_id: string, saved_count: number }>}
   */
  async removeListing(listingId) {
    if (!listingId) throw new Error('listingId is required');
    return apiRequest(`/v1/saved/${listingId}`, {
      method: 'DELETE',
    });
  },
};
