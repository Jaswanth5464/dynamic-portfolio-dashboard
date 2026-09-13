"use client";
// app/page.tsx
// The main portfolio dashboard page.
//
// - Fetches GET /api/portfolio on load
// - Refreshes every 15 seconds using setInterval
// - Shows loading state on first load
// - Shows error state if the API fails
// - Cleans up the interval when the component unmounts

import { useEffect, useState } from "react";
import type { PortfolioResponse } from "@/types/portfolio";
import SummaryCards from "./components/SummaryCards";
import SectorSection from "./components/SectorSection";

const REFRESH_INTERVAL_SECONDS = 15;

export default function HomePage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);

  // Check if Indian stock market (NSE/BSE) is open right now
  function isMarketOpen(): boolean {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000); // IST is UTC+5:30
    const day = ist.getDay(); // 0 = Sun, 6 = Sat
    const totalMinutes = ist.getHours() * 60 + ist.getMinutes();
    const isWeekday = day >= 1 && day <= 5;
    const isOpen = totalMinutes >= 9 * 60 + 15 && totalMinutes < 15 * 60 + 30;
    return isWeekday && isOpen;
  }

  // Fetch portfolio data from the backend
  async function fetchPortfolio() {
    try {
      if (!loading) {
        setIsRefreshing(true);
      }
      const res = await fetch("/api/portfolio");
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json: PortfolioResponse = await res.json();
      setData(json);
      setError(null);
      setLastRefreshed(new Date());
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load portfolio data"
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    // Load data immediately on mount
    fetchPortfolio();

    // Refresh data every 15 seconds from external APIs
    const interval = setInterval(() => {
      fetchPortfolio();
    }, REFRESH_INTERVAL_SECONDS * 1000);

    // 1-second countdown timer for visible countdown feedback
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : REFRESH_INTERVAL_SECONDS));
    }, 1000);

    // Cleanup timers on unmount
    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
    };
  }, []);

  const marketOpen = isMarketOpen();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Market Status Notification Bar */}
      <div className={`text-xs py-1.5 px-4 text-center font-medium ${
        marketOpen
          ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
          : "bg-amber-50 text-amber-800 border-b border-amber-200"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${marketOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span>
            {marketOpen
              ? "Indian Markets (NSE/BSE) are OPEN — live prices updating."
              : "Indian Markets (NSE/BSE) are CLOSED (Weekend / After-Hours) — Yahoo Finance returns latest closing prices."}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Portfolio Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Live updates every {REFRESH_INTERVAL_SECONDS}s from Yahoo &amp; Google Finance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {lastRefreshed && (
                <p className="text-xs text-gray-400">
                  Last updated:{" "}
                  {lastRefreshed.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              )}
              {/* Live indicator and countdown */}
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${isRefreshing ? "bg-amber-500 animate-ping" : "bg-green-500 animate-pulse"}`} />
                <span className="text-xs font-medium text-gray-600">
                  {isRefreshing ? (
                    <span className="text-amber-600">Updating live data...</span>
                  ) : (
                    <span>Next update in <span className="font-semibold text-blue-600">{countdown}s</span></span>
                  )}
                </span>
              </div>
            </div>

            {/* Manual refresh button */}
            <button
              onClick={() => fetchPortfolio()}
              disabled={isRefreshing || loading}
              className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-md border border-gray-300 shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh prices now"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-gray-500"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-lg">Loading portfolio data...</p>
            <p className="text-sm mt-1">
              Fetching live prices from Yahoo Finance...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium text-lg">
              Failed to load portfolio data
            </p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
            <button
              onClick={() => fetchPortfolio()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data loaded */}
        {!loading && !error && data && (
          <>
            {/* Top-level summary cards */}
            <SummaryCards data={data} />

            {/* Divider */}
            <hr className="border-gray-200 mb-8" />

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 mb-6 italic">
              Note: Market data is fetched from unofficial sources (Yahoo Finance,
              Google Finance). Prices may be delayed and are for informational
              purposes only. Not financial advice.
            </p>

            {/* Sector sections */}
            {data.sectors.map((sector) => (
              <SectorSection
                key={sector.name}
                sector={sector}
                totalPortfolioInvestment={data.totalInvestment}
              />
            ))}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          Portfolio Dashboard · Data from Yahoo Finance (unofficial) &amp;
          Google Finance (unofficial) · Not financial advice
        </div>
      </footer>
    </div>
  );
}
