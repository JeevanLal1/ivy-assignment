import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSavedIds,
  isListingSaved,
  optimisticAddSaved,
  optimisticRemoveSaved,
} from '../client/src/utils/savedState.js';
import { savedService } from '../client/src/services/saved.js';

test('savedState: extractSavedIds extracts unique IDs from various listing formats', () => {
  assert.equal(extractSavedIds(null).size, 0);
  assert.equal(extractSavedIds(undefined).size, 0);
  assert.equal(extractSavedIds([]).size, 0);

  const sampleListings = [
    { listing_id: 'DWE-3001001', apartment_name: 'Apt 1' },
    { id: 'DWE-3001002', apartment_name: 'Apt 2' },
    { listing_id: 'DWE-3001001' }, // Duplicate
    { other_field: 'no_id' },
  ];

  const idSet = extractSavedIds(sampleListings);
  assert.equal(idSet.size, 2);
  assert.ok(idSet.has('DWE-3001001'));
  assert.ok(idSet.has('DWE-3001002'));
  assert.ok(!idSet.has('DWE-9999999'));
});

test('savedState: isListingSaved performs null-safe ID membership checks', () => {
  const ids = new Set(['DWE-100', 'DWE-200']);

  assert.equal(isListingSaved(ids, 'DWE-100'), true);
  assert.equal(isListingSaved(ids, 'DWE-200'), true);
  assert.equal(isListingSaved(ids, 'DWE-300'), false);
  assert.equal(isListingSaved(null, 'DWE-100'), false);
  assert.equal(isListingSaved(ids, null), false);
  assert.equal(isListingSaved(ids, ''), false);
});

test('savedState: optimisticAddSaved prepends listing and prevents duplicates', () => {
  const initial = [
    { listing_id: 'DWE-100', apartment_name: 'Silver Oaks' },
  ];

  // 1. Add new listing object
  const step1 = optimisticAddSaved(initial, {
    listing_id: 'DWE-200',
    apartment_name: 'Golden Palms',
  });
  assert.equal(step1.count, 2);
  assert.equal(step1.listings.length, 2);
  assert.equal(step1.listings[0].listing_id, 'DWE-200'); // prepended
  assert.ok(step1.ids.has('DWE-100'));
  assert.ok(step1.ids.has('DWE-200'));

  // 2. Add duplicate listing (should be idempotent)
  const step2 = optimisticAddSaved(step1.listings, {
    listing_id: 'DWE-200',
    apartment_name: 'Golden Palms Dup',
  });
  assert.equal(step2.count, 2);
  assert.equal(step2.listings.length, 2);

  // 3. Add string ID
  const step3 = optimisticAddSaved(step2.listings, 'DWE-300');
  assert.equal(step3.count, 3);
  assert.equal(step3.listings[0].listing_id, 'DWE-300');
  assert.ok(step3.ids.has('DWE-300'));

  // 4. Handle empty/invalid input safely
  const step4 = optimisticAddSaved(step3.listings, null);
  assert.equal(step4.count, 3);
});

test('savedState: optimisticRemoveSaved filters out target ID and updates count and IDs', () => {
  const initial = [
    { listing_id: 'DWE-100', apartment_name: 'Apt 1' },
    { listing_id: 'DWE-200', apartment_name: 'Apt 2' },
    { listing_id: 'DWE-300', apartment_name: 'Apt 3' },
  ];

  // 1. Remove middle element
  const step1 = optimisticRemoveSaved(initial, 'DWE-200');
  assert.equal(step1.count, 2);
  assert.equal(step1.listings.length, 2);
  assert.ok(step1.ids.has('DWE-100'));
  assert.ok(!step1.ids.has('DWE-200'));
  assert.ok(step1.ids.has('DWE-300'));

  // 2. Remove non-existent ID (no-op)
  const step2 = optimisticRemoveSaved(step1.listings, 'NON-EXISTENT');
  assert.equal(step2.count, 2);
  assert.equal(step2.listings.length, 2);

  // 3. Remove all remaining
  const step3 = optimisticRemoveSaved(step2.listings, 'DWE-100');
  const step4 = optimisticRemoveSaved(step3.listings, 'DWE-300');
  assert.equal(step4.count, 0);
  assert.equal(step4.listings.length, 0);
  assert.equal(step4.ids.size, 0);
});

test('savedService: argument validation for saveListing and removeListing', async () => {
  await assert.rejects(
    () => savedService.saveListing(''),
    /listingId is required/
  );
  await assert.rejects(
    () => savedService.saveListing(null),
    /listingId is required/
  );
  await assert.rejects(
    () => savedService.removeListing(''),
    /listingId is required/
  );
  await assert.rejects(
    () => savedService.removeListing(undefined),
    /listingId is required/
  );
});
