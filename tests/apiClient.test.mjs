import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';

// Mock browser globals for testing API service logic in Node
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

globalThis.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Import client services
const {
  setStoredAuth,
  getStoredAuth,
  clearStoredAuth,
  apiRequest,
  refreshAccessToken
} = await import('../client/src/services/api.js');
const { authService } = await import('../client/src/services/auth.js');
const { savedService } = await import('../client/src/services/saved.js');

test('API client storage helpers store and retrieve session tokens', () => {
  clearStoredAuth();

  setStoredAuth({
    accessToken: 'test_access_token_123',
    refreshToken: 'test_refresh_token_456',
    expiresIn: 900,
    user: { email: 'demo1@ivy.homes' },
  });

  const auth = getStoredAuth();
  assert.equal(auth.accessToken, 'test_access_token_123');
  assert.equal(auth.refreshToken, 'test_refresh_token_456');
  assert.equal(auth.user.email, 'demo1@ivy.homes');
  assert.ok(auth.expiresAt > Date.now());

  clearStoredAuth();
  const cleared = getStoredAuth();
  assert.equal(cleared.accessToken, null);
  assert.equal(cleared.refreshToken, null);
  assert.equal(cleared.user, null);
});

test('apiRequest retries request with refreshed token when encountering 401', async () => {
  clearStoredAuth();

  setStoredAuth({
    accessToken: 'expired_access_token',
    refreshToken: 'valid_refresh_token',
    expiresIn: 900,
    user: { email: 'demo1@ivy.homes' },
  });

  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;

  globalThis.fetch = async (url, options) => {
    fetchCallCount++;
    const authHeader = options?.headers?.get?.('Authorization') || options?.headers?.Authorization;

    // 1. First call is the initial API call with expired token -> returns 401
    if (fetchCallCount === 1) {
      assert.equal(authHeader, 'Bearer expired_access_token');
      return {
        status: 401,
        ok: false,
        json: async () => ({ detail: 'token expired' }),
        text: async () => JSON.stringify({ detail: 'token expired' })
      };
    }

    // 2. Second call is the refresh call to /auth/refresh
    if (fetchCallCount === 2) {
      assert.ok(url.includes('/auth/refresh'));
      const body = JSON.parse(options.body);
      assert.equal(body.refresh_token, 'valid_refresh_token');
      return {
        status: 200,
        ok: true,
        json: async () => ({
          access_token: 'new_fresh_access_token',
          refresh_token: 'valid_refresh_token',
          expires_in: 900,
          user: { email: 'demo1@ivy.homes' }
        })
      };
    }

    // 3. Third call is the retried original request with new token -> returns 200
    if (fetchCallCount === 3) {
      assert.equal(authHeader, 'Bearer new_fresh_access_token');
      return {
        status: 200,
        ok: true,
        json: async () => ({ success: true, results: ['listing1'] })
      };
    }

    throw new Error(`Unexpected fetch call #${fetchCallCount}`);
  };

  try {
    const res = await apiRequest('/v1/saved', { method: 'GET' });
    assert.deepEqual(res, { success: true, results: ['listing1'] });
    assert.equal(fetchCallCount, 3);
    assert.equal(getStoredAuth().accessToken, 'new_fresh_access_token');
  } finally {
    globalThis.fetch = originalFetch;
    clearStoredAuth();
  }
});

test('Live API: authService logs in and refreshes session against solve.ivy.homes', async () => {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) {
    return; // Skip if credentials not in environment
  }

  clearStoredAuth();

  // 1. Live login
  const loginRes = await authService.login(email, password);
  assert.ok(typeof loginRes.access_token === 'string' && loginRes.access_token.length > 0);
  assert.ok(typeof loginRes.refresh_token === 'string' && loginRes.refresh_token.length > 0);
  assert.equal(loginRes.expires_in, 900);

  // Verify stored auth
  const stored = getStoredAuth();
  assert.equal(stored.accessToken, loginRes.access_token);
  assert.equal(stored.refreshToken, loginRes.refresh_token);

  // 2. Live authenticated call with Bearer + X-API-Key
  const savedRes = await apiRequest('/v1/saved', { method: 'GET' });
  assert.ok(savedRes !== undefined);

  // 3. Live token refresh
  const newAccessToken = await refreshAccessToken();
  assert.ok(typeof newAccessToken === 'string' && newAccessToken.length > 0);
  assert.notEqual(newAccessToken, 'expired_access_token');

  // 4. Authenticated call with refreshed token
  const savedRes2 = await apiRequest('/v1/saved', { method: 'GET' });
  assert.ok(savedRes2 !== undefined);

  clearStoredAuth();
});

test('Live API: savedService handles get, save, duplicate idempotency, and remove with cleanup', async () => {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return;

  clearStoredAuth();
  await authService.login(email, password);
  const testListingId = 'DWE-3002501';

  try {
    // 1. Initial list
    const initialList = await savedService.getSavedListings();
    assert.ok(Array.isArray(initialList));

    // Ensure test listing is not saved initially
    if (initialList.some(r => (r.listing_id || r.id) === testListingId)) {
      await savedService.removeListing(testListingId);
    }

    // 2. Save listing (requires { listing_id })
    const saveRes = await savedService.saveListing(testListingId);
    assert.equal(saveRes.ok, true);
    assert.equal(saveRes.listing_id, testListingId);

    // 3. Duplicate save is idempotent (returns 201 with ok: true)
    const dupRes = await savedService.saveListing(testListingId);
    assert.equal(dupRes.ok, true);

    // 4. Verify presence in list
    const updatedList = await savedService.getSavedListings();
    assert.ok(updatedList.some(r => (r.listing_id || r.id) === testListingId));

    // 5. Remove listing (DELETE /v1/saved/:id)
    const removeRes = await savedService.removeListing(testListingId);
    assert.equal(removeRes.ok, true);

    // 6. Verify removed
    const finalList = await savedService.getSavedListings();
    assert.ok(!finalList.some(r => (r.listing_id || r.id) === testListingId));
  } finally {
    // Ensure cleanup always runs
    try {
      await savedService.removeListing(testListingId);
    } catch {
      // ignore if already removed
    }
    clearStoredAuth();
  }
});



