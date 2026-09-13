import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env');
const envLocalPath = path.resolve(rootDir, '.env.local');

// Load .env and .env.local using built-in process.loadEnvFile (Node 20.12+) or dotenv fallback
function loadEnv() {
  const load = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    if (typeof process.loadEnvFile === 'function') {
      try {
        process.loadEnvFile(filePath);
      } catch (err) {
        console.warn(`[env] Warning: failed to load ${filePath} with process.loadEnvFile:`, err.message);
      }
    } else {
      try {
        import('dotenv').then((dotenv) => dotenv.config({ path: filePath }));
      } catch {
        // ignore
      }
    }
  };

  load(envPath);
  load(envLocalPath);
}

loadEnv();

export const BASE_URL = process.env.BASE_URL || 'https://solve.ivy.homes';
export const API_KEY = process.env.API_KEY || '';
export const DEMO_EMAIL = process.env.DEMO_EMAIL || '';
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '';
export const ASSIGNED_CITY = process.env.ASSIGNED_CITY || '';
export const ASSIGNED_LOCALITY = process.env.ASSIGNED_LOCALITY || '';

export function hasAuthConfig() {
  return Boolean(API_KEY && API_KEY !== 'IVY26-XXXXXXXXXXXX');
}

export function ensureAuthConfig() {
  const missing = [];
  if (!API_KEY || API_KEY === 'IVY26-XXXXXXXXXXXX') missing.push('API_KEY');
  if (!DEMO_EMAIL) missing.push('DEMO_EMAIL');
  if (!DEMO_PASSWORD || DEMO_PASSWORD === 'changeme') missing.push('DEMO_PASSWORD');
  if (!ASSIGNED_LOCALITY || ASSIGNED_LOCALITY === 'changeme') missing.push('ASSIGNED_LOCALITY');

  if (missing.length > 0) {
    throw new Error(
      `Missing or unconfigured environment variables in .env: ${missing.join(', ')}.\n` +
      'Please update your .env file with valid credentials provided by Ivy Homes.'
    );
  }
}

/**
 * Sanitizes strings, URLs, or objects to ensure API keys, tokens, and passwords are not printed.
 */
export function sanitize(input) {
  if (!input) return input;
  if (typeof input === 'string') {
    let result = input;
    if (API_KEY) {
      result = result.replaceAll(API_KEY, '[REDACTED_API_KEY]');
    }
    if (DEMO_PASSWORD) {
      result = result.replaceAll(DEMO_PASSWORD, '[REDACTED_PASSWORD]');
    }
    // Redact JWT or token-like patterns if present
    result = result.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_TOKEN]');
    return result;
  }
  if (typeof input === 'object') {
    try {
      const serialized = JSON.stringify(input, (key, value) => {
        if (/password|token|secret|key|authorization/i.test(key) && typeof value === 'string') {
          return '[REDACTED]';
        }
        return value;
      }, 2);
      return JSON.parse(sanitize(serialized));
    } catch {
      return '[Complex Object]';
    }
  }
  return input;
}

