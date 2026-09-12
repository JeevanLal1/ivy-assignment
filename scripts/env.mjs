import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

// Load .env using built-in process.loadEnvFile (Node 20.12+) or dotenv fallback
if (typeof process.loadEnvFile === 'function') {
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} else {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: envPath });
  } catch {
    // Silently continue if dotenv is not present and rely on process.env
  }
}

export const BASE_URL = process.env.BASE_URL;
export const API_KEY = process.env.API_KEY;
export const DEMO_EMAIL = process.env.DEMO_EMAIL;
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
export const ASSIGNED_LOCALITY = process.env.ASSIGNED_LOCALITY;

if (!API_KEY) {
  throw new Error('API_KEY is missing. Please define API_KEY in your .env file.');
}
