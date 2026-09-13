import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listingsService } from '../services/listings.js';
import { useSaved } from '../context/SavedContext.jsx';
import { ListingCard } from '../components/ListingCard.jsx';
import { formatPrice, formatArea, formatTitleCase, formatPortalName } from '../utils/format.js';
import { findSimilarListings } from '../utils/similarity.js';
import { parseTimestamp } from '../../../shared/date-utils.mjs';

export function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSaved, isSaving, toggleSave } = useSaved();

  const [listing, setListing] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // 2. Fetch listing detail
  const loadListingDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setListing(null);
    setSimilarListings([]);

    try {
      const data = await listingsService.getListingById(id);
      setListing(data);

      // Fetch candidates for similar listings in the same locality
      if (data.locality) {
        setIsLoadingSimilar(true);
        listingsService
          .getListings({ locality: data.locality, limit: 50 })
          .then((res) => {
            const candidates = res?.results || [];
            const similar = findSimilarListings(data, candidates, 6);
            setSimilarListings(similar);
          })
          .catch((simErr) => {
            console.warn('Failed to fetch candidate similar listings:', simErr.message);
          })
          .finally(() => {
            setIsLoadingSimilar(false);
          });
      }
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message || 'Failed to load property details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListingDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadListingDetail]);

  // Toggle Save handler for current listing
  const isCurrentSaved = isSaved(id);
  const isCurrentSaving = isSaving(id);

  const handleToggleCurrentSave = () => {
    if (!listing) return;
    toggleSave(listing);
  };

  // 404 Not Found State
  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto my-16 bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900">Property Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          Listing with ID <span className="font-mono font-semibold text-slate-800">{id}</span> does not exist or has been removed from the registry.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/listings"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            ← Browse All Listings
          </Link>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-16 bg-white p-8 rounded-2xl border border-red-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
          ✕
        </div>
        <h2 className="text-lg font-bold text-slate-900">Error Loading Property</h2>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={loadListingDetail}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Retry
          </button>
          <Link
            to="/listings"
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  // Loading Skeleton State
  if (isLoading || !listing) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-36"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Formatted display values
  const areaInfo = formatArea(listing.carpet_area, listing.website);
  const formattedPrice = formatPrice(listing.price);
  const formattedLocality = formatTitleCase(listing.locality);
  const portalName = formatPortalName(listing.website);
  const pricePerSqft = areaInfo.sqft > 0 ? Math.round(listing.price / areaInfo.sqft) : 0;

  let formattedDate = 'Recently';
  if (listing.posted_at) {
    try {
      const parsedDate = parseTimestamp(listing.posted_at);
      formattedDate = parsedDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      formattedDate = listing.posted_at;
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <span>←</span> Back to Pune Listings
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">ID: {listing.listing_id}</span>
          <button
            type="button"
            disabled={isCurrentSaving}
            onClick={handleToggleCurrentSave}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 ${
              isCurrentSaved
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isCurrentSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className={`w-4 h-4 ${isCurrentSaved ? 'text-rose-600 fill-rose-600' : 'text-slate-500 fill-transparent'}`}
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
            )}
            <span>{isCurrentSaved ? 'Saved to Favorites' : 'Save Property'}</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Showcase */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/20 backdrop-blur text-white">
                {portalName}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/40 backdrop-blur text-slate-200">
                {formatTitleCase(listing.property_type)}
              </span>
              {listing.is_verified && (
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500 text-white flex items-center gap-1">
                  ✓ Verified Listing
                </span>
              )}
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                listing.is_live
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-500/30 text-slate-300 border border-slate-500/40'
              }`}
            >
              {listing.is_live ? '● Live Active' : '○ Inactive'}
            </span>
          </div>

          <div className="mt-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {listing.apartment_name || `${listing.bedroom || ''} BHK ${formatTitleCase(listing.property_type)}`}
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{formattedLocality}, Pune</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-white">{formattedPrice}</div>
              {pricePerSqft > 0 && (
                <div className="text-xs text-emerald-400 font-medium">
                  ≈ ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
                </div>
              )}
            </div>

            <div className="text-right text-xs text-slate-300">
              <div>Listed on: <span className="font-semibold text-white">{formattedDate}</span></div>
              {listing.project_id && (
                <div className="text-slate-400">Project: {listing.project_id}</div>
              )}
            </div>
          </div>
        </div>

        {/* Decorative architectural grid overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
      </div>

      {/* Property Overview Specifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Property Specifications
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Bedrooms</span>
            <span className="text-base font-bold text-slate-800">
              {listing.bedroom !== undefined ? `${listing.bedroom} BHK` : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Bathrooms</span>
            <span className="text-base font-bold text-slate-800">
              {listing.bathroom !== undefined ? `${listing.bathroom} Bath` : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Carpet Area</span>
            <span className="text-base font-bold text-slate-800">
              {areaInfo.label}
              {areaInfo.wasConverted && (
                <span className="block text-[10px] font-normal text-emerald-700">
                  (Converted from {listing.carpet_area} sqm)
                </span>
              )}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Super Built-up</span>
            <span className="text-base font-bold text-slate-800">
              {listing.super_built_up_area ? `${listing.super_built_up_area} sqft` : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Floor</span>
            <span className="text-base font-bold text-slate-800">
              {listing.floor !== undefined ? `${listing.floor} of ${listing.total_floors || '-'}` : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Furnishing</span>
            <span className="text-base font-bold text-slate-800">
              {listing.furnishing ? formatTitleCase(listing.furnishing) : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Facing Direction</span>
            <span className="text-base font-bold text-slate-800">
              {listing.facing_direction ? formatTitleCase(listing.facing_direction) : '-'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-xs uppercase font-medium">Covered Parking</span>
            <span className="text-base font-bold text-slate-800">
              {listing.covered_parking !== undefined ? `${listing.covered_parking} Vehicle(s)` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Description & Contact Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            About this Property
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {listing.description || 'No additional description provided for this listing.'}
          </p>

          {listing.listing_url && (
            <div className="pt-4 mt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Portal Link: </span>
              <a
                href={listing.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline font-mono break-all"
              >
                {listing.listing_url}
              </a>
            </div>
          )}
        </div>

        {/* Contact / Seller Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Contact & Seller
          </h2>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">Posted By</span>
              <span className="font-semibold text-slate-800">
                {listing.posted_by ? formatTitleCase(listing.posted_by) : 'Authorized Agent'}
              </span>
            </div>

            {listing.posted_by_name && (
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Name</span>
                <span className="font-semibold text-slate-800">{listing.posted_by_name}</span>
              </div>
            )}

            {listing.posted_by_contact && (
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">Contact</span>
                <span className="font-semibold text-emerald-800 font-mono">{listing.posted_by_contact}</span>
              </div>
            )}

            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px]">Portal Source</span>
              <span className="font-semibold text-slate-800">{portalName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Listings Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Similar Properties in {formattedLocality}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Computed client-side based on locality, BHK, property type, and price proximity
            </p>
          </div>
        </div>

        {isLoadingSimilar && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}

        {!isLoadingSimilar && similarListings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similarListings.map((sim) => (
              <ListingCard
                key={sim.listing_id}
                listing={sim}
                isSaved={isSaved(sim.listing_id)}
                onToggleSave={() => toggleSave(sim)}
                isSaving={isSaving(sim.listing_id)}
              />
            ))}
          </div>
        )}

        {!isLoadingSimilar && similarListings.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No comparable properties found in {formattedLocality}.
          </div>
        )}
      </div>
    </div>
  );
}
