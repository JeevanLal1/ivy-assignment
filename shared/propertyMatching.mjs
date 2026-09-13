import { normalizeArea } from './normalize.mjs';

/**
 * Normalizes apartment name for robust cross-portal matching.
 * Handles common portal scraping variations:
 * - Leading "The "
 * - Trailing " Apartments" / " Apartment"
 * - Trailing " Phase X"
 * - Hyphens / underscores / excessive whitespace
 */
export function cleanApartmentName(name) {
  if (!name || typeof name !== 'string') return '';
  let cleaned = name.trim().toLowerCase();
  cleaned = cleaned.replace(/^the\s+/, '');
  cleaned = cleaned.replace(/\s+apartments?$/, '');
  cleaned = cleaned.replace(/\s+phase\s+\d+$/, '');
  cleaned = cleaned.replace(/[-_]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim();
}

/**
 * Calculates great-circle distance between two coordinates in meters.
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  // If coordinates are obviously invalid / swapped (e.g. lat > 70), distance is undefined
  if (lat1 > 70 || lat2 > 70) return Infinity;

  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates the deterministic property identity key.
 */
export function generatePropertyKey(listing) {
  const apt = cleanApartmentName(listing.apartment_name);
  const loc = (listing.locality || '').trim().toLowerCase();
  const type = (listing.property_type || '').trim().toLowerCase();
  const facing = (listing.facing_direction || '').trim().toLowerCase();
  const bhk = listing.bedroom ?? 0;
  const floor = listing.floor ?? 0;
  const totalFloors = listing.total_floors ?? 0;

  return `${apt}|${loc}|${type}|${bhk}|${floor}|${totalFloors}|${facing}`;
}

/**
 * Clusters a list of listings into distinct physical properties.
 * 
 * Multi-signal corroboration rules:
 * 1. Primary grouping key: cleaned apartment name, locality, property type,
 *    bedroom count, unit floor, total floors, facing direction.
 * 2. Secondary corroboration:
 *    - Normalized carpet area within ±3% tolerance
 *    - Coordinate distance <= 200m
 */
export function clusterProperties(listings, options = {}) {
  const areaTolerance = options.areaTolerance ?? 0.03; // 3%
  const maxDistanceMeters = options.maxDistanceMeters ?? 200; // 200m

  const groups = new Map();
  for (const listing of listings) {
    const key = generatePropertyKey(listing);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(listing);
  }

  const highConfidenceClusters = [];
  const unresolvedClusters = [];
  let duplicateCount = 0;

  for (const [key, group] of groups.entries()) {
    if (group.length === 1) {
      continue;
    }

    // Secondary validation: carpet area and distance
    const normAreas = group.map(l => normalizeArea(l.carpet_area, l.website));
    const minArea = Math.min(...normAreas);
    const maxArea = Math.max(...normAreas);
    const areaDiff = minArea > 0 ? (maxArea - minArea) / minArea : 0;

    let maxDist = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const d = haversineDistanceMeters(group[i].latitude, group[i].longitude, group[j].latitude, group[j].longitude);
        if (d !== Infinity && d > maxDist) maxDist = d;
      }
    }

    if (areaDiff <= areaTolerance && maxDist <= maxDistanceMeters) {
      highConfidenceClusters.push({ key, listings: group, areaDiff, maxDist });
      duplicateCount += (group.length - 1);
    } else {
      unresolvedClusters.push({ key, listings: group, areaDiff, maxDist });
    }
  }

  const uniqueCount = listings.length - duplicateCount;

  return {
    totalListings: listings.length,
    totalGroups: groups.size,
    uniqueCount,
    highConfidenceClusters,
    unresolvedClusters,
    duplicateCount
  };
}
