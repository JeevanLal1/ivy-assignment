import { normalizeArea } from '../../../shared/normalize.mjs';

/**
 * Calculates a deterministic similarity score between two listings.
 * 
 * Weights:
 * - Locality match: 40 points
 * - Bedroom match: 25 points (adjacent bedroom: 10 points)
 * - Property type match: 20 points
 * - Price proximity (<= 20% diff: 10 pts, <= 40% diff: 5 pts)
 * - Carpet area proximity (<= 20% diff: 5 pts)
 * - Active listing bonus: 2 points
 * 
 * @param {object} current - Base listing
 * @param {object} candidate - Candidate listing to evaluate
 * @returns {number} Similarity score (-1 if self)
 */
export function scoreListingSimilarity(current, candidate) {
  if (!current || !candidate) return 0;
  if (candidate.listing_id === current.listing_id) return -1;

  let score = 0;

  // 1. Locality match
  if (
    current.locality &&
    candidate.locality &&
    current.locality.toLowerCase().trim() === candidate.locality.toLowerCase().trim()
  ) {
    score += 40;
  }

  // 2. Bedroom match
  if (current.bedroom !== undefined && candidate.bedroom !== undefined) {
    if (current.bedroom === candidate.bedroom) {
      score += 25;
    } else if (Math.abs(current.bedroom - candidate.bedroom) === 1) {
      score += 10;
    }
  }

  // 3. Property type match
  if (
    current.property_type &&
    candidate.property_type &&
    current.property_type.toLowerCase().trim() === candidate.property_type.toLowerCase().trim()
  ) {
    score += 20;
  }

  // 4. Price proximity
  if (current.price > 0 && candidate.price > 0) {
    const priceDiffRatio = Math.abs(current.price - candidate.price) / current.price;
    if (priceDiffRatio <= 0.2) {
      score += 10;
    } else if (priceDiffRatio <= 0.4) {
      score += 5;
    }
  }

  // 5. Carpet area proximity (after normalization)
  const curArea = normalizeArea(current.carpet_area, current.website);
  const candArea = normalizeArea(candidate.carpet_area, candidate.website);
  if (curArea > 0 && candArea > 0) {
    const areaDiffRatio = Math.abs(curArea - candArea) / curArea;
    if (areaDiffRatio <= 0.2) {
      score += 5;
    }
  }

  // Bonus: active listing
  if (candidate.is_live) {
    score += 2;
  }

  return score;
}

/**
 * Finds and ranks similar listings from a candidate collection.
 * 
 * @param {object} current - Target listing
 * @param {Array<object>} candidates - List of candidate listings
 * @param {number} [limit=6] - Max similar listings to return
 * @returns {Array<object>} Ranked similar listings
 */
export function findSimilarListings(current, candidates = [], limit = 6) {
  if (!current || !Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  return candidates
    .filter((c) => c && c.listing_id !== current.listing_id)
    .map((candidate) => ({
      listing: candidate,
      score: scoreListingSimilarity(current, candidate),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.listing);
}
