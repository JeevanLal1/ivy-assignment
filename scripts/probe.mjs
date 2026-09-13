import { BASE_URL, API_KEY, DEMO_EMAIL, DEMO_PASSWORD, sanitize, hasAuthConfig, ensureAuthConfig } from './env.mjs';
import { request } from './http.mjs';

async function runProbe() {
  console.log('=== Ivy Homes API Controlled Probe ===');
  console.log(`Target Base URL: ${BASE_URL}\n`);

  // 1. Health check (unauthenticated)
  console.log('1. Probing GET /health (unauthenticated)...');
  try {
    const health = await request('/health', { apiKey: false });
    console.log(`   Status: ${health.status}`);
    console.log('   Body:', sanitize(health.json || health.text));
  } catch (err) {
    console.error('   Failed to connect to /health:', err.message);
    return;
  }

  // 2. Auth config verification
  if (!hasAuthConfig()) {
    console.log('\n[!] Auth configuration missing.');
    return;
  }
  ensureAuthConfig();

  // 2. Test Documented API Key Query Parameter (Expected discrepancy)
  console.log('\n2. Testing documented query param: GET /v1/listings?api_key=...');
  try {
    const queryKeyRes = await request('/v1/listings', {
      apiKey: false,
      query: { api_key: API_KEY, limit: 1 }
    });
    console.log(`   Status: ${queryKeyRes.status}`);
    console.log('   Detail:', sanitize(queryKeyRes.json || queryKeyRes.text));
  } catch (err) {
    console.error('   Error:', err.message);
  }

  // 3. Test POST /auth/login with X-API-Key header
  console.log('\n3. Testing POST /auth/login with X-API-Key header...');
  let authToken = null;
  let refreshToken = null;
  let refreshUrl = null;
  let loginUser = null;
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD }
    });
    console.log(`   Status: ${loginRes.status}`);
    console.log('   Response structure:', Object.keys(loginRes.json || {}));
    const data = loginRes.json || {};
    authToken = data.access_token || data.token;
    refreshToken = data.refresh_token;
    refreshUrl = data.refresh_url || '/auth/refresh';
    loginUser = data.user;

    console.log(`   Extracted access_token present: ${Boolean(authToken)}`);
    console.log(`   Extracted refresh_token present: ${Boolean(refreshToken)}`);
    console.log(`   Token type: ${data.token_type}`);
    console.log(`   expires_in: ${data.expires_in} seconds (${data.expires_in / 60} mins)`);
    console.log(`   refresh_url: ${refreshUrl}`);
    console.log(`   User:`, sanitize(loginUser));
  } catch (err) {
    console.error('   Login error:', err.message);
    return;
  }

  // 4. Test POST /auth/refresh (test refresh flow!)
  if (refreshToken && refreshUrl) {
    console.log(`\n4. Testing documented 'no refresh flow' claim vs actual POST ${refreshUrl}...`);
    try {
      const refRes = await request(refreshUrl, {
        method: 'POST',
        body: { refresh_token: refreshToken }
      });
      console.log(`   Status: ${refRes.status}`);
      console.log(`   Refresh response keys:`, Object.keys(refRes.json || {}));
      if (refRes.json?.access_token) {
        console.log(`   Successfully refreshed token! New expires_in: ${refRes.json.expires_in}`);
        authToken = refRes.json.access_token; // update token
      } else {
        console.log(`   Refresh response:`, sanitize(refRes.json || refRes.text));
      }
    } catch (err) {
      console.error('   Refresh probe error:', err.message);
    }
  }

  // 5. Test GET /v1/listings with token
  console.log('\n5. Testing GET /v1/listings with Bearer token (limit=2)...');
  let sampleListingId = null;
  try {
    const listingsRes = await request('/v1/listings', {
      token: authToken,
      query: { limit: 2 }
    });
    console.log(`   Status: ${listingsRes.status}`);
    if (listingsRes.json) {
      const { results, ...meta } = listingsRes.json;
      console.log('   Response Metadata:', sanitize(meta));
      console.log(`   Records count in page: ${Array.isArray(results) ? results.length : 0}`);
      if (Array.isArray(results) && results.length > 0) {
        sampleListingId = results[0].listing_id;
        console.log(`   Sample listing ID: ${sampleListingId}`);
        console.log('   Listing fields:', Object.keys(results[0]));
        console.log('   Sample listing record:', sanitize(results[0]));
      }
    } else {
      console.log('   Response text:', sanitize(listingsRes.text));
    }
  } catch (err) {
    console.error('   Error:', err.message);
  }

  // 6. Test detail endpoint paths: /v1/listing/{id} vs /v1/listings/{id}
  if (sampleListingId) {
    console.log(`\n6. Testing detail endpoint for ID: ${sampleListingId}...`);
    // Documented path: /v1/listing/{id}
    const singularRes = await request(`/v1/listing/${sampleListingId}`, { token: authToken });
    console.log(`   Documented singular: GET /v1/listing/${sampleListingId} -> Status: ${singularRes.status}`);
    if (singularRes.status === 404) {
      console.log('   404 detail:', sanitize(singularRes.json || singularRes.text));
    }

    // Plural path: /v1/listings/{id}
    const pluralRes = await request(`/v1/listings/${sampleListingId}`, { token: authToken });
    console.log(`   Plural path: GET /v1/listings/${sampleListingId} -> Status: ${pluralRes.status}`);
    if (pluralRes.json) {
      console.log('   Detail response fields:', Object.keys(pluralRes.json));
    }

    // Similar listings: /v1/listings/{id}/similar
    const similarRes = await request(`/v1/listings/${sampleListingId}/similar`, { token: authToken });
    console.log(`   Similar: GET /v1/listings/${sampleListingId}/similar -> Status: ${similarRes.status}`);
    if (similarRes.json) {
      console.log('   Similar response structure:', Array.isArray(similarRes.json) ? `Array[${similarRes.json.length}]` : Object.keys(similarRes.json));
    }
  }

  // 7. Test rentals collection endpoint
  console.log('\n7. Testing GET /v1/rentals with token (limit=2)...');
  let sampleRentalId = null;
  try {
    const rentalsRes = await request('/v1/rentals', { token: authToken, query: { limit: 2 } });
    console.log(`   Status: ${rentalsRes.status}`);
    if (rentalsRes.json) {
      const { results, ...meta } = rentalsRes.json;
      console.log('   Rentals Metadata:', sanitize(meta));
      if (Array.isArray(results) && results.length > 0) {
        sampleRentalId = results[0].listing_id;
        console.log(`   Sample rental ID: ${sampleRentalId}`);
        console.log('   Sample rental fields:', Object.keys(results[0]));
        console.log('   Sample rental record:', sanitize(results[0]));
      }
    }
  } catch (err) {
    console.error('   Rentals error:', err.message);
  }

  // 8. Test projects collection endpoint
  console.log('\n8. Testing GET /v1/projects with token (limit=2)...');
  try {
    const projectsRes = await request('/v1/projects', { token: authToken, query: { limit: 2 } });
    console.log(`   Status: ${projectsRes.status}`);
    if (projectsRes.json) {
      const { results, ...meta } = projectsRes.json;
      console.log('   Projects Metadata:', sanitize(meta));
      if (Array.isArray(results) && results.length > 0) {
        console.log(`   Sample project ID: ${results[0].project_id}`);
        console.log('   Sample project fields:', Object.keys(results[0]));
        console.log('   Sample project record:', sanitize(results[0]));
      }
    }
  } catch (err) {
    console.error('   Projects error:', err.message);
  }

  // 9. Test Pagination probing (limit, page vs offset)
  console.log('\n9. Probing pagination parameters on /v1/listings...');
  try {
    const p1 = await request('/v1/listings', { token: authToken, query: { page: 1, limit: 3 } });
    const p2 = await request('/v1/listings', { token: authToken, query: { page: 2, limit: 3 } });
    const ids1 = p1.json?.results?.map((r) => r.listing_id);
    const ids2 = p2.json?.results?.map((r) => r.listing_id);
    console.log(`   page=1 IDs: ${JSON.stringify(ids1)}`);
    console.log(`   page=2 IDs: ${JSON.stringify(ids2)}`);
    console.log(`   page=1 Metadata:`, sanitize(p1.json && { total: p1.json.total, page: p1.json.page, page_size: p1.json.page_size, limit: p1.json.limit }));
    console.log(`   page=2 Metadata:`, sanitize(p2.json && { total: p2.json.total, page: p2.json.page, page_size: p2.json.page_size, limit: p2.json.limit }));

    // Test max limit
    const maxLim = await request('/v1/listings', { token: authToken, query: { limit: 200 } });
    console.log(`   limit=200 status: ${maxLim.status}, results length: ${maxLim.json?.results?.length}`);
    if (maxLim.status !== 200) {
      console.log(`   limit=200 body:`, sanitize(maxLim.json || maxLim.text));
    }
    const lim100 = await request('/v1/listings', { token: authToken, query: { limit: 100 } });
    console.log(`   limit=100 status: ${lim100.status}, results length: ${lim100.json?.results?.length}`);
  } catch (err) {
    console.error('   Pagination probe error:', err.message);
  }

  // 10. Test Analytics summary endpoint
  console.log('\n10. Probing GET /v1/analytics/summary...');
  try {
    const analyticsRes = await request('/v1/analytics/summary', { token: authToken });
    console.log(`   Status: ${analyticsRes.status}`);
    console.log(`   Body:`, sanitize(analyticsRes.json || analyticsRes.text));
  } catch (err) {
    console.error('   Analytics error:', err.message);
  }

  // 11. Test Favourites endpoint
  console.log('\n11. Probing GET /v1/favourites...');
  try {
    const favRes = await request('/v1/favourites', { token: authToken });
    console.log(`   Status: ${favRes.status}`);
    console.log(`   Body:`, sanitize(favRes.json || favRes.text));
  } catch (err) {
    console.error('   Favourites error:', err.message);
  }

  console.log('\n=== Controlled Probe Completed ===');
}

runProbe().catch((err) => {
  console.error('Unhandled error in probe:', err);
});
