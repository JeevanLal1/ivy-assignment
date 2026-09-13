import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProjectPrice, normalizeArea, normalizeRentalDeposit } from '../shared/normalize.mjs';
import { parseTimestamp, isInLast7Days, REFERENCE_ISO, SEVEN_DAYS_BEFORE_ISO } from '../shared/date-utils.mjs';

test('normalizeProjectPrice scales values correctly', () => {
  // Value < 10 represents Crores
  assert.equal(normalizeProjectPrice(3.22), 32200000);
  assert.equal(normalizeProjectPrice(1.05), 10500000);

  // Value >= 10 represents Lakhs
  assert.equal(normalizeProjectPrice(80), 8000000);
  assert.equal(normalizeProjectPrice(45.5), 4550000);

  // Invalid values
  assert.equal(normalizeProjectPrice(0), 0);
  assert.equal(normalizeProjectPrice(-5), 0);
});

test('normalizeArea converts MagicHomes sqm to sqft while preserving sqft', () => {
  // MagicHomes under 300 is sqm (1 sqm = 10.7639 sqft)
  assert.equal(normalizeArea(80, 'magichomes'), Math.round(80 * 10.7639));
  assert.equal(normalizeArea(112, 'magichomes'), Math.round(112 * 10.7639));

  // MagicHomes 300+ is already sqft
  assert.equal(normalizeArea(850, 'magichomes'), 850);

  // Other websites are already sqft regardless of size
  assert.equal(normalizeArea(80, 'dwelling'), 80);
  assert.equal(normalizeArea(1200, 'zerobroker'), 1200);
});

test('normalizeRentalDeposit converts month multipliers and direct amounts', () => {
  // Value <= 10 represents number of months of rent
  assert.equal(normalizeRentalDeposit(2, 30000), 60000);
  assert.equal(normalizeRentalDeposit(6, 25000), 150000);

  // Value > 10 represents direct INR amount
  assert.equal(normalizeRentalDeposit(150000, 30000), 150000);
  assert.equal(normalizeRentalDeposit(50000, 20000), 50000);
});

test('parseTimestamp handles timezone-less and timezone-bearing strings', () => {
  // Timezone-less string parsed as IST (+05:30)
  const dt1 = parseTimestamp('2026-09-05T12:00:00');
  assert.equal(dt1.toISOString(), new Date('2026-09-05T12:00:00+05:30').toISOString());

  // String with UTC 'Z' suffix
  const dt2 = parseTimestamp('2026-09-05T12:00:00Z');
  assert.equal(dt2.toISOString(), '2026-09-05T12:00:00.000Z');

  // String with explicit offset
  const dt3 = parseTimestamp('2026-09-05T12:00:00+05:30');
  assert.equal(dt3.toISOString(), new Date('2026-09-05T12:00:00+05:30').toISOString());
});

test('isInLast7Days respects strict half-open interval boundaries', () => {
  // Exactly on lower boundary (inclusive)
  assert.equal(isInLast7Days('2026-09-03T00:00:00+05:30'), true);
  assert.equal(isInLast7Days('2026-09-03T00:00:00'), true);

  // 1 second before lower boundary (exclusive)
  assert.equal(isInLast7Days('2026-09-02T23:59:59+05:30'), false);
  assert.equal(isInLast7Days('2026-09-02T23:59:59'), false);

  // Middle of window
  assert.equal(isInLast7Days('2026-09-06T15:30:00+05:30'), true);
  assert.equal(isInLast7Days('2026-09-06T15:30:00'), true);

  // 1 second before upper boundary (inclusive)
  assert.equal(isInLast7Days('2026-09-09T23:59:59+05:30'), true);
  assert.equal(isInLast7Days('2026-09-09T23:59:59'), true);

  // Exactly on upper boundary (exclusive)
  assert.equal(isInLast7Days('2026-09-10T00:00:00+05:30'), false);
  assert.equal(isInLast7Days('2026-09-10T00:00:00'), false);

  // After upper boundary
  assert.equal(isInLast7Days('2026-09-10T00:00:01+05:30'), false);
});
