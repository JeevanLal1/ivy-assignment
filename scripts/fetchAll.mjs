import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAuthConfig, DEMO_EMAIL, DEMO_PASSWORD } from './env.mjs';
import { request } from './http.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, 'data');

class SessionManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = 0;
  }

  async login() {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD }
    });

    if (res.status !== 200 || !res.json?.access_token) {
      throw new Error(`Login failed (status ${res.status}): ${JSON.stringify(res.json || res.text)}`);
    }

    this.accessToken = res.json.access_token;
    this.refreshToken = res.json.refresh_token;
    const expiresIn = res.json.expires_in || 900;
    this.expiresAt = Date.now() + (expiresIn - 60) * 1000;
  }

  async getToken() {
    if (!this.accessToken) {
      await this.login();
      return this.accessToken;
    }

    if (Date.now() >= this.expiresAt) {
      if (this.refreshToken) {
        try {
          const res = await request('/auth/refresh', {
            method: 'POST',
            body: { refresh_token: this.refreshToken }
          });
          if (res.status === 200 && res.json?.access_token) {
            this.accessToken = res.json.access_token;
            if (res.json.refresh_token) this.refreshToken = res.json.refresh_token;
            const expiresIn = res.json.expires_in || 900;
            this.expiresAt = Date.now() + (expiresIn - 60) * 1000;
            return this.accessToken;
          }
        } catch {
          // fallback to login
        }
      }
      await this.login();
    }

    return this.accessToken;
  }
}

const session = new SessionManager();

/**
 * Fetch an entire collection using offset/limit pagination.
 *
 * @param {string} endpoint - e.g. '/v1/listings'
 * @param {string} idField - 'listing_id' or 'project_id'
 * @param {string} name - dataset identifier
 */
