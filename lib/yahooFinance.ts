// yahooFinance.ts
// Fetches current market price (CMP) from Yahoo Finance using the
// unofficial yahoo-finance2 library. Runs on server only (Next.js API routes).
//
// For Indian stocks:
//   NSE symbols: append ".NS"  (e.g., HDFCBANK → HDFCBANK.NS)
//   BSE symbols: append ".BO"  (e.g., 532174  → 532174.BO)
//
// Cache: We cache results for CACHE_TTL_MS milliseconds so that
// refreshes every 15s don't hammer Yahoo Finance.

import YahooFinanceClass from "yahoo-finance2";

// Create a single instance for the module (v4+ requires new YahooFinance())
const yahooFinance = new YahooFinanceClass({
  suppressNotices: ["yahooSurvey"],
});

// Cache lives in-memory on the server. It resets when the server restarts.
const cache: Map<string, { price: number | null; fetchedAt: number }> =
  new Map();

// Cache responses for 10 seconds so that every 15-second interval fetches fresh live CMP from Yahoo Finance,
// while still preventing duplicate simultaneous calls within the same cycle.
const CACHE_TTL_MS = 10 * 1000;

/**
 * Build the Yahoo Finance symbol from NSE/BSE data.
 * NSE tickers already have letters (e.g., "HDFCBANK") → add ".NS"
 * BSE codes are numeric strings (e.g., "532174") → add ".BO"
 */
export function buildYahooSymbol(symbol: string, exchange: string): string {
  if (exchange === "NSE") {
    return `${symbol}.NS`;
  }
  // BSE: symbol is usually the BSE code number
  return `${symbol}.BO`;
}

/**
 * Fetch the current market price for a stock.
 * Returns null if the fetch fails (so the app doesn't crash).
 */
export async function getYahooQuote(
  symbol: string,
  exchange: string
): Promise<number | null> {
  const yahooSymbol = buildYahooSymbol(symbol, exchange);

  // Return cached value if still fresh
  const cached = cache.get(yahooSymbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.price;
  }

  try {
    const quote = await yahooFinance.quote(yahooSymbol);
    // regularMarketPrice is the current market price
    const price = quote.regularMarketPrice ?? null;
    cache.set(yahooSymbol, { price, fetchedAt: Date.now() });
    return price;
  } catch (err) {
    // Log the error but don't crash — return null so the dashboard still works
    console.error(`Yahoo Finance error for ${yahooSymbol}:`, err);
    cache.set(yahooSymbol, { price: null, fetchedAt: Date.now() });
    return null;
  }
}
