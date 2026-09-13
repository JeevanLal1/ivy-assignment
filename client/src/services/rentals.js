import { apiRequest } from './api.js';

export const rentalsService = {
  /**
   * Fetch rentals with offset pagination.
   * GET /v1/rentals?offset=0&limit=50
   * 
   * @param {object} params
   * @param {number} [params.offset=0]
   * @param {number} [params.limit=50]
   * @param {string} [params.locality]
   * @param {number|string} [params.bedroom]
   * @returns {Promise<{ results: Array<object>, total: number, count: number, offset: number, limit: number, has_more: boolean }>}
   */
  async getRentals({ offset = 0, limit = 50, locality, bedroom } = {}) {
    const query = {
      offset: Math.max(0, Number(offset) || 0),
      limit: Math.min(Math.max(1, Number(limit) || 50), 50),
    };

    if (locality) query.locality = locality.toLowerCase().trim();
    if (bedroom !== undefined && bedroom !== '' && bedroom !== 'all') query.bedroom = bedroom;

    const queryParams = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null && val !== '') {
        queryParams.append(key, String(val));
      }
    }

    const endpoint = queryParams.toString() ? `/v1/rentals?${queryParams.toString()}` : '/v1/rentals';
    return apiRequest(endpoint, { method: 'GET' });
  },

  /**
   * Fetch single rental by ID.
   * GET /v1/rentals/{id}
   */
  async getRentalById(id) {
    if (!id) throw new Error('Rental ID is required');
    return apiRequest(`/v1/rentals/${id}`, { method: 'GET' });
  }
};
