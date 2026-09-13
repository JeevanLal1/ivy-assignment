/**
 * Reference moment for the assignment: 2026-09-10T00:00:00+05:30 (IST)
 */
export const REFERENCE_ISO = '2026-09-10T00:00:00+05:30';
export const REFERENCE_MS = Date.parse(REFERENCE_ISO);
export const SEVEN_DAYS_BEFORE_ISO = '2026-09-03T00:00:00+05:30';
export const SEVEN_DAYS_BEFORE_MS = Date.parse(SEVEN_DAYS_BEFORE_ISO);

/**
 * Safely parses a timestamp string.
 * - If timestamp contains 'Z' or a timezone offset, parses directly.
 * - If timestamp is timezone-less (e.g. 'YYYY-MM-DDTHH:mm:ss'), treats it as Asia/Kolkata (+05:30),
 *   matching the server's timezone from /health.
 *
 * @param {string} ts - Timestamp string
 * @returns {Date} Parsed Date object
 */
export function parseTimestamp(ts) {
  if (!ts || typeof ts !== 'string') {
    throw new Error(`Invalid timestamp: ${ts}`);
  }

  const trimmed = ts.trim();
  // Check if offset exists (+HH:MM, -HH:MM, or Z)
  if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // Timezone-less ISO format (e.g. 2026-04-30T14:57:00)
  // Server timezone is Asia/Kolkata (+05:30)
  return new Date(`${trimmed}+05:30`);
}

/**
 * Checks if a timestamp falls within the 7 days before REFERENCE:
 * Half-open interval: [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
 *
 * @param {string|Date} ts - Timestamp or Date object
 * @returns {boolean}
 */
export function isInLast7Days(ts) {
  const date = ts instanceof Date ? ts : parseTimestamp(ts);
  const time = date.getTime();
  return time >= SEVEN_DAYS_BEFORE_MS && time < REFERENCE_MS;
}
