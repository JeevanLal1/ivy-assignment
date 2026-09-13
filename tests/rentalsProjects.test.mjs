import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRentalRent,
  formatRentalDeposit,
  formatProjectPrice,
  formatProjectPriceRange,
  formatArea,
} from '../client/src/utils/format.js';
import { rentalsService } from '../client/src/services/rentals.js';
import { projectsService } from '../client/src/services/projects.js';

test('formatRentalRent formats monthly rental rate', () => {
  assert.equal(formatRentalRent(25000), '₹25,000/mo');
  assert.equal(formatRentalRent(31600), '₹31,600/mo');
  assert.equal(formatRentalRent(0), '₹0/mo');
  assert.equal(formatRentalRent(null), '₹0/mo');
});

test('formatRentalDeposit applies 2-10 month multiplier rule vs direct INR', () => {
  // Case A: Multiplier <= 10 (e.g. 3 months of ₹20,000 rent = ₹60,000)
  const res1 = formatRentalDeposit(3, 20000);
  assert.equal(res1.amount, 60000);
  assert.equal(res1.label, '₹60,000');
  assert.equal(res1.isMultiplier, true);
  assert.equal(res1.multiplier, 3);

  // Case B: Multiplier with Lakh formatting (e.g. 6 months of ₹25,000 rent = ₹1.50 L)
  const res2 = formatRentalDeposit(6, 25000);
  assert.equal(res2.amount, 150000);
  assert.equal(res2.label, '₹1.50 L');
  assert.equal(res2.isMultiplier, true);
  assert.equal(res2.multiplier, 6);

  // Case C: Direct INR > 10
  const res3 = formatRentalDeposit(63200, 31600);
  assert.equal(res3.amount, 63200);
  assert.equal(res3.label, '₹63,200');
  assert.equal(res3.isMultiplier, false);

  // Case D: Direct INR in Lakhs
  const res4 = formatRentalDeposit(250000, 35000);
  assert.equal(res4.amount, 250000);
  assert.equal(res4.label, '₹2.50 L');
  assert.equal(res4.isMultiplier, false);
});

test('formatProjectPrice scales < 10 to Crores and >= 10 to Lakhs', () => {
  // Value < 10 represents Crores
  assert.equal(formatProjectPrice(4.47), '₹4.47 Cr');
  assert.equal(formatProjectPrice(1.05), '₹1.05 Cr');
  assert.equal(formatProjectPrice(3.22), '₹3.22 Cr');

  // Value >= 10 represents Lakhs
  assert.equal(formatProjectPrice(80), '₹80.00 L');
  assert.equal(formatProjectPrice(295), '₹2.95 Cr'); // 295 Lakhs = 2.95 Cr
  assert.equal(formatProjectPrice(45.5), '₹45.50 L');
});

test('formatProjectPriceRange produces normalized range labels', () => {
  // Mixed units (price_min: 80 Lakhs, price_max: 3.22 Crores)
  const range1 = formatProjectPriceRange(80, 3.22);
  assert.equal(range1, '₹80.00 L – ₹3.22 Cr');

  // Single price when min and max are equal
  const range2 = formatProjectPriceRange(1.5, 1.5);
  assert.equal(range2, '₹1.50 Cr');

  // Price on request when zero/null
  const range3 = formatProjectPriceRange(0, 0);
  assert.equal(range3, 'Price on Request');
});

test('rentalsService & projectsService require valid IDs for detail lookups', async () => {
  await assert.rejects(
    () => rentalsService.getRentalById(''),
    /Rental ID is required/
  );
  await assert.rejects(
    () => projectsService.getProjectById(''),
    /Project ID is required/
  );
});
