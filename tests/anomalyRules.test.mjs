import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isNegativePrice,
  isFloorExceedingTotal,
  isSuperLessThanCarpet,
  isSwappedCoordinates,
  isSyndicateListing,
  hasScamPhrase,
  getCorruptionRule,
  classifyListing
} from '../shared/anomalyRules.mjs';

test('isNegativePrice correctly detects negative prices', () => {
  assert.equal(isNegativePrice({ price: -8500000 }), true);
  assert.equal(isNegativePrice({ price: 0 }), false);
  assert.equal(isNegativePrice({ price: 12000000 }), false);
});

test('isFloorExceedingTotal detects impossible floor numbers', () => {
  assert.equal(isFloorExceedingTotal({ floor: 41, total_floors: 31 }), true);
  assert.equal(isFloorExceedingTotal({ floor: 10, total_floors: 10 }), false);
  assert.equal(isFloorExceedingTotal({ floor: 5, total_floors: 10 }), false);
  assert.equal(isFloorExceedingTotal({ floor: 0, total_floors: 0 }), false);
});

test('isSuperLessThanCarpet accounts for unit differences', () => {
  // Direct comparison in sqft
  assert.equal(isSuperLessThanCarpet({ carpet_area: 1200, super_built_up_area: 800, website: 'dwelling' }), true);
  assert.equal(isSuperLessThanCarpet({ carpet_area: 1200, super_built_up_area: 1500, website: 'dwelling' }), false);

  // MagicHomes in square meters (< 300)
  // 150 sq.m carpet (1614 sqft) vs 100 sq.m super (1076 sqft)
  assert.equal(isSuperLessThanCarpet({ carpet_area: 150, super_built_up_area: 100, website: 'magichomes' }), true);
});

test('isSwappedCoordinates identifies coordinates outside regional bounds', () => {
  assert.equal(isSwappedCoordinates({ latitude: 73.78, longitude: 18.56 }), true);
  assert.equal(isSwappedCoordinates({ latitude: 18.56, longitude: 73.78 }), false);
});

test('isSyndicateListing and hasScamPhrase flag lead generation networks', () => {
  const syndicateListing = {
    posted_by_contact: '+912009819040',
    description: 'Pay a token amount of Rs 25,000 today to block the unit.'
  };
  const normalListing = {
    posted_by_contact: '+912000192971',
    description: 'Spacious apartment near metro station.'
  };

  assert.equal(isSyndicateListing(syndicateListing), true);
  assert.equal(hasScamPhrase(syndicateListing), true);

  assert.equal(isSyndicateListing(normalListing), false);
  assert.equal(hasScamPhrase(normalListing), false);
});

test('classifyListing keeps CORRUPT and FAKE classifications strictly segregated', () => {
  const corruptListing = {
    listing_id: 'C1',
    price: -5000000,
    floor: 5,
    total_floors: 10,
    carpet_area: 1000,
    super_built_up_area: 1200,
    latitude: 18.5,
    longitude: 73.8,
    posted_by_contact: '+912009819040' // Even if posted by syndicate, physical impossibility is primary corruption
  };

  const fakeListing = {
    listing_id: 'F1',
    price: 4500000,
    floor: 5,
    total_floors: 10,
    carpet_area: 1000,
    super_built_up_area: 1200,
    latitude: 18.5,
    longitude: 73.8,
    posted_by_contact: '+912009819040',
    description: 'Pay a token amount of Rs 25,000 today to block the unit.'
  };

  const normalListing = {
    listing_id: 'N1',
    price: 9500000,
    floor: 2,
    total_floors: 8,
    carpet_area: 1100,
    super_built_up_area: 1400,
    latitude: 18.5,
    longitude: 73.8,
    posted_by_contact: '+912000192971',
    description: 'Well maintained family home.'
  };

  assert.equal(classifyListing(corruptListing).classification, 'CORRUPT');
  assert.equal(classifyListing(fakeListing).classification, 'FAKE');
  assert.equal(classifyListing(normalListing).classification, 'NEITHER');
});
