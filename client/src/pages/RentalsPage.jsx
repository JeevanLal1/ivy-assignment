import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { rentalsService } from '../services/rentals.js';
import { RentalCard } from '../components/RentalCard.jsx';
import { formatTitleCase } from '../utils/format.js';

const LOCALITIES = [
  'aundh',
  'balewadi',
  'baner',
  'hadapsar',
  'hinjewadi',
  'kharadi',
  'kothrud',
  'magarpatta',
  'viman nagar',
  'wakad',
];

const DEFAULT_FILTERS = {
  locality: '',
  bhk: 'all',
  maxRent: '',
};

export function RentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [serverTotal, setServerTotal] = useState(0);

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Fetch rentals function
  const fetchRentalsData = useCallback(
    async (targetOffset, isReset = false) => {
      try {
        if (isReset) {
          setIsLoadingInitial(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const res = await rentalsService.getRentals({
          offset: targetOffset,
          limit: 50,
          locality: filters.locality || undefined,
          bedroom: filters.bhk !== 'all' && filters.bhk !== '4+' ? filters.bhk : undefined,
        });

        const newResults = res?.results || [];
        setServerTotal(res?.total || 0);

        setRentals((prev) => {
          if (isReset) return newResults;
          // Deduplicate by listing_id
          const existingIds = new Set(prev.map((r) => r.listing_id));
          const additions = newResults.filter((r) => !existingIds.has(r.listing_id));
          return [...prev, ...additions];
        });

        setOffset(targetOffset);
        setHasMore(Boolean(res?.has_more) && newResults.length > 0);
      } catch (err) {
        setError(err.message || 'Failed to fetch rentals. Please try again.');
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [filters.locality, filters.bhk]
  );

  // Re-fetch when server filters change
  useEffect(() => {
    fetchRentalsData(0, true);
  }, [fetchRentalsData]);

  // Load More handler
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchRentalsData(offset + 50, false);
    }
  };

  // Client-side filtering (e.g. for maxRent and 4+ BHK)
  const filteredRentals = useMemo(() => {
    return rentals.filter((rental) => {
      // Locality check
      if (filters.locality && rental.locality?.toLowerCase() !== filters.locality.toLowerCase()) {
        return false;
      }

      // Bedroom filter
      if (filters.bhk !== 'all') {
        if (filters.bhk === '4+') {
          if ((rental.bedroom || 0) < 4) return false;
        } else {
          if (rental.bedroom !== Number(filters.bhk)) return false;
        }
      }

      // Max Rent filter
      if (filters.maxRent !== '' && Number(filters.maxRent) > 0) {
        if ((rental.price || 0) > Number(filters.maxRent)) {
          return false;
        }
      }

      return true;
    });
  }, [rentals, filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pune Rental Properties</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore rental apartments and homes with normalized deposit calculation and verified live rates
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Locality Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Locality</label>
            <select
              value={filters.locality}
              onChange={(e) => setFilters((prev) => ({ ...prev, locality: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Pune Localities</option>
              {LOCALITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {formatTitleCase(loc)}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bedrooms</label>
            <select
              value={filters.bhk}
              onChange={(e) => setFilters((prev) => ({ ...prev, bhk: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All BHKs</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4+">4+ BHK</option>
            </select>
          </div>

          {/* Max Rent Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max Monthly Rent (₹)</label>
            <input
              type="number"
              placeholder="e.g. 35000"
              value={filters.maxRent}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxRent: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filter Bar Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredRentals.length}</span> rentals
            {serverTotal > 0 && ` of ~${serverTotal} available`}
          </div>
          {(filters.locality || filters.bhk !== 'all' || filters.maxRent !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4">
          <div className="text-xs font-medium">{error}</div>
          <button
            type="button"
            onClick={() => fetchRentalsData(offset, offset === 0)}
            className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Initial Skeleton Loading */}
      {isLoadingInitial && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse"
            >
              <div className="h-36 bg-slate-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-8 bg-slate-100 rounded"></div>
                  <div className="h-8 bg-slate-100 rounded"></div>
                  <div className="h-8 bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!isLoadingInitial && filteredRentals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRentals.map((rental) => (
            <RentalCard key={rental.listing_id} rental={rental} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingInitial && filteredRentals.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching rentals found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try loosening your filters or resetting to see all available rental properties in Pune.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* Load More & Pagination Controls */}
      {!isLoadingInitial && filteredRentals.length > 0 && (
        <div className="pt-6 pb-6 flex flex-col items-center gap-3">
          {hasMore ? (
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={handleLoadMore}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more rentals...</span>
                </>
              ) : (
                <span>Load More Rentals</span>
              )}
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium">All matching rentals loaded</div>
          )}
        </div>
      )}
    </div>
  );
}
