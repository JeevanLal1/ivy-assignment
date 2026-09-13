import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computePricePerSqft,
  computeAveragePricePerSqft2BHK,
  computeTotalMonthlyRent,
  findCostliestProject,
  countProjectsWithWrongListingCount
} from '../shared/metrics.mjs';
import { isInLast7Days } from '../shared/date-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('computeAveragePricePerSqft2BHK calculates arithmetic mean of individual ratios, not ratio of sums', () => {
  const listings = [
    // Unit 1: price 5,000,000, area 1000 sqft -> 5000 / sqft
    { listing_id: 'L1', bedroom: 2, is_live: true, price: 5000000, carpet_area: 1000, website: 'dwelling' },
    // Unit 2: price 10,000,000, area 1000 sqft -> 10000 / sqft
    { listing_id: 'L2', bedroom: 2, is_live: true, price: 10000000, carpet_area: 1000, website: 'dwelling' },
    // Unit 3: 3BHK (should be ignored)
    { listing_id: 'L3', bedroom: 3, is_live: true, price: 15000000, carpet_area: 1200, website: 'dwelling' },
    // Unit 4: 2BHK inactive (should be ignored)
    { listing_id: 'L4', bedroom: 2, is_live: false, price: 6000000, carpet_area: 1000, website: 'dwelling' },
    // Unit 5: 2BHK corrupt (in corruptSet, should be excluded)
    { listing_id: 'C1', bedroom: 2, is_live: true, price: -5000000, carpet_area: 1000, website: 'dwelling' },
    // Unit 6: 2BHK fake (in fakeSet, should be excluded)
    { listing_id: 'F1', bedroom: 2, is_live: true, price: 3000000, carpet_area: 1000, website: 'dwelling' }
  ];

  const res = computeAveragePricePerSqft2BHK(listings, new Set(['C1']), new Set(['F1']));
  assert.equal(res.qualifyingCount, 2);
  assert.equal(res.excludedCorrupt, 1);
  assert.equal(res.excludedFake, 1);
  // Individual ratios: 5000 and 10000 -> mean = 7500.00
  assert.equal(res.averagePricePerSqft, 7500);
});

test('isInLast7Days strictly enforces half-open interval boundaries in IST', () => {
  const ref = '2026-09-10T00:00:00+05:30';

  // Lower boundary: 2026-09-03T00:00:00+05:30 (inclusive)
  assert.equal(isInLast7Days('2026-09-03T00:00:00', ref), true);
  assert.equal(isInLast7Days('2026-09-03T00:00:00+05:30', ref), true);

  // One second before lower boundary: exclusive
  assert.equal(isInLast7Days('2026-09-02T23:59:59', ref), false);

  // Upper boundary: 2026-09-10T00:00:00+05:30 (exclusive)
  assert.equal(isInLast7Days('2026-09-10T00:00:00', ref), false);
  assert.equal(isInLast7Days('2026-09-10T00:00:00+05:30', ref), false);

  // One second before upper boundary: inclusive
  assert.equal(isInLast7Days('2026-09-09T23:59:59', ref), true);
});

test('computeTotalMonthlyRent filters by locality case-insensitively and sums rent only', () => {
  const rentals = [
    { rental_id: 'R1', locality: 'Magarpatta', price: 25000, deposit: 50000 },
    { rental_id: 'R2', locality: 'magarpatta', price: 35000, deposit: 10 },
    { rental_id: 'R3', locality: 'Kothrud', price: 20000, deposit: 40000 }
  ];

  const res = computeTotalMonthlyRent(rentals, 'magarpatta');
  assert.equal(res.count, 2);
  assert.equal(res.totalMonthlyRent, 60000);
});

test('findCostliestProject normalizes prices correctly before comparing', () => {
  const projects = [
    // 80 Lakhs = 8,000,000
    { project_id: 'P1', price_max: 80 },
    // 3.5 Crores = 35,000,000
    { project_id: 'P2', price_max: 3.5 },
    // 4.47 Crores = 44,700,000
    { project_id: 'P3', price_max: 4.47 },
    // 95 Lakhs = 9,500,000
    { project_id: 'P4', price_max: 95 }
  ];

  const res = findCostliestProject(projects);
  assert.equal(res.project_id, 'P3');
  assert.equal(res.price_max_inr, 44700000);
});

test('countProjectsWithWrongListingCount checks actual live linked listings count against total_listings', () => {
  const projects = [
    { project_id: 'P1', total_listings: 2 }, // actual live: 2 -> MATCH
    { project_id: 'P2', total_listings: 0 }, // actual live: 1 -> WRONG (stale zero)
    { project_id: 'P3', total_listings: 5 }  // actual live: 2 -> WRONG (phantom over-reported)
  ];

  const listings = [
    { listing_id: 'L1', project_id: 'P1', is_live: true },
    { listing_id: 'L2', project_id: 'P1', is_live: true },
    { listing_id: 'L3', project_id: 'P1', is_live: false }, // inactive linked
    { listing_id: 'L4', project_id: 'P2', is_live: true },
    { listing_id: 'L5', project_id: 'P3', is_live: true },
    { listing_id: 'L6', project_id: 'P3', is_live: true }
  ];

  const res = countProjectsWithWrongListingCount(projects, listings);
  assert.equal(res.totalProjects, 3);
  assert.equal(res.matchingProjects, 1);
  assert.equal(res.wrongCount, 2);
  assert.equal(res.staleZeroes, 1);
  assert.equal(res.phantomOverreported, 1);
});

