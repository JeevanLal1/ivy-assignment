import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MARKET_KPIS,
  CORRUPT_BREAKDOWN,
  PROJECT_AUDIT_BREAKDOWN,
  SYNDICATE_DATA,
  CONFIRMED_FINDINGS,
} from '../client/src/data/insightsData.js';

test('insightsData: MARKET_KPIS exactly matches submission answers and counts', () => {
  assert.equal(MARKET_KPIS.totalListings.value, 3800);
  assert.equal(MARKET_KPIS.uniqueProperties.value, 3230);
  assert.equal(MARKET_KPIS.activeListings.value, 2998);
  assert.equal(MARKET_KPIS.corruptListings.value, 28);
  assert.equal(MARKET_KPIS.magarpattaRent.value, 4855700);
  assert.equal(MARKET_KPIS.avgPricePerSqft2BHK.value, 10859.27);
  assert.equal(MARKET_KPIS.costliestProject.projectId, 'P30288');
  assert.equal(MARKET_KPIS.costliestProject.priceMaxInr, 44700000);
  assert.equal(MARKET_KPIS.recentListings.value, 128);
  assert.equal(MARKET_KPIS.fakeListings.value, 205);
  assert.equal(MARKET_KPIS.projectMismatch.value, 95);
});

test('insightsData: CORRUPT_BREAKDOWN accounts for exactly 28 corrupt records across 4 rules', () => {
  assert.equal(CORRUPT_BREAKDOWN.length, 4);
  const totalCorrupt = CORRUPT_BREAKDOWN.reduce((sum, item) => sum + item.count, 0);
  assert.equal(totalCorrupt, 28);

  for (const item of CORRUPT_BREAKDOWN) {
    assert.equal(item.count, 7);
  }
});

test('insightsData: PROJECT_AUDIT_BREAKDOWN accounts for exactly 95 mismatched projects', () => {
  assert.equal(PROJECT_AUDIT_BREAKDOWN.length, 3);
  const totalMismatches = PROJECT_AUDIT_BREAKDOWN.reduce((sum, item) => sum + item.count, 0);
  assert.equal(totalMismatches, 95);

  const staleZeros = PROJECT_AUDIT_BREAKDOWN.find((p) => p.category.includes('Stale'));
  const overReported = PROJECT_AUDIT_BREAKDOWN.find((p) => p.category.includes('Over'));
  const underReported = PROJECT_AUDIT_BREAKDOWN.find((p) => p.category.includes('Under'));

  assert.equal(staleZeros.count, 41);
  assert.equal(overReported.count, 48);
  assert.equal(underReported.count, 6);
});

test('insightsData: SYNDICATE_DATA accurately partitions 205 listings and preserves Finding 16 wording', () => {
  assert.equal(SYNDICATE_DATA.totalListings, 205);
  assert.equal(SYNDICATE_DATA.scamPhraseEvidence, 110);
  assert.equal(SYNDICATE_DATA.corroboratingListings, 95);
  assert.equal(SYNDICATE_DATA.scamPhraseEvidence + SYNDICATE_DATA.corroboratingListings, 205);
  assert.equal(SYNDICATE_DATA.burnerPhoneCount, 7);
  assert.equal(SYNDICATE_DATA.burnerPhones.length, 7);

  // Validate Finding 16 wording does not claim all 205 have scam phrases
  assert.ok(SYNDICATE_DATA.finding16Wording.includes('coordinated 7-broker syndicate'));
  assert.ok(SYNDICATE_DATA.finding16Wording.includes('corroborating scam-language evidence in 110 records'));
});

test('insightsData: CONFIRMED_FINDINGS contains all 16 verified findings', () => {
  assert.equal(CONFIRMED_FINDINGS.length, 16);
  for (const finding of CONFIRMED_FINDINGS) {
    assert.ok(finding.id);
    assert.ok(finding.title);
    assert.ok(finding.category);
    assert.ok(finding.documented);
    assert.ok(finding.actual);
    assert.ok(finding.impact);
  }
});