async function fetchDataset(endpoint, idField, name) {
  console.log(`\n========================================`);
  console.log(`Starting full retrieval: ${endpoint} (${name})`);
  console.log(`========================================`);

  let offset = 0;
  const limit = 50;
  const allRecords = [];
  const requestHistory = [];
  let previousIds = null;
  let previousOffset = null;
  let serverTotal = null;

  while (true) {
    const token = await session.getToken();

    let res;
    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        res = await request(endpoint, {
          token,
          query: { offset, limit }
        });

        if (res.status === 200) {
          break;
        } else if (res.status === 429) {
          const delay = Math.pow(2, attempts) * 1000;
          console.warn(`[429 Rate Limit] Backing off for ${delay}ms (attempt ${attempts}/${maxAttempts})...`);
          await new Promise((r) => setTimeout(r, delay));
        } else if (res.status >= 500) {
          const delay = 1000 * attempts;
          console.warn(`[${res.status} Server Error] Retrying after ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw new Error(`Unexpected status ${res.status} on ${endpoint}?offset=${offset}: ${JSON.stringify(res.json || res.text)}`);
        }
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    if (!res || res.status !== 200 || !res.json) {
      throw new Error(`Failed to retrieve page at offset ${offset} after ${maxAttempts} attempts.`);
    }

    const { results, offset: returnedOffset, limit: returnedLimit, total, has_more, count } = res.json;

    if (!Array.isArray(results)) {
      throw new Error(`API returned non-array results at offset ${offset}`);
    }

    if (serverTotal === null) {
      serverTotal = total;
      console.log(`Server reports total records: ${serverTotal}`);
    } else if (serverTotal !== total) {
      console.warn(`[Warning] Total records shifted during pagination: initial=${serverTotal}, current=${total}`);
    }

    // Safety checks
    if (previousOffset !== null && returnedOffset <= previousOffset && results.length > 0) {
      throw new Error(`Non-advancing offset detected: previous=${previousOffset}, returned=${returnedOffset}`);
    }

    const currentIds = results.map((r) => r[idField]);
    if (previousIds && previousIds.length > 0 && currentIds.length > 0) {
      const isLoop = currentIds.length === previousIds.length && currentIds.every((id, i) => id === previousIds[i]);
      if (isLoop) {
        throw new Error(`Infinite loop detected at offset ${offset}: identical record IDs returned.`);
      }
    }

    const pageCount = results.length;
    requestHistory.push({
      requestedOffset: offset,
      returnedOffset,
      returnedLimit,
      count: pageCount,
      has_more,
      firstId: currentIds[0] || null,
      lastId: currentIds[currentIds.length - 1] || null
    });

    // Append raw records without deduplication
    for (const record of results) {
      allRecords.push(record);
    }

    console.log(`Fetched offset=${returnedOffset.toString().padStart(4, ' ')} | count=${pageCount.toString().padStart(2, ' ')} | progress=${allRecords.length}/${serverTotal} | has_more=${has_more}`);

    previousOffset = returnedOffset;
    previousIds = currentIds;

    // Check termination conditions: stop strictly when has_more is false or page is empty
    if (has_more === false || pageCount === 0) {
      console.log(`Termination condition met: has_more=${has_more}, pageCount=${pageCount}, totalRetrieved=${allRecords.length}`);
      break;
    }

    offset += pageCount;
  }

  // Completeness & duplicate analysis
  const idCounts = new Map();
  for (const r of allRecords) {
    const id = r[idField];
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }

  const repeatedIds = [];
  for (const [id, cnt] of idCounts.entries()) {
    if (cnt > 1) {
      repeatedIds.push({ id, count: cnt });
    }
  }

  const metadata = {
    dataset: name,
    endpoint,
    idField,
    retrieved_at: new Date().toISOString(),
    server_reported_total: serverTotal,
    downloaded_records: allRecords.length,
    unique_ids: idCounts.size,
    repeated_ids_count: repeatedIds.length,
    repeated_ids: repeatedIds,
    first_offset: requestHistory[0]?.requestedOffset ?? null,
    last_offset: requestHistory[requestHistory.length - 1]?.requestedOffset ?? null,
    first_id: allRecords[0]?.[idField] ?? null,
    last_id: allRecords[allRecords.length - 1]?.[idField] ?? null,
    requests_made: requestHistory.length,
    matches_server_total: allRecords.length === serverTotal,
    request_history: requestHistory
  };

  // Write raw dataset to data/${name}.raw.json
  await fs.mkdir(dataDir, { recursive: true });
  const dataFilePath = path.resolve(dataDir, `${name}.raw.json`);
  const metaFilePath = path.resolve(dataDir, `${name}.meta.json`);

  await fs.writeFile(dataFilePath, JSON.stringify(allRecords, null, 2), 'utf-8');
  await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(`Saved ${allRecords.length} raw records to ${path.relative(rootDir, dataFilePath)}`);
  console.log(`Saved retrieval metadata to ${path.relative(rootDir, metaFilePath)}`);

  return metadata;
}

async function main() {
  ensureAuthConfig();

  console.log('=== Ivy Homes Dataset Full Retrieval ===');
  console.log(`Destination Directory: ${dataDir}`);

  // Fetch all 3 collections
  const listingsMeta = await fetchDataset('/v1/listings', 'listing_id', 'listings');
  const rentalsMeta = await fetchDataset('/v1/rentals', 'listing_id', 'rentals');
  const projectsMeta = await fetchDataset('/v1/projects', 'project_id', 'projects');

  const manifest = {
    generated_at: new Date().toISOString(),
    datasets: {
      listings: listingsMeta,
      rentals: rentalsMeta,
      projects: projectsMeta
    }
  };

  const manifestPath = path.resolve(dataDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nAll datasets fetched successfully! Manifest written to ${path.relative(rootDir, manifestPath)}`);
}

main().catch((err) => {
  console.error('\n[FATAL ERROR during retrieval]:', err);
  process.exit(1);
});