test('submission.json matches expected schema and constraints', async () => {
  const subFile = path.resolve(rootDir, 'submission.json');
  const content = JSON.parse(await fs.readFile(subFile, 'utf-8'));

  // 1. Root keys and template conformance
  const templateFile = path.resolve(rootDir, 'submission.template.json');
  const template = JSON.parse(await fs.readFile(templateFile, 'utf-8'));
  assert.deepEqual(Object.keys(content).sort(), Object.keys(template).sort());
  assert.deepEqual(Object.keys(content.candidate).sort(), Object.keys(template.candidate).sort());
  assert.deepEqual(Object.keys(content.answers).sort(), Object.keys(template.answers).sort());
  assert.deepEqual(Object.keys(content.answers.costliest_project).sort(), Object.keys(template.answers.costliest_project).sort());

  assert.ok(typeof content.api_key === 'string' && content.api_key.length > 0);
  assert.equal(typeof content.candidate.name, 'string');
  assert.equal(typeof content.candidate.email, 'string');
  assert.equal(typeof content.candidate.repo_url, 'string');
  assert.equal(typeof content.candidate.demo_url, 'string');

  // 2. Answers types and values
  const a = content.answers;
  assert.equal(typeof a.total_listing_records, 'number');
  assert.equal(a.total_listing_records, 3800);

  assert.equal(typeof a.unique_properties, 'number');
  assert.equal(a.unique_properties, 3230);

  assert.equal(typeof a.active_listings, 'number');
  assert.equal(a.active_listings, 2998);

  assert.ok(Array.isArray(a.corrupt_listing_ids));
  assert.equal(a.corrupt_listing_ids.length, 28);
  // Verify sorted
  const sortedCorrupt = [...a.corrupt_listing_ids].sort();
  assert.deepEqual(a.corrupt_listing_ids, sortedCorrupt);
  // Verify unique
  assert.equal(new Set(a.corrupt_listing_ids).size, 28);

  assert.equal(typeof a.total_monthly_rent, 'number');
  assert.equal(a.total_monthly_rent, 4855700);

  assert.equal(typeof a.avg_price_per_sqft_2bhk, 'number');
  assert.equal(a.avg_price_per_sqft_2bhk, 10859.27);

  assert.ok(a.costliest_project && typeof a.costliest_project === 'object');
  assert.equal(typeof a.costliest_project.project_id, 'string');
  assert.equal(a.costliest_project.project_id, 'P30288');
  assert.equal(typeof a.costliest_project.price_max_inr, 'number');
  assert.equal(a.costliest_project.price_max_inr, 44700000);

  assert.equal(typeof a.listings_last_7_days, 'number');
  assert.equal(a.listings_last_7_days, 128);

  assert.ok(Array.isArray(a.fake_listing_ids));
  assert.equal(a.fake_listing_ids.length, 205);
  // Verify sorted
  const sortedFake = [...a.fake_listing_ids].sort();
  assert.deepEqual(a.fake_listing_ids, sortedFake);
  // Verify unique
  assert.equal(new Set(a.fake_listing_ids).size, 205);

  assert.equal(typeof a.projects_with_wrong_listing_count, 'number');
  assert.equal(a.projects_with_wrong_listing_count, 95);

  // Verify zero overlap between corrupt and fake
  const corruptSet = new Set(a.corrupt_listing_ids);
  const overlap = a.fake_listing_ids.filter(id => corruptSet.has(id));
  assert.equal(overlap.length, 0);

  // 3. Findings validation
  const validCategories = new Set([
    'auth', 'pagination', 'units', 'filters', 'sorting', 'timestamps',
    'duplicates', 'completeness', 'data_quality', 'fraud', 'consistency',
    'missing_endpoint', 'undocumented_endpoint'
  ]);

  for (const f of content.findings) {
    assert.ok(typeof f.endpoint === 'string' && f.endpoint.length > 0);
    assert.ok(validCategories.has(f.category), `Invalid finding category: ${f.category}`);
    assert.ok(typeof f.documented === 'string' && f.documented.length > 0);
    assert.ok(typeof f.actual === 'string' && f.actual.length > 0);
    assert.ok(typeof f.how_found === 'string' && f.how_found.length > 0);
    assert.ok(typeof f.impact === 'string' && f.impact.length > 0);
    assert.ok(Array.isArray(f.evidence));
    assert.ok(f.evidence.length <= 20, `Evidence list exceeds 20 items: ${f.evidence.length}`);
  }
});
