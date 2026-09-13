import { apiRequest } from './api.js';

export const projectsService = {
  /**
   * Fetch projects with offset pagination.
   * GET /v1/projects?offset=0&limit=50
   * 
   * @param {object} params
   * @param {number} [params.offset=0]
   * @param {number} [params.limit=50]
   * @param {string} [params.locality]
   * @returns {Promise<{ results: Array<object>, total: number, count: number, offset: number, limit: number, has_more: boolean }>}
   */
  async getProjects({ offset = 0, limit = 50, locality } = {}) {
    const query = {
      offset: Math.max(0, Number(offset) || 0),
      limit: Math.min(Math.max(1, Number(limit) || 50), 50),
    };

    if (locality) query.locality = locality.toLowerCase().trim();

    const queryParams = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null && val !== '') {
        queryParams.append(key, String(val));
      }
    }

    const endpoint = queryParams.toString() ? `/v1/projects?${queryParams.toString()}` : '/v1/projects';
    return apiRequest(endpoint, { method: 'GET' });
  },

  /**
   * Fetch single project by ID.
   * GET /v1/projects/{id}
   */
  async getProjectById(id) {
    if (!id) throw new Error('Project ID is required');
    return apiRequest(`/v1/projects/${id}`, { method: 'GET' });
  }
};
