import { normalizeArea } from './normalize.mjs';

/**
 * Known syndicate phone numbers operating lead-generation networks.
 * Cross-referenced across shared fictitious identities and price depressing patterns.
 */
export const SYNDICATE_PHONES = new Set([
  '+912009819040',
  '+912006085798',
  '+912006064871',
  '+912009027125',
  '+912001427722',
  '+912002255305',
  '+912009460980'
]);

export const SCAM_PHRASES = [
  'Pay a token amount',
  'Below market price, this week only',
  'Site visit only after the booking amount is paid'
];

/**
 * Checks for objective physical impossibilities (Corrupt listings).
 */
export function isNegativePrice(listing) {
  return typeof listing.price === 'number' && listing.price < 0;
}

export function isFloorExceedingTotal(listing) {
  return typeof listing.floor === 'number' &&
         typeof listing.total_floors === 'number' &&
         listing.total_floors > 0 &&
         listing.floor > listing.total_floors;
}

export function isSuperLessThanCarpet(listing) {
  if (typeof listing.carpet_area !== 'number' || typeof listing.super_built_up_area !== 'number') return false;
  const normCarpet = normalizeArea(listing.carpet_area, listing.website);
  const normSuper = normalizeArea(listing.super_built_up_area, listing.website);
  return normSuper < normCarpet;
}

export function isSwappedCoordinates(listing) {
  // Pune latitude is ~18.5, longitude is ~73.8
  // When swapped, latitude is > 70 and longitude is ~18
  return typeof listing.latitude === 'number' && listing.latitude > 70;
}

export function isZeroBedNonPlot(listing) {
  return listing.bedroom === 0 && listing.property_type !== 'plot';
}

/**
 * Returns the exact corruption rule violated if any, else null.
 * Strictly focuses on physical impossibilities.
 */
export function getCorruptionRule(listing) {
  if (isNegativePrice(listing)) {
    return { rule: 'negative_price', detail: `price = ${listing.price}` };
  }
  if (isFloorExceedingTotal(listing)) {
    return { rule: 'floor_exceeds_total_floors', detail: `floor ${listing.floor} of ${listing.total_floors}` };
  }
  if (isSuperLessThanCarpet(listing)) {
    const c = normalizeArea(listing.carpet_area, listing.website);
    const s = normalizeArea(listing.super_built_up_area, listing.website);
    return { rule: 'super_area_less_than_carpet_area', detail: `super ${s} sqft < carpet ${c} sqft` };
  }
  if (isSwappedCoordinates(listing)) {
    return { rule: 'impossible_geographic_coordinates', detail: `lat ${listing.latitude}, lng ${listing.longitude}` };
  }
  return null;
}

/**
 * Checks for fraudulent / fake lead-generation listing signals.
 */
export function isSyndicateListing(listing) {
  return SYNDICATE_PHONES.has(listing.posted_by_contact);
}

export function isTinyBaitPrice(listing) {
  return typeof listing.price === 'number' && listing.price > 0 && listing.price < 50000;
}

export function isFutureDated(listing, referenceMoment = '2026-09-10T00:00:00') {
  return typeof listing.posted_at === 'string' && listing.posted_at > referenceMoment;
}

export function hasScamPhrase(listing) {
  if (!listing.description) return false;
  return SCAM_PHRASES.some(phrase => listing.description.includes(phrase));
}

/**
 * Classifies a listing into: CORRUPT, FAKE, NEITHER, or UNRESOLVED.
 */
export function classifyListing(listing) {
  const corruptRule = getCorruptionRule(listing);
  if (corruptRule) {
    return { classification: 'CORRUPT', reason: corruptRule.rule, detail: corruptRule.detail };
  }

  if (isSyndicateListing(listing)) {
    return {
      classification: 'FAKE',
      reason: 'syndicate_lead_generation',
      detail: `phone ${listing.posted_by_contact}, hasScamPhrase: ${hasScamPhrase(listing)}`
    };
  }

  if (isTinyBaitPrice(listing)) {
    return {
      classification: 'UNRESOLVED', // Could be extreme bait or rental posted to sale
      reason: 'tiny_bait_price',
      detail: `price ${listing.price}`
    };
  }

  if (isZeroBedNonPlot(listing)) {
    return {
      classification: 'UNRESOLVED', // Could be structural corruption (0 bed, 0 bath in 1200 sqft)
      reason: 'zero_bed_non_plot',
      detail: `0 BHK ${listing.property_type} with 0 bath`
    };
  }

  if (isFutureDated(listing)) {
    return {
      classification: 'UNRESOLVED', // Impossible availability or metadata clock skew
      reason: 'future_posted_date',
      detail: `posted_at ${listing.posted_at}`
    };
  }

  return { classification: 'NEITHER', reason: 'normal_listing' };
}
