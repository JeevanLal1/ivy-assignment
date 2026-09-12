import { BASE_URL } from './env.mjs';

/**
 * Generic HTTP request helper
 *
 * @param {string} path - Endpoint path to append to BASE_URL
 * @param {object} [options={}] - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Record<string, any>|URLSearchParams} [options.query] - Query parameters
 * @param {any} [options.body] - Request body (automatically serialized to JSON if object)
 * @param {HeadersInit} [options.headers={}] - HTTP headers
 * @returns {Promise<{ status: number, headers: Headers, json: any, text: string }>}
 */
export async function request(path, { method = 'GET', query, body, headers = {} } = {}) {
  const base = BASE_URL ? (BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`) : 'https://solve.ivy.homes/';
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, base);

  if (query) {
    const searchParams = query instanceof URLSearchParams ? query : new URLSearchParams();
    if (!(query instanceof URLSearchParams)) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.append(key, value);
    }
  }

  const reqHeaders = new Headers(headers);
  let reqBody = body;

  if (body !== undefined && body !== null) {
    if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
      if (!reqHeaders.has('Content-Type')) {
        reqHeaders.set('Content-Type', 'application/json');
      }
      reqBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: reqHeaders,
    body: reqBody,
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    status: response.status,
    headers: response.headers,
    json,
    text,
  };
}
