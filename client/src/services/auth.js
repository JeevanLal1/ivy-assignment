import { apiRequest, setStoredAuth, clearStoredAuth, getStoredAuth } from './api.js';

export const authService = {
  /**
   * Login with email and password against POST /auth/login.
   */
  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    }, false);

    setStoredAuth({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 900,
      user: data.user,
    });

    return data;
  },

  /**
   * Logout user and clear local session state.
   */
  logout() {
    clearStoredAuth();
  },

  /**
   * Get current stored auth state.
   */
  getCurrentUser() {
    const { user, accessToken } = getStoredAuth();
    return accessToken ? user : null;
  },

  /**
   * Check if an active session exists.
   */
  isAuthenticated() {
    const { accessToken, refreshToken } = getStoredAuth();
    return Boolean(accessToken || refreshToken);
  }
};
