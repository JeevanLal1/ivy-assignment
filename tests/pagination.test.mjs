import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Validates a paginated page response and guards against non-advancing offsets and loops.
 */
function validatePageResponse({ pageData, previousOffset, previousIds, expectedLimit }) {
  if (!pageData || typeof pageData !== 'object') {
    throw new Error('Invalid response structure: expected object');
  }

  const { results, offset, limit, total, has_more } = pageData;

  if (!Array.isArray(results)) {
    throw new Error('Invalid response structure: results is not an array');
  }

  if (typeof offset !== 'number' || offset < 0) {
    throw new Error(`Invalid offset in metadata: ${offset}`);
  }

  if (previousOffset !== null && offset <= previousOffset) {
    throw new Error(`Offset failed to advance: previous=${previousOffset}, current=${offset}`);
  }

  const currentIds = results.map((r) => r.listing_id || r.project_id);
  if (previousIds && previousIds.length > 0 && currentIds.length > 0) {
    const isExactRepeat = currentIds.length === previousIds.length && currentIds.every((id, idx) => id === previousIds[idx]);
    if (isExactRepeat) {
      throw new Error(`Infinite loop detected: page returned identical IDs to previous page`);
    }
  }

  return {
    count: results.length,
    offset,
    limit,
    total,
    hasMore: Boolean(has_more),
    currentIds
  };
}

test('validatePageResponse accepts valid page metadata and advances offset', () => {
  const page1 = {
    results: [{ listing_id: 'L1' }, { listing_id: 'L2' }],
    offset: 0,
    limit: 50,
    total: 100,
    has_more: true
  };

  const res1 = validatePageResponse({
    pageData: page1,
    previousOffset: null,
    previousIds: null,
    expectedLimit: 50
  });

  assert.equal(res1.count, 2);
  assert.equal(res1.offset, 0);
  assert.equal(res1.hasMore, true);

  const page2 = {
    results: [{ listing_id: 'L3' }, { listing_id: 'L4' }],
    offset: 2,
    limit: 50,
    total: 100,
    has_more: false
  };

  const res2 = validatePageResponse({
    pageData: page2,
    previousOffset: res1.offset,
    previousIds: res1.currentIds,
    expectedLimit: 50
  });

  assert.equal(res2.count, 2);
  assert.equal(res2.offset, 2);
  assert.equal(res2.hasMore, false);
});

test('validatePageResponse detects repeating identical page IDs', () => {
  const page1 = {
    results: [{ listing_id: 'L1' }, { listing_id: 'L2' }],
    offset: 0,
    limit: 50,
    total: 100,
    has_more: true
  };

  assert.throws(
    () => {
      validatePageResponse({
        pageData: page1,
        previousOffset: -1,
        previousIds: ['L1', 'L2'],
        expectedLimit: 50
      });
    },
    { message: /Infinite loop detected/ }
  );
});

test('validatePageResponse detects non-advancing offsets', () => {
  const pageData = {
    results: [{ listing_id: 'L1' }],
    offset: 0,
    limit: 50,
    total: 100,
    has_more: true
  };

  assert.throws(
    () => {
      validatePageResponse({
        pageData,
        previousOffset: 0,
        previousIds: [],
        expectedLimit: 50
      });
    },
    { message: /Offset failed to advance/ }
  );
});
