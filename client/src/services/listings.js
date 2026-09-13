import { apiRequest } from './api.js';

export const listingsService = {
  /**
   * Fetch listings with offset pagination and working server filters.
   * 
   * @param {object} params
   * @param {number} [params.offset=0]
   * @param {number} [params.limit=50]
   * @param {string} [params.locality]
   * @param {number|string} [params.bhk]
   * @param {string} [params.property_type]
   * @param {string} [params.furnishing]
   * @returns {Promise<{ results: Array<object>, total: number, count: number, offset: number, limit: number, has_more: boolean }>}
   */
  async getListings({ offset = 0, limit = 50, locality, bhk, property_type, furnishing } = {}) {
    const query = {
      offset: Math.max(0, Number(offset) || 0),
      limit: Math.min(Math.max(1, Number(limit) || 50), 50),
    };

    if (locality) query.locality = locality.toLowerCase().trim();
    if (bhk !== undefined && bhk !== '' && bhk !== 'all') query.bhk = bhk;
    if (property_type && property_type !== 'all') query.property_type = property_type;
    if (furnishing && furnishing !== 'all') query.furnishing = furnishing;

    const queryParams = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null && val !== '') {
        queryParams.append(key, String(val));
      }
    }

    return apiRequest(`/v1/listings?${queryParams.toString()}`, { method: 'GET' });
  },

  /**
   * Fetch single listing by ID.
   * Correct working endpoint: GET /v1/listings/{id} (plural)
   * 
   * @param {string} id - Listing ID
   * @returns {Promise<object>}
   */
  async getListingById(id) {
    if (!id) throw new Error('Listing ID is required');
    return apiRequest(`/v1/listings/${id}`, { method: 'GET' });
  }
};
