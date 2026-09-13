import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanApartmentName, haversineDistanceMeters, generatePropertyKey, clusterProperties } from '../shared/propertyMatching.mjs';

test('cleanApartmentName normalizes portal name variations', () => {
  assert.equal(cleanApartmentName('The Salarpuria Pavilion'), 'salarpuria pavilion');
  assert.equal(cleanApartmentName('Shriram Crest Apartments'), 'shriram crest');
  assert.equal(cleanApartmentName('Century Pavilion Phase 1'), 'century pavilion');
  assert.equal(cleanApartmentName('nitesh vista'), 'nitesh vista');
  assert.equal(cleanApartmentName('PRESTIGE SANCTUARY'), 'prestige sanctuary');
  assert.equal(cleanApartmentName('Mantri-Crest'), 'mantri crest');
  assert.equal(cleanApartmentName('   Lodha   Willows   '), 'lodha willows');
});

test('haversineDistanceMeters calculates accurate distance', () => {
  // Identical points should be 0 distance
  assert.equal(haversineDistanceMeters(18.5, 73.8, 18.5, 73.8), 0);

  // Approximately 11 meters per 0.0001 degrees latitude
  const d = haversineDistanceMeters(18.5000, 73.8000, 18.5001, 73.8000);
  assert.ok(d > 10 && d < 12);

  // Corrupt/swapped coordinates (lat > 70) return Infinity
  assert.equal(haversineDistanceMeters(73.8, 18.5, 18.5, 73.8), Infinity);
});

test('generatePropertyKey creates deterministic identity key', () => {
  const listing1 = {
    apartment_name: 'The Rohan Grand',
    locality: 'Kothrud',
    property_type: 'Apartment',
    bedroom: 3,
    floor: 5,
    total_floors: 12,
    facing_direction: 'North-East'
  };
  const listing2 = {
    apartment_name: 'Rohan Grand Apartments',
    locality: 'kothrud',
    property_type: 'apartment',
    bedroom: 3,
    floor: 5,
    total_floors: 12,
    facing_direction: 'north-east'
  };

  assert.equal(generatePropertyKey(listing1), generatePropertyKey(listing2));
  assert.equal(generatePropertyKey(listing1), 'rohan grand|kothrud|apartment|3|5|12|north-east');
});

test('clusterProperties groups identical cross-portal listings and flags divergence', () => {
  const mockListings = [
    {
      listing_id: 'L1',
      website: 'dwelling',
      apartment_name: 'Prestige Park',
      locality: 'baner',
      property_type: 'apartment',
      bedroom: 2,
      floor: 3,
      total_floors: 10,
      facing_direction: 'east',
      carpet_area: 900,
      latitude: 18.5501,
      longitude: 73.7901
    },
    {
      listing_id: 'L2',
      website: 'squarelane',
      apartment_name: 'The Prestige Park',
      locality: 'baner',
      property_type: 'apartment',
      bedroom: 2,
      floor: 3,
      total_floors: 10,
      facing_direction: 'east',
      carpet_area: 905, // within 1%
      latitude: 18.5502, // within 20m
      longitude: 73.7902
    },
    {
      listing_id: 'L3',
      website: '100acres',
      apartment_name: 'Distinct Tower',
      locality: 'kothrud',
      property_type: 'apartment',
      bedroom: 3,
      floor: 1,
      total_floors: 5,
      facing_direction: 'north',
      carpet_area: 1200,
      latitude: 18.5100,
      longitude: 73.8100
    }
  ];

  const res = clusterProperties(mockListings);
  assert.equal(res.totalListings, 3);
  assert.equal(res.uniqueCount, 2);
  assert.equal(res.duplicateCount, 1);
  assert.equal(res.highConfidenceClusters.length, 1);
  assert.equal(res.unresolvedClusters.length, 0);
  assert.equal(res.highConfidenceClusters[0].listings.length, 2);
});
