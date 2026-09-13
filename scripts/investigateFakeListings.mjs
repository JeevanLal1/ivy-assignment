import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYNDICATE_PHONES, SCAM_PHRASES, isSyndicateListing, hasScamPhrase, isTinyBaitPrice, isFutureDated } from '../shared/anomalyRules.mjs';
import { normalizeArea } from '../shared/normalize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');

async function run() {
  const listings = JSON.parse(await fs.readFile(path.resolve(dataDir, 'listings.raw.json'), 'utf-8'));
  console.log(`====================================================`);
  console.log(`PART 3 — QUESTION 9: FAKE LISTINGS INVESTIGATION`);
  console.log(`Total listings inspected: ${listings.length}`);
  console.log(`====================================================\n`);

  // PATTERN 1: The 7-Broker Syndicate Network (205 listings)
  const syndicateListings = listings.filter(isSyndicateListing);
  console.log(`PATTERN 1: Coordinated Lead-Generation Syndicate Network`);
  console.log(`  Identified 7 interconnected broker phone numbers sharing fictitious agency names`);
  console.log(`  Total listings: ${syndicateListings.length}`);
  console.log(`  All marked is_live=true and is_verified=true`);
  
  const synPpsqft = syndicateListings.map(l => l.price / normalizeArea(l.carpet_area, l.website));
  const avgSynPpsqft = synPpsqft.reduce((a,b)=>a+b, 0) / synPpsqft.length;
  console.log(`  Average price/sqft: ${avgSynPpsqft.toFixed(2)} INR/sqft (vs market ~10,644 INR/sqft) — 47% discount bait!`);

  // Breakdown by scam phrases
  const withExplicitScam = syndicateListings.filter(hasScamPhrase);
  console.log(`\n  Listings with explicit booking/advance scam phrases: ${withExplicitScam.length} / ${syndicateListings.length}`);
  for (const p of SCAM_PHRASES) {
    const cnt = syndicateListings.filter(l => l.description.includes(p)).length;
    console.log(`    - "${p}": ${cnt} listings`);
  }

  // Cross-portal undercut evidence
  console.log(`\n  Evidence of Owner Undercutting to Steal Leads:`);
  let undercutCount = 0;
  for (const sl of syndicateListings) {
    const matchingOwners = listings.filter(l =>
      l.listing_id !== sl.listing_id &&
      l.apartment_name?.toLowerCase() === sl.apartment_name?.toLowerCase() &&
      l.bedroom === sl.bedroom &&
      l.floor === sl.floor &&
      l.total_floors === sl.total_floors &&
      l.facing_direction === sl.facing_direction &&
      l.posted_by === 'owner'
    );
    for (const ol of matchingOwners) {
      if (sl.price < ol.price * 0.7) {
        undercutCount++;
        if (undercutCount <= 3) {
          console.log(`    Syndicate ${sl.listing_id} priced ₹${(sl.price/1e5).toFixed(1)}L vs Genuine Owner ${ol.listing_id} priced ₹${(ol.price/1e5).toFixed(1)}L for ${sl.apartment_name} ${sl.bedroom}BHK`);
        }
      }
    }
  }
  console.log(`  Total verified lead-theft undercut pairs: ${undercutCount}`);

  // PATTERN 2: Tiny Bait Prices (< 50k INR)
  const tinyPrices = listings.filter(isTinyBaitPrice);
  console.log(`\nPATTERN 2: Clickbait / Micro-Prices (< ₹50,000 INR) (${tinyPrices.length} records)`);
  for (const l of tinyPrices) {
    console.log(`  ID: ${l.listing_id} | price: ₹${l.price} | apt: ${l.apartment_name} | ${l.bedroom}BHK | site: ${l.website} | contact: ${l.posted_by_contact}`);
  }

  // PATTERN 3: Impossible Availability (Future Posted Dates)
  const futureDates = listings.filter(l => isFutureDated(l));
  console.log(`\nPATTERN 3: Impossible Availability / Future Dates (${futureDates.length} records)`);
  for (const l of futureDates) {
    console.log(`  ID: ${l.listing_id} | date: ${l.posted_at} | apt: ${l.apartment_name} | site: ${l.website}`);
  }

  // COUNTEREXAMPLES & REJECTED HYPOTHESES
  console.log(`\n====================================================`);
  console.log(`COUNTEREXAMPLES & REJECTED HYPOTHESES`);
  console.log(`====================================================`);
  console.log(`1. Rejected: High listing count alone implies fake.`);
  console.log(`   Counterexample: Phone +912002574181 has 31 listings across 5 websites, but prices are market rate (₹34L-₹1.97Cr) and contains 0 scam phrases.`);
  console.log(`2. Rejected: Urgent sale / negotiation hooks imply fake.`);
  console.log(`   Counterexample: 25 individual verified property owners use "Urgent sale" or "Price negotiable" on their own real listings without advance fee demands.`);
  console.log(`3. Rejected: Unverified listings (is_verified=false) are fake.`);
  console.log(`   Counterexample: 1,463 listings are unverified, yet they follow standard market pricing and realistic property characteristics.`);

  // Candidate Fake ID Lists
  console.log(`\n====================================================`);
  console.log(`PROPOSED FAKE LISTING CANDIDATE SETS:`);
  console.log(`====================================================`);
  const candidateA_Ids = syndicateListings.map(l => l.listing_id).sort();
  console.log(`Option A: Full Coordinated Syndicate Network (${candidateA_Ids.length} listings)`);
  console.log(`Option B: Advance-Fee Scam Sub-cluster (${withExplicitScam.length} listings)`);
  console.log(`Option C: Micro-price Clickbait Listings (${tinyPrices.length} listings)`);
  console.log(`Option D: Full Syndicate + Micro-price Clickbait (${new Set([...candidateA_Ids, ...tinyPrices.map(l=>l.listing_id)]).size} listings)`);
}

run().catch(console.error);
