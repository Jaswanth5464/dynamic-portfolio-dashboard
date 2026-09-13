// googleFinance.ts
// Fetches P/E Ratio and Latest Earnings (EPS) from Google Finance
// by scraping the Google Finance page for Indian stocks.
//
// Google Finance URL format:
//   https://www.google.com/finance/quote/SYMBOL:NSE
//   https://www.google.com/finance/quote/SYMBOL:BOM  (BSE uses BOM on Google)
//
// IMPORTANT: This is an unofficial scraping approach. Google Finance
// does not provide a public API. The HTML structure may change at any time.
// We gracefully return null when scraping fails.
//
// Cache: Responses are cached for 5 minutes since fundamentals
// (P/E, EPS) don't change as frequently as price.

// Cache lives in-memory on the server
const cache: Map<
  string,
  { peRatio: number | null; latestEarnings: number | null; fetchedAt: number }
> = new Map();

// P/E and EPS change less frequently, cache for 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Build the Google Finance URL for a stock.
 * For NSE: https://www.google.com/finance/quote/HDFCBANK:NSE
 * For BSE: https://www.google.com/finance/quote/532174:BOM (BSE uses BOM on Google)
 */
function buildGoogleFinanceUrl(symbol: string, exchange: string): string {
  const exchangeCode = exchange === "NSE" ? "NSE" : "BOM";
  return `https://www.google.com/finance/quote/${symbol}:${exchangeCode}`;
}

/**
 * Parse a number from a text string like "18.69" or "₹91.02".
 * Returns null if parsing fails.
 */
function parseNumber(text: string): number | null {
  // Remove currency symbols (₹, $), commas, and whitespace
  const cleaned = text.replace(/[₹$,\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extract P/E ratio and Latest Earnings (EPS) from Google Finance HTML.
 *
 * Google Finance HTML structure (verified live, September 2025):
 * - P/E ratio: <div ...>P/E ratio</div><div class="dO6ijd">13.84</div>
 * - EPS:       <div ...>EPS</div><div class="dO6ijd">₹51.21</div>
 *
 * Both values use the same "dO6ijd" class for their value div.
 * This is a best-effort scrape — if Google changes its HTML, we return null.
 */
function parseGoogleFinanceHtml(
  html: string
): { peRatio: number | null; latestEarnings: number | null } {
  let peRatio: number | null = null;
  let latestEarnings: number | null = null;

  try {
    // P/E ratio pattern: "P/E ratio</div><div class="dO6ijd">VALUE</div>"
    const peMatch = html.match(
      /P\/E ratio<\/div><div[^>]*>([\d.,]+)<\/div>/
    );
    if (peMatch) {
      peRatio = parseNumber(peMatch[1]);
    }

    // EPS pattern: "EPS</div><div class="dO6ijd">₹VALUE</div>"
    // The value may include a ₹ or $ currency prefix.
    const epsMatch = html.match(
      /\bEPS<\/div><div[^>]*>[₹$]?([\d.,]+)<\/div>/
    );
    if (epsMatch) {
      latestEarnings = parseNumber(epsMatch[1]);
    }
  } catch (err) {
    console.error("Error parsing Google Finance HTML:", err);
  }

  return { peRatio, latestEarnings };
}

/**
 * Fetch P/E Ratio and Latest Earnings for a stock from Google Finance.
 * Returns null values if the fetch or parse fails.
 */
export async function getGoogleFinanceData(
  symbol: string,
  exchange: string
): Promise<{ peRatio: number | null; latestEarnings: number | null }> {
  const cacheKey = `${symbol}:${exchange}`;

  // Return cached value if still fresh
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { peRatio: cached.peRatio, latestEarnings: cached.latestEarnings };
  }

  const url = buildGoogleFinanceUrl(symbol, exchange);

  try {
    const response = await fetch(url, {
      headers: {
        // Mimic a browser request to avoid being blocked
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const data = parseGoogleFinanceHtml(html);

    cache.set(cacheKey, { ...data, fetchedAt: Date.now() });
    return data;
  } catch (err) {
    // Don't crash — return null so the dashboard still shows other data
    console.error(`Google Finance error for ${symbol} (${exchange}):`, err);
    cache.set(cacheKey, {
      peRatio: null,
      latestEarnings: null,
      fetchedAt: Date.now(),
    });
    return { peRatio: null, latestEarnings: null };
  }
}
