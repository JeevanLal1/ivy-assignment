import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isNegativePrice,
  isFloorExceedingTotal,
  isSuperLessThanCarpet,
  isSwappedCoordinates,
  isZeroBedNonPlot,
  isFutureDated,
  isTinyBaitPrice
} from '../shared/anomalyRules.mjs';
import { normalizeArea } from '../shared/normalize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');

async function run() {
  const listings = JSON.parse(await fs.readFile(path.resolve(dataDir, 'listings.raw.json'), 'utf-8'));
  console.log(`====================================================`);
  console.log(`PART 2 — QUESTION 4: CORRUPT / IMPOSSIBLE LISTINGS`);
  console.log(`Total listings inspected: ${listings.length}`);
  console.log(`====================================================\n`);

  // Rule 1: Negative price
  const negPrice = listings.filter(isNegativePrice);
  console.log(`RULE 1: Negative Price (${negPrice.length} records) [CONFIRMED PHYSICAL IMPOSSIBILITY]`);
  for (const l of negPrice) {
    console.log(`  ID: ${l.listing_id} | price: ${l.price} | apt: ${l.apartment_name} | site: ${l.website}`);
  }

  // Rule 2: Floor > total_floors
  const floorExceeds = listings.filter(isFloorExceedingTotal);
  console.log(`\nRULE 2: Floor Exceeds Total Floors (${floorExceeds.length} records) [CONFIRMED PHYSICAL IMPOSSIBILITY]`);
  for (const l of floorExceeds) {
    console.log(`  ID: ${l.listing_id} | floor: ${l.floor} of ${l.total_floors} | apt: ${l.apartment_name} | site: ${l.website}`);
  }

  // Rule 3: Super built-up area < Carpet area
  const superLess = listings.filter(isSuperLessThanCarpet);
  console.log(`\nRULE 3: Super Built-up < Carpet Area (${superLess.length} records) [CONFIRMED PHYSICAL IMPOSSIBILITY]`);
  for (const l of superLess) {
    const c = normalizeArea(l.carpet_area, l.website);
    const s = normalizeArea(l.super_built_up_area, l.website);
    console.log(`  ID: ${l.listing_id} | super: ${s.toFixed(0)} sqft < carpet: ${c.toFixed(0)} sqft | site: ${l.website}`);
  }

  // Rule 4: Swapped geographic coordinates (lat > 70)
  const swappedCoords = listings.filter(isSwappedCoordinates);
  console.log(`\nRULE 4: Impossible Geographic Coordinates (${swappedCoords.length} records) [CONFIRMED PHYSICAL IMPOSSIBILITY]`);
  for (const l of swappedCoords) {
    console.log(`  ID: ${l.listing_id} | lat: ${l.latitude}, lng: ${l.longitude} (swapped coordinates) | site: ${l.website}`);
  }

  // High-Confidence Defensible Corrupt Listings (4 physical rules * 7 records = 28 records)
  const coreCorruptMap = new Map();
  for (const l of [...negPrice, ...floorExceeds, ...superLess, ...swappedCoords]) {
    coreCorruptMap.set(l.listing_id, l);
  }
  const coreCorruptIds = [...coreCorruptMap.keys()].sort();

  console.log(`\n====================================================`);
  console.log(`CORE DEFENSIBLE CORRUPT LISTING IDS (${coreCorruptIds.length} records):`);
  console.log(JSON.stringify(coreCorruptIds, null, 2));

  // Edge Cases / Rejected Candidates Analysis:
  console.log(`\n====================================================`);
  console.log(`EDGE CASES & REJECTED CANDIDATES INVESTIGATION`);
  console.log(`====================================================`);

  // Rejected Candidate Set 1: Tiny/Bait Prices (< 50,000 INR)
  const tinyPrices = listings.filter(isTinyBaitPrice);
  console.log(`\n1. Tiny / Bait Prices (< 50k INR): ${tinyPrices.length} records [REJECTED FROM CORRUPT]`);
  console.log(`   Rationale: Prompt explicitly forbids classifying listings as corrupt merely because price is unusually low.`);
  for (const l of tinyPrices) {
    console.log(`   ID: ${l.listing_id} | price: ${l.price} | apt: ${l.apartment_name}`);
  }

  // Rejected Candidate Set 2: Future Posted Date (> 2026-09-10)
  const futureDates = listings.filter(l => isFutureDated(l));
  console.log(`\n2. Future Posted Dates (> 2026-09-10): ${futureDates.length} records [REJECTED FROM CORRUPT / UNRESOLVED]`);
  console.log(`   Rationale: Future dates are chronological/metadata anomalies or impossible availability patterns, not physical property impossibilities.`);
  for (const l of futureDates) {
    console.log(`   ID: ${l.listing_id} | posted_at: ${l.posted_at} | apt: ${l.apartment_name}`);
  }

  // Rejected / Unresolved Candidate Set 3: 0 BHK Non-Plot with 0 Bathrooms
  const zeroBedNonPlot = listings.filter(isZeroBedNonPlot);
  console.log(`\n3. 0 BHK Non-Plot with 0 Bathrooms: ${zeroBedNonPlot.length} records [STRUCTURAL ANOMALY / UNRESOLVED]`);
  console.log(`   Rationale: Inconsistent bedroom/property-type and 0 bathrooms in a ~1000 sqft apartment. Could be architectural impossibility or data entry flaw.`);
  for (const l of zeroBedNonPlot) {
    console.log(`   ID: ${l.listing_id} | type: ${l.property_type} | bed: ${l.bedroom} | bath: ${l.bathroom} | desc: "${l.description.slice(0, 50)}..."`);
  }
}

run().catch(console.error);
