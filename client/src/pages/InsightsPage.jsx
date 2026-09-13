import React, { useState } from 'react';
import {
  MARKET_KPIS,
  CORRUPT_BREAKDOWN,
  PROJECT_AUDIT_BREAKDOWN,
  SYNDICATE_DATA,
  CONFIRMED_FINDINGS,
} from '../data/insightsData.js';

export function InsightsPage() {
  const [selectedFindingCategory, setSelectedFindingCategory] = useState('all');

  const findingCategories = ['all', 'Authentication', 'Routing', 'Normalization', 'Audit', 'Security'];

  const filteredFindings = CONFIRMED_FINDINGS.filter((item) => {
    if (selectedFindingCategory === 'all') return true;
    return item.category.toLowerCase().includes(selectedFindingCategory.toLowerCase());
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header & Transparency Note */}
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Market Insights & Data Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Comprehensive market intelligence, data quality diagnostics, and investigative audit findings for Pune real estate.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            ✓ 100% Deterministic Verification
          </span>
        </div>

        {/* Transparency Banner (Requirement 9) */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <span className="text-emerald-700 font-bold text-sm leading-none mt-0.5">ℹ</span>
          <p className="leading-relaxed">
            Insights are derived from the Ivy Homes API catalog and the deterministic analysis performed for this assignment. The documented analytics endpoint was unavailable, so these values are calculated/validated client-side.
          </p>
        </div>
      </div>

      {/* 1. Primary 10 KPIs Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Core Market & Integrity Metrics</span>
            <span className="text-xs font-medium text-slate-400 font-mono">(10 Primary KPIs)</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* KPI 1: Total Listings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>{MARKET_KPIS.totalListings.tag}</span>
                <span className="text-slate-400">Q1</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {MARKET_KPIS.totalListings.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.totalListings.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.totalListings.context}
            </p>
          </div>

          {/* KPI 2: Unique Properties */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 mb-1">
                <span>{MARKET_KPIS.uniqueProperties.tag}</span>
                <span className="text-slate-400">Q2</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                {MARKET_KPIS.uniqueProperties.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.uniqueProperties.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.uniqueProperties.context}
            </p>
          </div>

          {/* KPI 3: Active Listings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>{MARKET_KPIS.activeListings.tag}</span>
                <span className="text-slate-400">Q3</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {MARKET_KPIS.activeListings.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.activeListings.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.activeListings.context}
            </p>
          </div>

          {/* KPI 4: Corrupt Listings */}
          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700 mb-1">
                <span>{MARKET_KPIS.corruptListings.tag}</span>
                <span className="text-slate-400">Q4</span>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
                {MARKET_KPIS.corruptListings.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.corruptListings.label}
              </div>
            </div>
            <p className="text-[11px] text-rose-800/80 mt-2.5 pt-2 border-t border-rose-100 leading-tight">
              {MARKET_KPIS.corruptListings.context}
            </p>
          </div>

          {/* KPI 5: Magarpatta Rent */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>{MARKET_KPIS.magarpattaRent.tag}</span>
                <span className="text-slate-400">Q5</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {MARKET_KPIS.magarpattaRent.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.magarpattaRent.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.magarpattaRent.context}
            </p>
          </div>

          {/* KPI 6: Avg 2BHK Price/sqft */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700 mb-1">
                <span>{MARKET_KPIS.avgPricePerSqft2BHK.tag}</span>
                <span className="text-slate-400">Q6</span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-900 tracking-tight">
                {MARKET_KPIS.avgPricePerSqft2BHK.formatted}
                <span className="text-xs font-normal text-slate-500">/sqft</span>
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.avgPricePerSqft2BHK.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.avgPricePerSqft2BHK.context}
            </p>
          </div>

          {/* KPI 7: Costliest Project */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span className="font-mono text-emerald-700">{MARKET_KPIS.costliestProject.projectId}</span>
                <span className="text-slate-400">Q7</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {MARKET_KPIS.costliestProject.formattedPrice}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.costliestProject.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.costliestProject.context}
            </p>
          </div>

          {/* KPI 8: Recent 7-Day Listings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>{MARKET_KPIS.recentListings.tag}</span>
                <span className="text-slate-400">Q8</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {MARKET_KPIS.recentListings.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.recentListings.label}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 leading-tight">
              {MARKET_KPIS.recentListings.context}
            </p>
          </div>

          {/* KPI 9: Fake Syndicate Listings */}
          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 mb-1">
                <span>{MARKET_KPIS.fakeListings.tag}</span>
                <span className="text-slate-400">Q9</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {MARKET_KPIS.fakeListings.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.fakeListings.label}
              </div>
            </div>
            <p className="text-[11px] text-amber-900/80 mt-2.5 pt-2 border-t border-amber-100 leading-tight">
              {MARKET_KPIS.fakeListings.context}
            </p>
          </div>

          {/* KPI 10: Project Mismatch */}
          <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700 mb-1">
                <span>{MARKET_KPIS.projectMismatch.tag}</span>
                <span className="text-slate-400">Q10</span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                {MARKET_KPIS.projectMismatch.formatted}
              </div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {MARKET_KPIS.projectMismatch.label}
              </div>
            </div>
            <p className="text-[11px] text-indigo-900/80 mt-2.5 pt-2 border-t border-indigo-100 leading-tight">
              {MARKET_KPIS.projectMismatch.context}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Data Quality & Corrupt Listings Breakdown (Requirement 6) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Data Quality: Corrupt Listings Breakdown</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                28 Records Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Physically impossible listing records identified via deterministic validation rules (7 records per rule).
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 font-mono self-start sm:self-auto">
            Corrupt vs Fake Overlap: 0
          </span>
        </div>

        {/* Stacked Segmented Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1.5">
            <span>Rule Distribution (Equal 25% share per physical impossibility category)</span>
            <span className="font-semibold text-slate-800">28 records</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
            {CORRUPT_BREAKDOWN.map((item, idx) => (
              <div
                key={idx}
                style={{ width: `${item.percentage}%` }}
                className={`${item.color} h-full rounded-sm transition-all`}
                title={`${item.category}: ${item.count} records (${item.percentage}%)`}
              />
            ))}
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CORRUPT_BREAKDOWN.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">{item.category}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-white shadow-xs text-slate-900">
                    {item.count}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-white/70 px-2 py-0.5 rounded border border-slate-100 mb-2 inline-block">
                  {item.rule}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Fraud & Syndicate Network Investigation (Requirement 5 & 8) */}
      <div className="bg-white p-6 rounded-2xl border border-amber-200 bg-amber-50/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Coordinated Broker Syndicate Investigation</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                205 Fake Listings Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cross-portal lead generation network operating across Pune with systematic price undercutting.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            47% Market Undercut
          </span>
        </div>

        {/* Finding 16 Strict Wording Box (Requirement 5) */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="text-[11px] uppercase font-bold text-amber-900 tracking-wider mb-1">
            Confirmed Finding 16 Formulation
          </div>
          <blockquote className="text-xs sm:text-sm font-medium text-amber-950 leading-relaxed italic">
            "{SYNDICATE_DATA.finding16Wording}"
          </blockquote>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Subsets comparison */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Syndicate Inventory Split</div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Subset A (Scam Language Phrases):</span>
                <span className="font-bold text-slate-900">{SYNDICATE_DATA.scamPhraseEvidence} listings</span>
              </div>
              <div className="flex justify-between">
                <span>Subset B (Shared Phones / Copied Units):</span>
                <span className="font-bold text-slate-900">{SYNDICATE_DATA.corroboratingListings} listings</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Scam phrases include: "Pay a token amount", "Below market price, this week only", "Site visit only after booking amount".
            </p>
          </div>

          {/* Pricing Distortion */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Price Distortion Impact</div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Syndicate Avg Price:</span>
                <span className="font-bold text-amber-700">₹{SYNDICATE_DATA.syndicateAvgPriceSqft}/sqft</span>
              </div>
              <div className="flex justify-between">
                <span>Normal Market Rate:</span>
                <span className="font-bold text-slate-900">₹{SYNDICATE_DATA.marketAvgPriceSqft}/sqft</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Excluding the syndicate prevents artificial 47% downward skew on genuine 2BHK valuation metrics.
            </p>
          </div>

          {/* Network Footprint */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Syndicate Infrastructure</div>
            <div className="space-y-1 text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">7 Burner Phones:</span>
                <div className="font-mono text-[10px] text-slate-500 mt-0.5 truncate">
                  {SYNDICATE_DATA.burnerPhones.join(', ')}
                </div>
              </div>
              <div className="pt-1">
                <span className="font-semibold text-slate-700">Identities:</span>
                <div className="text-[11px] text-slate-500">
                  {SYNDICATE_DATA.fictitiousAgencies.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Project Consistency Audit (Requirement 7) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Project Listing Count Audit</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                95 Inconsistent Projects
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cross-audit comparing each project's reported total_listings metadata against actual live linked inventory.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 self-start sm:self-auto">
            345 matching / 440 projects (78.4% match rate)
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1.5">
            <span>Discrepancy Categorization (95 Projects with Mismatched Counts)</span>
            <span className="font-semibold text-slate-800">95 total</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
            {PROJECT_AUDIT_BREAKDOWN.map((item, idx) => (
              <div
                key={idx}
                style={{ width: `${item.percentage}%` }}
                className={`${item.color} h-full rounded-sm transition-all`}
                title={`${item.category}: ${item.count} projects (${item.percentage}%)`}
              />
            ))}
          </div>
        </div>

        {/* 3 Categories Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROJECT_AUDIT_BREAKDOWN.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{item.category}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white shadow-xs text-indigo-700">
                  {item.count} projects ({item.percentage}%)
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Confirmed API & Data Findings (Requirement 4) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              API & Data Discoveries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              16 verified findings uncovered during empirical endpoint probing and dataset auditing.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {findingCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFindingCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedFindingCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All (16)' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Findings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{finding.icon}</span>
                    <h3 className="font-bold text-slate-900 text-sm">{finding.title}</h3>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {finding.category}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-medium min-w-[75px]">Documented:</span>
                    <span className="text-slate-500 font-mono text-[11px]">{finding.documented}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-medium min-w-[75px]">Actual:</span>
                    <span className="text-slate-800 font-medium">{finding.actual}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Impact:</span>
                <span>{finding.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
