import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatArea, formatTitleCase, formatPortalName } from '../utils/format.js';

export function ListingCard({ listing, isSaved, onToggleSave, isSaving }) {
  const {
    listing_id,
    apartment_name,
    locality,
    property_type,
    bedroom,
    bathroom,
    price,
    carpet_area,
    website,
    furnishing,
    is_live,
    is_verified,
    posted_by,
    posted_by_name
  } = listing;

  const areaInfo = formatArea(carpet_area, website);
  const formattedPrice = formatPrice(price);
  const formattedLocality = formatTitleCase(locality);
  const formattedApartment = apartment_name || `${bedroom ? `${bedroom} BHK ` : ''}${formatTitleCase(property_type) || 'Property'}`;
  const portalName = formatPortalName(website);

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Visual Top Bar / Image Fallback */}
      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex flex-col justify-between text-white">
        <div className="flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 backdrop-blur text-white">
              {portalName}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/30 backdrop-blur text-slate-200">
              {formatTitleCase(property_type)}
            </span>
            {is_verified && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/90 text-white flex items-center gap-1">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Save / Favorite Action */}
          <button
            type="button"
            disabled={isSaving}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave?.(listing_id);
            }}
            title={isSaved ? 'Remove from saved' : 'Save listing'}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-600 fill-transparent'}`}
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
          </button>
        </div>

        <div className="z-10 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold tracking-tight text-white">{formattedPrice}</div>
            <div className="text-xs text-slate-300">
              {bedroom > 0 ? `${bedroom} BHK` : 'Studio'} • {areaInfo.label}
              {areaInfo.wasConverted && <span title="Converted from sqm to sqft" className="ml-1 text-[10px] text-emerald-400"> (sqm norm.)</span>}
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              is_live ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-500/30 text-slate-300 border border-slate-500/40'
            }`}
          >
            {is_live ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/listings/${listing_id}`}
            className="font-semibold text-slate-900 group-hover:text-emerald-700 line-clamp-1 text-base transition-colors"
          >
            {formattedApartment}
          </Link>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{formattedLocality}, Pune</span>
          </div>

          {/* Key Specs Grid */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-1.5 rounded">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Beds</span>
              <span className="font-semibold text-slate-800">{bedroom !== undefined ? `${bedroom}` : '-'}</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Baths</span>
              <span className="font-semibold text-slate-800">{bathroom !== undefined ? `${bathroom}` : '-'}</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded truncate">
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Furnishing</span>
              <span className="font-semibold text-slate-800 truncate block">
                {furnishing ? formatTitleCase(furnishing).replace('-Furnished', '') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate max-w-[150px]">
            {posted_by ? `${formatTitleCase(posted_by)}` : 'Agent'}
            {posted_by_name ? ` • ${posted_by_name}` : ''}
          </span>
          <Link
            to={`/listings/${listing_id}`}
            className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
