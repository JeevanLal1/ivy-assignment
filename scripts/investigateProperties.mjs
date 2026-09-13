import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeArea } from '../shared/normalize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');

export function cleanApartmentName(name) {
  if (!name) return '';
  let cleaned = name.trim().toLowerCase();
  cleaned = cleaned.replace(/^the\s+/, '');
  cleaned = cleaned.replace(/\s+apartments?$/, '');
  cleaned = cleaned.replace(/\s+phase\s+\d+$/, '');
  cleaned = cleaned.replace(/[-_]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim();
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function run() {
  const listings = JSON.parse(await fs.readFile(path.resolve(dataDir, 'listings.raw.json'), 'utf-8'));
  console.log(`=== UNIQUE PHYSICAL PROPERTIES INVESTIGATION ===`);
  console.log(`Total listing records: ${listings.length}`);

  // Test Strategy 1: Raw apartment_name + locality + property_type + bedroom + floor + total_floors + facing_direction
  const rawKeyMap = new Map();
  for (const l of listings) {
    const k = `${l.apartment_name}|${l.locality}|${l.property_type}|${l.bedroom}|${l.floor}|${l.total_floors}|${l.facing_direction}`;
    if (!rawKeyMap.has(k)) rawKeyMap.set(k, []);
    rawKeyMap.get(k).push(l);
  }
  console.log(`\nStrategy 1 (Raw exact fields): ${rawKeyMap.size} unique keys`);

  // Test Strategy 2: Cleaned apartment name + locality + property_type + bedroom + floor + total_floors + facing_direction
  const cleanKeyMap = new Map();
  for (const l of listings) {
    const apt = cleanApartmentName(l.apartment_name);
    const loc = (l.locality || '').trim().toLowerCase();
    const type = (l.property_type || '').trim().toLowerCase();
    const facing = (l.facing_direction || '').trim().toLowerCase();
    const k = `${apt}|${loc}|${type}|${l.bedroom}|${l.floor}|${l.total_floors}|${facing}`;
    if (!cleanKeyMap.has(k)) cleanKeyMap.set(k, []);
    cleanKeyMap.get(k).push(l);
  }
  console.log(`Strategy 2 (Cleaned apartment name): ${cleanKeyMap.size} unique keys`);

  // Test Strategy 3: Cleaned name + loc + type + bedroom + floor + total_floors + facing_direction + normalized carpet_area (within 2% tolerance) + distance (< 150m)
  // Let's examine groups in Strategy 2 to see if carpet area or coordinates ever conflict!
  let areaConflicts = 0;
  let distConflicts = 0;
  let highConfGroups = 0;
  let recordsInHighConfGroups = 0;
  const duplicateClusters = [];

  for (const [key, group] of cleanKeyMap.entries()) {
    if (group.length > 1) {
      // Check consistency within group
      const areas = group.map(l => normalizeArea(l.carpet_area, l.website));
      const minArea = Math.min(...areas);
      const maxArea = Math.max(...areas);
      const areaDiffPct = (maxArea - minArea) / minArea;

      // Check coordinates
      let maxDist = 0;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          // If lat is corrupted (lat > 70), skip distance calculation or flag it
          if (group[i].latitude < 70 && group[j].latitude < 70) {
            const d = haversineDistanceMeters(group[i].latitude, group[i].longitude, group[j].latitude, group[j].longitude);
            if (d > maxDist) maxDist = d;
          }
        }
      }

      const isAreaConsistent = areaDiffPct <= 0.03; // within 3%
      const isDistConsistent = maxDist <= 200; // within 200m

      if (!isAreaConsistent) {
        areaConflicts++;
        // console.log(`Area conflict in key ${key}: diff ${(areaDiffPct*100).toFixed(1)}% (${minArea} to ${maxArea})`);
      }
      if (!isDistConsistent) {
        distConflicts++;
        // console.log(`Dist conflict in key ${key}: ${maxDist.toFixed(0)}m`);
      }

      if (isAreaConsistent && isDistConsistent) {
        highConfGroups++;
        recordsInHighConfGroups += group.length;
        duplicateClusters.push({ key, group, maxDist, areaDiffPct });
      }
    }
  }

  console.log(`\nDuplicate Group Analysis:`);
  console.log(`  Total multi-listing groups in Strategy 2: ${[...cleanKeyMap.values()].filter(g => g.length > 1).length}`);
  console.log(`  Groups with area divergence > 3%: ${areaConflicts}`);
  console.log(`  Groups with coordinate distance > 200m: ${distConflicts}`);
  console.log(`  HIGH CONFIDENCE duplicate groups: ${highConfGroups}`);
  console.log(`  Listing records in HIGH CONFIDENCE groups: ${recordsInHighConfGroups}`);

  // Calculate unique properties under HIGH CONFIDENCE rule:
  // Each high confidence duplicate group of size N represents 1 unique property (saving N - 1 duplicates).
  // Listings not in any high confidence group represent 1 property each.
  let duplicateRecordsEliminated = 0;
  for (const c of duplicateClusters) {
    duplicateRecordsEliminated += (c.group.length - 1);
  }
  const proposedUniqueProperties = listings.length - duplicateRecordsEliminated;
  console.log(`\nProposed Unique Properties count: ${proposedUniqueProperties}`);
  console.log(`(Formula: 3800 total records - ${duplicateRecordsEliminated} duplicate records = ${proposedUniqueProperties})`);

  // Let's inspect the groups with area or distance conflicts to see if any are legitimate separate properties
  console.log(`\n--- Inspecting Area / Distance Divergent Groups ---`);
  for (const [key, group] of cleanKeyMap.entries()) {
    if (group.length > 1) {
      const areas = group.map(l => normalizeArea(l.carpet_area, l.website));
      const minArea = Math.min(...areas);
      const maxArea = Math.max(...areas);
      const areaDiffPct = (maxArea - minArea) / minArea;

      let maxDist = 0;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].latitude < 70 && group[j].latitude < 70) {
            const d = haversineDistanceMeters(group[i].latitude, group[i].longitude, group[j].latitude, group[j].longitude);
            if (d > maxDist) maxDist = d;
          }
        }
      }

      if (areaDiffPct > 0.03 || maxDist > 200) {
        console.log(`\nConflict Group [${key}]: AreaDiff: ${(areaDiffPct*100).toFixed(1)}%, MaxDist: ${maxDist.toFixed(0)}m`);
        for (const l of group) {
          console.log(`  [${l.website}] ID: ${l.listing_id} | CarpetRaw: ${l.carpet_area} | CarpetNorm: ${normalizeArea(l.carpet_area, l.website).toFixed(1)} | Lat/Lng: ${l.latitude},${l.longitude} | Price: ${l.price}`);
        }
      }
    }
  }

  // Cross-portal distribution of duplicate groups:
  let crossPortal = 0;
  let samePortal = 0;
  for (const c of duplicateClusters) {
    const sites = new Set(c.group.map(l => l.website));
    if (sites.size > 1) crossPortal++;
    else samePortal++;
  }
  console.log(`\nCross-portal duplicate groups: ${crossPortal}`);
  console.log(`Same-portal duplicate groups: ${samePortal}`);
}

run().catch(console.error);
