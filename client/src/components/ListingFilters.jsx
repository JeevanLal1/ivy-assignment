import React from 'react';
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
  'wakad'
];

const PROPERTY_TYPES = [
  'apartment',
  'builder floor',
  'independent house',
  'plot',
  'villa'
];

const FURNISHINGS = [
  'fully-furnished',
  'semi-furnished',
  'unfurnished'
];

export function ListingFilters({
  filters,
  onChange,
  onReset,
  totalResults,
  filteredCount,
  isLoading
}) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const isFiltered =
    filters.locality !== '' ||
    filters.bhk !== 'all' ||
    filters.property_type !== 'all' ||
    filters.furnishing !== 'all' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.liveOnly !== true;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Filters</span>
          </h2>
          {isFiltered && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active filters
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {isLoading ? 'Filtering...' : `${filteredCount} properties`}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-850 transition-colors"
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Filter Row 1: Locality, Property Type, Furnishing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Locality */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="locality-select">
            Locality (Pune)
          </label>
          <select
            id="locality-select"
            value={filters.locality}
            onChange={(e) => handleChange('locality', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="">All Localities</option>
            {LOCALITIES.map((loc) => (
              <option key={loc} value={loc}>
                {formatTitleCase(loc)}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="type-select">
            Property Type
          </label>
          <select
            id="type-select"
            value={filters.property_type}
            onChange={(e) => handleChange('property_type', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="all">All Types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {formatTitleCase(t)}
              </option>
            ))}
          </select>
        </div>

        {/* Furnishing */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="furnishing-select">
            Furnishing
          </label>
          <select
            id="furnishing-select"
            value={filters.furnishing}
            onChange={(e) => handleChange('furnishing', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="all">All Furnishings</option>
            {FURNISHINGS.map((f) => (
              <option key={f} value={f}>
                {formatTitleCase(f)}
              </option>
            ))}
          </select>
        </div>

        {/* BHK Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Bedrooms (BHK)
          </label>
          <div className="grid grid-cols-5 gap-1">
            {['all', '1', '2', '3', '4+'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => handleChange('bhk', b)}
                className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                  filters.bhk === b
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {b === 'all' ? 'All' : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Row 2: Price Range & Active Only Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 items-end">
        {/* Min Price */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="min-price">
            Min Price (INR)
          </label>
          <input
            id="min-price"
            type="number"
            min="0"
            step="100000"
            placeholder="e.g. 3000000"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="max-price">
            Max Price (INR)
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            step="100000"
            placeholder="e.g. 15000000"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Live Only Toggle */}
        <div className="flex items-center h-9">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={filters.liveOnly}
              onChange={(e) => handleChange('liveOnly', e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Active properties only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
