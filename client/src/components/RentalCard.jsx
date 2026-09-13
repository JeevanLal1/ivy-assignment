import React from 'react';
import {
  formatRentalRent,
  formatRentalDeposit,
  formatArea,
  formatTitleCase,
  formatPortalName,
} from '../utils/format.js';

export function RentalCard({ rental }) {
  const {
    listing_id,
    apartment_name,
    locality,
    property_type,
    bedroom,
    bathroom,
    price,
    deposit,
    maintenance,
    carpet_area,
    website,
    furnishing,
    is_live,
    posted_by,
    posted_by_name,
  } = rental;

  const areaInfo = formatArea(carpet_area, website);
  const formattedRent = formatRentalRent(price);
  const depositInfo = formatRentalDeposit(deposit, price);
  const formattedLocality = formatTitleCase(locality);
  const formattedApartment =
    apartment_name ||
    `${bedroom ? `${bedroom} BHK ` : ''}${formatTitleCase(property_type) || 'Rental Property'}`;
  const portalName = formatPortalName(website);

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Visual Top Bar */}
      <div className="relative h-36 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 p-4 flex flex-col justify-between text-white">
        <div className="flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 backdrop-blur text-white">
              {portalName}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/30 backdrop-blur text-slate-200">
              {formatTitleCase(property_type) || 'Rental'}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              is_live
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-500/30 text-slate-300 border border-slate-500/40'
            }`}
          >
            {is_live ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="z-10 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold tracking-tight text-white">{formattedRent}</div>
            <div className="text-xs text-slate-300">
              {bedroom > 0 ? `${bedroom} BHK` : 'Studio'} • {areaInfo.label}
              {areaInfo.wasConverted && (
                <span title="Converted from sqm to sqft" className="ml-1 text-[10px] text-emerald-400">
                  (sqm norm.)
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Security Deposit</span>
            <span className="text-xs font-semibold text-emerald-300">
              {depositInfo.label}
              {depositInfo.isMultiplier && (
                <span className="ml-1 text-[10px] text-slate-400 font-normal">
                  ({depositInfo.multiplier}x mo.)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1 text-base">
            {formattedApartment}
          </h3>
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
          <span className="truncate max-w-[170px]">
            {posted_by ? `${formatTitleCase(posted_by)}` : 'Agent'}
            {posted_by_name ? ` • ${posted_by_name}` : ''}
          </span>
          {maintenance > 0 ? (
            <span className="text-[11px] text-slate-500 font-medium">
              +₹{maintenance.toLocaleString('en-IN')}/mo maint.
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {listing_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
