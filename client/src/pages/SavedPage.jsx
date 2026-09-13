import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSaved } from '../context/SavedContext.jsx';
import { ListingCard } from '../components/ListingCard.jsx';

export function SavedPage() {
  const {
    savedListings,
    savedCount,
    isLoading,
    error,
    mutationError,
    clearMutationError,
    isSaving,
    removeSavedListing,
    refreshSaved,
  } = useSaved();

  // Fresh load on route visit
  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const handleRemove = (listingId) => {
    removeSavedListing(listingId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saved Properties</h1>
          <p className="text-xs text-slate-500 mt-1">
            Your shortlisted properties for comparison and quick access
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {savedCount} {savedCount === 1 ? 'property' : 'properties'} saved
          </div>
          <Link
            to="/listings"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            ← Browse More
          </Link>
        </div>
      </div>

      {/* Mutation Error Alert */}
      {mutationError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-700">Notice:</span>
            <span>{mutationError}</span>
          </div>
          <button
            type="button"
            onClick={clearMutationError}
            className="text-amber-800 hover:text-amber-950 font-bold px-2 py-0.5 rounded hover:bg-amber-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page-level Fetch Error */}
      {error && savedListings.length === 0 && (
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-800 max-w-lg mx-auto text-center space-y-3">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto">
            !
          </div>
          <h2 className="text-sm font-bold text-red-900">Unable to load saved properties</h2>
          <p className="text-xs text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => refreshSaved()}
            className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && savedListings.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse"
            >
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

      {/* Saved Listings Grid */}
      {!isLoading && savedListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedListings.map((listing) => {
            const id = listing.listing_id || listing.id;
            return (
              <ListingCard
                key={id}
                listing={listing}
                isSaved={true}
                onToggleSave={() => handleRemove(id)}
                isSaving={isSaving(id)}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && savedListings.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">No saved properties yet</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            You haven’t added any listings to your shortlist yet. Explore verified properties in Pune and tap the heart icon to save listings for easy reference and comparison.
          </p>
          <div className="mt-6">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <span>Explore Listings</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
