import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';

// Mock browser globals for Node
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
  scrollTo: () => {},
};

const { scoreListingSimilarity, findSimilarListings } = await import('../client/src/utils/similarity.js');
const { listingsService } = await import('../client/src/services/listings.js');
const { authService } = await import('../client/src/services/auth.js');

test('scoreListingSimilarity weights locality, bedroom, property type, and price proximity', () => {
  const current = {
    listing_id: 'BASE_1',
    locality: 'wakad',
    bedroom: 2,
    property_type: 'apartment',
    price: 6000000,
    carpet_area: 800,
    website: 'dwelling',
    is_live: true,
  };

  // Self comparison returns -1 (excluded)
  assert.equal(scoreListingSimilarity(current, current), -1);

  // Candidate A: exact match on locality, bedroom, type, close price -> highest score
  const candA = {
    listing_id: 'CAND_A',
    locality: 'wakad',
    bedroom: 2,
    property_type: 'apartment',
    price: 6200000, // within 3.3% -> +10 price
    carpet_area: 820, // within 2.5% -> +5 area
    website: 'dwelling',
    is_live: true,
  };
  const scoreA = scoreListingSimilarity(current, candA);
  // 40 (locality) + 25 (bedroom) + 20 (type) + 10 (price) + 5 (area) + 2 (live) = 102
  assert.equal(scoreA, 102);

  // Candidate B: different locality, different bedroom, different type
  const candB = {
    listing_id: 'CAND_B',
    locality: 'kothrud',
    bedroom: 4,
    property_type: 'villa',
    price: 25000000,
    carpet_area: 2500,
    website: 'dwelling',
    is_live: false,
  };
  const scoreB = scoreListingSimilarity(current, candB);
  assert.equal(scoreB, 0);

  assert.ok(scoreA > scoreB);
});

test('findSimilarListings ranks candidates and excludes base listing', () => {
  const current = {
    listing_id: 'TARGET',
    locality: 'baner',
    bedroom: 3,
    property_type: 'apartment',
    price: 9000000,
    carpet_area: 1200,
    website: 'dwelling',
    is_live: true,
  };

  const candidates = [
    { listing_id: 'TARGET', locality: 'baner', bedroom: 3, property_type: 'apartment', price: 9000000 },
    { listing_id: 'C1', locality: 'baner', bedroom: 3, property_type: 'apartment', price: 9200000, is_live: true },
    { listing_id: 'C2', locality: 'baner', bedroom: 2, property_type: 'apartment', price: 7500000, is_live: true },
    { listing_id: 'C3', locality: 'hadapsar', bedroom: 3, property_type: 'apartment', price: 9000000, is_live: true },
    { listing_id: 'C4', locality: 'baner', bedroom: 3, property_type: 'villa', price: 15000000, is_live: true },
  ];

  const similar = findSimilarListings(current, candidates, 3);
  assert.equal(similar.length, 3);
  // C1 should be ranked #1
  assert.equal(similar[0].listing_id, 'C1');
  // TARGET itself must never be in the results
  assert.ok(!similar.some((s) => s.listing_id === 'TARGET'));
});

test('Live API: listingsService.getListingById returns 404 for invalid ID', async () => {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return;

  await authService.login(email, password);

  try {
    await listingsService.getListingById('INVALID-NON-EXISTENT-ID-99999');
    assert.fail('Should have thrown 404 error');
  } catch (err) {
    assert.equal(err.status, 404);
  }
});
