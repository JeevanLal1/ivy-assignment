import { normalizeArea, normalizeProjectPrice } from './normalize.mjs';

/**
 * Computes price per square foot for a listing.
 *
 * @param {object} listing
 * @param {number} listing.price - Normalized price in INR
 * @param {number} listing.carpet_area - Raw carpet area
 * @param {string} [listing.website] - Source website
 * @returns {number|null} Price per sqft or null if invalid
 */
export function computePricePerSqft(listing) {
  if (!listing || typeof listing.price !== 'number' || listing.price <= 0) {
    return null;
  }
  const areaSqft = normalizeArea(listing.carpet_area, listing.website);
  if (!areaSqft || areaSqft <= 0) {
    return null;
  }
  return listing.price / areaSqft;
}

/**
 * Calculates average price per sqft for live 2BHK listings excluding corrupt and fake listings.
 * Calculates arithmetic mean of individual ratios, rounded to 2 decimal places.
 *
 * @param {Array<object>} listings
 * @param {Set<string>|Array<string>} corruptIds
 * @param {Set<string>|Array<string>} fakeIds
 * @returns {{ qualifyingCount: number, excludedCorrupt: number, excludedFake: number, averagePricePerSqft: number }}
 */
export function computeAveragePricePerSqft2BHK(listings, corruptIds = new Set(), fakeIds = new Set()) {
  const corruptSet = corruptIds instanceof Set ? corruptIds : new Set(corruptIds);
  const fakeSet = fakeIds instanceof Set ? fakeIds : new Set(fakeIds);

  const live2BHK = listings.filter(l => l.is_live === true && l.bedroom === 2);
  let excludedCorrupt = 0;
  let excludedFake = 0;
  const qualifying = [];

  for (const l of live2BHK) {
    if (corruptSet.has(l.listing_id)) {
      excludedCorrupt++;
    } else if (fakeSet.has(l.listing_id)) {
      excludedFake++;
    } else {
      qualifying.push(l);
    }
  }

  if (qualifying.length === 0) {
    return { qualifyingCount: 0, excludedCorrupt, excludedFake, averagePricePerSqft: 0 };
  }

  const ratios = qualifying.map(l => computePricePerSqft(l)).filter(r => r !== null);
  const sum = ratios.reduce((acc, val) => acc + val, 0);
  const mean = sum / ratios.length;
  const averagePricePerSqft = Math.round(mean * 100) / 100;

  return {
    qualifyingCount: qualifying.length,
    excludedCorrupt,
    excludedFake,
    averagePricePerSqft
  };
}

/**
 * Calculates sum of monthly rent for all retrievable rental records in assigned locality.
 *
 * @param {Array<object>} rentals
 * @param {string} assignedLocality
 * @returns {{ count: number, totalMonthlyRent: number }}
 */
export function computeTotalMonthlyRent(rentals, assignedLocality) {
  const target = (assignedLocality || '').trim().toLowerCase();
  const matching = rentals.filter(r => (r.locality || '').trim().toLowerCase() === target);
  const totalMonthlyRent = matching.reduce((sum, r) => sum + (typeof r.price === 'number' ? r.price : 0), 0);

  return {
    count: matching.length,
    totalMonthlyRent
  };
}

/**
 * Finds the project with the highest normalized price_max.
 *
 * @param {Array<object>} projects
 * @returns {{ project_id: string, price_max_inr: number }}
 */
export function findCostliestProject(projects) {
  let highestProject = null;
  let highestPriceInr = -1;

  for (const p of projects) {
    const normPrice = normalizeProjectPrice(p.price_max);
    if (normPrice > highestPriceInr) {
      highestPriceInr = normPrice;
      highestProject = p;
    }
  }

  return {
    project_id: highestProject ? highestProject.project_id : '',
    price_max_inr: highestPriceInr
  };
}

/**
 * Counts projects where total_listings differs from actual live linked listings count.
 *
 * @param {Array<object>} projects
 * @param {Array<object>} listings
 * @returns {{ totalProjects: number, matchingProjects: number, wrongCount: number, staleZeroes: number, phantomOverreported: number, underreported: number }}
 */
export function countProjectsWithWrongListingCount(projects, listings) {
  const liveLinkedCounts = new Map();
  for (const l of listings) {
    if (l.project_id && l.is_live === true) {
      liveLinkedCounts.set(l.project_id, (liveLinkedCounts.get(l.project_id) || 0) + 1);
    }
  }

  let wrongCount = 0;
  let staleZeroes = 0;
  let phantomOverreported = 0;
  let underreported = 0;

  for (const p of projects) {
    const actualLive = liveLinkedCounts.get(p.project_id) || 0;
    const reported = p.total_listings ?? 0;

    if (reported !== actualLive) {
      wrongCount++;
      if (reported === 0 && actualLive > 0) staleZeroes++;
      else if (reported > actualLive) phantomOverreported++;
      else underreported++;
    }
  }

  return {
    totalProjects: projects.length,
    matchingProjects: projects.length - wrongCount,
    wrongCount,
    staleZeroes,
    phantomOverreported,
    underreported
  };
}
