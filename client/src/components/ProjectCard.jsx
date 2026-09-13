import React from 'react';
import {
  formatProjectPriceRange,
  formatTitleCase,
} from '../utils/format.js';

export function ProjectCard({ project }) {
  const {
    project_id,
    apartment_name,
    developer_name,
    locality,
    project_status,
    total_units,
    total_towers,
    total_floors,
    total_listings,
    price_min,
    price_max,
    min_area_sqft,
    max_area_sqft,
    amenities = [],
    launch_date,
    possession_date,
    rera_number,
  } = project;

  const priceRange = formatProjectPriceRange(price_min, price_max);
  const formattedLocality = formatTitleCase(locality);
  const statusLabel = formatTitleCase(project_status) || 'Development';

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Visual Top Bar */}
      <div className="relative h-36 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-800 p-4 flex flex-col justify-between text-white">
        <div className="flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/90 text-white">
              {developer_name || 'Premium Builder'}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-black/30 backdrop-blur text-slate-200">
              {statusLabel}
            </span>
          </div>

          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/20 text-slate-200 backdrop-blur"
            title="Registry reported linked listings"
          >
            Reported listings: {total_listings ?? 0}
          </span>
        </div>

        <div className="z-10 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold tracking-tight text-white">{priceRange}</div>
            <div className="text-xs text-slate-300">
              {min_area_sqft && max_area_sqft
                ? `${min_area_sqft.toLocaleString('en-IN')} – ${max_area_sqft.toLocaleString('en-IN')} sqft`
                : min_area_sqft
                ? `From ${min_area_sqft.toLocaleString('en-IN')} sqft`
                : 'Configurable layouts'}
            </div>
          </div>

          <div className="text-right text-xs text-slate-300">
            {total_units ? `${total_units} Units` : ''}
            {total_towers ? ` • ${total_towers} Towers` : ''}
          </div>
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1 text-base">
            {apartment_name}
          </h3>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{formattedLocality}, Pune</span>
          </div>

          {/* Amenities & Attributes */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
            {Array.isArray(amenities) && amenities.length > 0 ? (
              amenities.slice(0, 4).map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize"
                >
                  {amenity}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Standard modern amenities</span>
            )}
            {amenities.length > 4 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-50">
                +{amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate max-w-[170px] text-[11px]">
            {possession_date ? `Possession: ${possession_date.slice(0, 7)}` : `ID: ${project_id}`}
          </span>
          {rera_number && (
            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={rera_number}>
              RERA ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
