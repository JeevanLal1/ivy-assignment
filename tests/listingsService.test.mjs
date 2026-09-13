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
};

const { listingsService } = await import('../client/src/services/listings.js');
const { authService } = await import('../client/src/services/auth.js');
const { formatPrice, formatArea, formatTitleCase, formatPortalName } = await import('../client/src/utils/format.js');

test('formatPrice formats Lakhs and Crores in standard Indian notation', () => {
  assert.equal(formatPrice(4140000), '₹41.40 L');
  assert.equal(formatPrice(15000000), '₹1.50 Cr');
  assert.equal(formatPrice(8500000), '₹85.00 L');
  assert.equal(formatPrice(50000), '₹50,000');
  assert.equal(formatPrice(0), '₹0');
});

test('formatArea applies MagicHomes unit normalization rule (< 300 sqm to sqft)', () => {
  // MagicHomes area < 300 is square meters -> 100 sqm = 1076 sqft
  const converted = formatArea(100, 'magichomes');
  assert.equal(converted.sqft, 1076);
  assert.equal(converted.wasConverted, true);

  // MagicHomes area >= 300 is already sqft
  const regularMH = formatArea(850, 'magichomes');
  assert.equal(regularMH.sqft, 850);
  assert.equal(regularMH.wasConverted, false);

  // Other portals are already in sqft
  const dwelling = formatArea(493, 'dwelling');
  assert.equal(dwelling.sqft, 493);
  assert.equal(dwelling.wasConverted, false);
});

test('formatTitleCase and formatPortalName provide clean display names', () => {
  assert.equal(formatTitleCase('viman nagar'), 'Viman Nagar');
  assert.equal(formatTitleCase('builder floor'), 'Builder Floor');
  assert.equal(formatPortalName('magichomes'), 'MagicHomes');
  assert.equal(formatPortalName('squareyards'), 'SquareYards');
});

test('Live API: listingsService fetches live listings with pagination and detail', async () => {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return;

  await authService.login(email, password);

  // 1. Fetch first batch of listings
  const page1 = await listingsService.getListings({ offset: 0, limit: 5, locality: 'wakad' });
  assert.ok(page1 && Array.isArray(page1.results));
  assert.equal(page1.limit, 5);
  assert.equal(page1.offset, 0);
  assert.ok(page1.results.length > 0);

  const firstListing = page1.results[0];
  assert.ok(firstListing.listing_id);
  assert.equal(firstListing.locality.toLowerCase(), 'wakad');

  // 2. Fetch single listing detail via GET /v1/listings/{id}
  const detail = await listingsService.getListingById(firstListing.listing_id);
  assert.equal(detail.listing_id, firstListing.listing_id);
  assert.ok(typeof detail.price === 'number');
});
