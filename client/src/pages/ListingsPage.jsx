import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { listingsService } from '../services/listings.js';
import { savedService } from '../services/saved.js';
import { ListingCard } from '../components/ListingCard.jsx';
import { ListingFilters } from '../components/ListingFilters.jsx';

const DEFAULT_FILTERS = {
  locality: '',
  bhk: 'all',
  property_type: 'all',
  furnishing: 'all',
  minPrice: '',
  maxPrice: '',
  liveOnly: true,
};

export function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [serverTotal, setServerTotal] = useState(0);

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // 1. Load initial saved IDs for the current user
  useEffect(() => {
    let isMounted = true;
    savedService
      .getSavedListings()
      .then((saved) => {
        if (isMounted && Array.isArray(saved)) {
          const ids = new Set(saved.map((r) => r.listing_id || r.id).filter(Boolean));
          setSavedIds(ids);
        }
      })
      .catch((err) => {
        console.warn('Failed to load saved listings:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch listings function
  const fetchListingsData = useCallback(
    async (targetOffset, isReset = false) => {
      try {
        if (isReset) {
          setIsLoadingInitial(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const res = await listingsService.getListings({
          offset: targetOffset,
          limit: 50,
          locality: filters.locality,
          bhk: filters.bhk !== 'all' && filters.bhk !== '4+' ? filters.bhk : undefined,
          property_type: filters.property_type !== 'all' ? filters.property_type : undefined,
          furnishing: filters.furnishing !== 'all' ? filters.furnishing : undefined,
        });

        const newResults = res?.results || [];
        setServerTotal(res?.total || 0);

        setListings((prev) => {
          if (isReset) return newResults;
          // Deduplicate by listing_id when appending
          const existingIds = new Set(prev.map((l) => l.listing_id));
          const additions = newResults.filter((l) => !existingIds.has(l.listing_id));
          return [...prev, ...additions];
        });

        setOffset(targetOffset);
        setHasMore(Boolean(res?.has_more) && newResults.length > 0);
      } catch (err) {
        setError(err.message || 'Failed to fetch listings. Please try again.');
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [filters.locality, filters.bhk, filters.property_type, filters.furnishing]
  );

  // Re-fetch when server filters change
  useEffect(() => {
    fetchListingsData(0, true);
  }, [fetchListingsData]);

  // Load More handler
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchListingsData(offset + 50, false);
    }
  };

  // Toggle Save handler
  const handleToggleSave = async (listingId) => {
    if (!listingId || savingId) return;

    const isCurrentlySaved = savedIds.has(listingId);
    setSavingId(listingId);

    // Optimistic UI update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(listingId);
      else next.add(listingId);
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await savedService.removeListing(listingId);
      } else {
        await savedService.saveListing(listingId);
      }
    } catch (err) {
      console.error('Save toggle error:', err);
      // Revert optimistic update on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  // 3. Client-side filtering for attributes where client enforcement guarantees correctness
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // Live status filter
      if (filters.liveOnly && listing.is_live !== true) {
        return false;
      }

      // Bedroom filter
      if (filters.bhk !== 'all') {
        if (filters.bhk === '4+') {
          if ((listing.bedroom || 0) < 4) return false;
        } else {
          if (listing.bedroom !== Number(filters.bhk)) return false;
        }
      }

      // Price range filters
      if (filters.minPrice !== '' && listing.price < Number(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice !== '' && listing.price > Number(filters.maxPrice)) {
        return false;
      }

      // Property type client check
      if (filters.property_type !== 'all' && listing.property_type !== filters.property_type) {
        return false;
      }

      // Furnishing client check
      if (filters.furnishing !== 'all' && listing.furnishing !== filters.furnishing) {
        return false;
      }

      return true;
    });
  }, [listings, filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pune Real Estate Listings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore apartments, builder floors, and properties with normalized pricing and verified live status
        </p>
      </div>

      {/* Filter Bar */}
      <ListingFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        totalResults={serverTotal}
        filteredCount={filteredListings.length}
        isLoading={isLoadingInitial || isLoadingMore}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-4">
          <div className="text-xs font-medium">{error}</div>
          <button
            type="button"
            onClick={() => fetchListingsData(offset, offset === 0)}
            className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Initial Skeleton Loading */}
      {isLoadingInitial && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-slate-200"></div>
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
      {!isLoadingInitial && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              isSaved={savedIds.has(listing.listing_id)}
              onToggleSave={handleToggleSave}
              isSaving={savingId === listing.listing_id}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingInitial && filteredListings.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching listings found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try loosening your filters or resetting to see all available properties in Pune.
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
      {!isLoadingInitial && filteredListings.length > 0 && (
        <div className="pt-6 pb-12 flex flex-col items-center gap-3">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredListings.length}</span> properties
            {serverTotal > 0 && ` of ~${serverTotal} available`}
          </div>

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
                  <span>Loading more...</span>
                </>
              ) : (
                <span>Load More Properties</span>
              )}
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium">All matching listings loaded</div>
          )}
        </div>
      )}
    </div>
  );
}
