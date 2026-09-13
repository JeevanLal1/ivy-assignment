/**
 * Centralized API client for Ivy Homes.
 * Enforces X-API-Key header, Bearer authorization, proactive token refresh,
 * and 401 retry with refresh lock to prevent concurrent refresh loops.
 */

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (typeof process !== 'undefined' && process.env?.BASE_URL) || 'https://solve.ivy.homes';
const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) || (typeof process !== 'undefined' && (process.env?.VITE_API_KEY || process.env?.API_KEY)) || '';

const TOKEN_KEY = 'ivy_access_token';
const REFRESH_KEY = 'ivy_refresh_token';
const EXPIRES_KEY = 'ivy_token_expires_at';
const USER_KEY = 'ivy_user';

export function getStoredAuth() {
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY)) || 0;
  let user = null;
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    if (rawUser) user = JSON.parse(rawUser);
  } catch (e) {
    console.error('Failed to parse stored user:', e);
  }
  return { accessToken, refreshToken, expiresAt, user };
}

export function setStoredAuth({ accessToken, refreshToken, expiresIn, user }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  }
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(USER_KEY);
}

// Single active refresh promise to prevent concurrent refresh calls
let activeRefreshPromise = null;

/**
 * Calls POST /auth/refresh using the stored refresh_token.
 */
export async function refreshAccessToken() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const { refreshToken } = getStoredAuth();
  if (!refreshToken) {
    clearStoredAuth();
    throw new Error('No refresh token available');
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearStoredAuth();
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to refresh token');
      }

      const data = await res.json();
      setStoredAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in || 900,
        user: data.user,
      });
      return data.access_token;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Universal request helper for Ivy Homes API.
 * 
 * @param {string} endpoint - e.g. '/v1/listings' or '/auth/login'
 * @param {RequestInit} [options={}]
 * @param {boolean} [requiresAuth=true]
 * @param {boolean} [retryOn401=true]
 */
export async function apiRequest(endpoint, options = {}, requiresAuth = true, retryOn401 = true) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Always send the API key header
  headers.set('X-API-Key', API_KEY);

  if (requiresAuth) {
    let { accessToken, expiresAt, refreshToken } = getStoredAuth();

    // Proactive refresh: if expiring within 60 seconds and refresh token exists
    if (refreshToken && expiresAt && Date.now() > (expiresAt - 60000)) {
      try {
        accessToken = await refreshAccessToken();
      } catch (err) {
        console.warn('Proactive token refresh failed:', err.message);
      }
    }

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { ...options, headers });

  // Handle 401 with retry if refresh_token is available
  if (response.status === 401 && requiresAuth && retryOn401) {
    const { refreshToken } = getStoredAuth();
    if (refreshToken) {
      try {
        const newAccessToken = await refreshAccessToken();
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiRequest(endpoint, options, requiresAuth, false);
      } catch (refreshErr) {
        clearStoredAuth();
        window.dispatchEvent(new CustomEvent('ivy-auth-expired'));
        throw refreshErr;
      }
    } else {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('ivy-auth-expired'));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || `API error ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
