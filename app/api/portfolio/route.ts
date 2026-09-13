// app/api/portfolio/route.ts
// Main backend endpoint: GET /api/portfolio
//
// This route:
// 1. Loads portfolio data from JSON
// 2. Fetches CMP from Yahoo Finance (in parallel for all stocks)
// 3. Fetches P/E and EPS from Google Finance (in parallel for all stocks)
// 4. Runs calculations (investment, present value, gain/loss, portfolio %)
// 5. Groups results by sector
// 6. Returns clean JSON

import { NextResponse } from "next/server";
import { getPortfolioData } from "@/lib/portfolioData";
import { getYahooQuote } from "@/lib/yahooFinance";
import { getGoogleFinanceData } from "@/lib/googleFinance";
import {
  calculateInvestment,
  calculatePresentValue,
  calculateGainLoss,
  calculatePortfolioPercent,
  sumValues,
} from "@/lib/calculations";
import type { EnrichedStock, SectorData, PortfolioResponse } from "@/types/portfolio";

// Next.js: don't cache this route — we handle caching ourselves inside the libs
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawSectors = getPortfolioData();

    // Flatten all stocks from all sectors so we can fetch data in parallel
    const allStocks = rawSectors.flatMap((sector) =>
      sector.stocks.map((stock) => ({ ...stock, sector: sector.sector }))
    );

    // Calculate total investment across all stocks (needed for portfolio %)
    const totalInvestment = allStocks.reduce(
      (sum, s) => sum + calculateInvestment(s.purchasePrice, s.quantity),
      0
    );

    // Fetch Yahoo Finance (CMP) and Google Finance (P/E, EPS) for ALL stocks
    // in parallel to keep response time low.
    // Promise.allSettled means one failure won't block others.
    const marketDataResults = await Promise.allSettled(
      allStocks.map(async (stock) => {
        // Run Yahoo and Google fetches in parallel per stock
        const [cmp, googleData] = await Promise.all([
          getYahooQuote(stock.symbol, stock.exchange),
          getGoogleFinanceData(stock.symbol, stock.exchange),
        ]);

        return {
          symbol: stock.symbol,
          exchange: stock.exchange,
          cmp,
          peRatio: googleData.peRatio,
          latestEarnings: googleData.latestEarnings,
        };
      })
    );

    // Build a lookup map: "SYMBOL:EXCHANGE" → market data
    const marketDataMap: Record<
      string,
      { cmp: number | null; peRatio: number | null; latestEarnings: number | null }
    > = {};

    marketDataResults.forEach((result, i) => {
      const stock = allStocks[i];
      const key = `${stock.symbol}:${stock.exchange}`;
      if (result.status === "fulfilled") {
        marketDataMap[key] = {
          cmp: result.value.cmp,
          peRatio: result.value.peRatio,
          latestEarnings: result.value.latestEarnings,
        };
      } else {
        // Promise rejected — mark as null so dashboard shows "—"
        marketDataMap[key] = { cmp: null, peRatio: null, latestEarnings: null };
      }
    });

    // Build sector data with enriched stocks and totals
    const sectors: SectorData[] = rawSectors.map((rawSector) => {
      const enrichedStocks: EnrichedStock[] = rawSector.stocks.map((stock) => {
        const key = `${stock.symbol}:${stock.exchange}`;
        const marketData = marketDataMap[key] ?? {
          cmp: null,
          peRatio: null,
          latestEarnings: null,
        };

        const investment = calculateInvestment(stock.purchasePrice, stock.quantity);
        const presentValue = calculatePresentValue(marketData.cmp, stock.quantity);
        const gainLoss = calculateGainLoss(presentValue, investment);
        const portfolioPercent = calculatePortfolioPercent(investment, totalInvestment);

        return {
          name: stock.name,
          purchasePrice: stock.purchasePrice,
          quantity: stock.quantity,
          exchange: stock.exchange,
          symbol: stock.symbol,
          investment,
          portfolioPercent,
          cmp: marketData.cmp,
          presentValue,
          gainLoss,
          peRatio: marketData.peRatio,
          latestEarnings: marketData.latestEarnings,
        };
      });

      // Sector-level totals
      const totalSectorInvestment = enrichedStocks.reduce(
        (sum, s) => sum + s.investment,
        0
      );
      const totalSectorPresentValue = sumValues(
        enrichedStocks.map((s) => s.presentValue)
      );
      const totalSectorGainLoss =
        totalSectorPresentValue !== null
          ? totalSectorPresentValue - totalSectorInvestment
          : null;

      return {
        name: rawSector.sector,
        stocks: enrichedStocks,
        totalInvestment: totalSectorInvestment,
        totalPresentValue: totalSectorPresentValue,
        totalGainLoss: totalSectorGainLoss,
      };
    });

    // All stocks flattened for top-level summary
    const allEnrichedStocks = sectors.flatMap((s) => s.stocks);
    const totalPresentValue = sumValues(
      allEnrichedStocks.map((s) => s.presentValue)
    );
    const totalGainLoss =
      totalPresentValue !== null ? totalPresentValue - totalInvestment : null;

    const response: PortfolioResponse = {
      stocks: allEnrichedStocks,
      sectors,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Portfolio API error:", err);
    return NextResponse.json(
      { error: "Failed to load portfolio data", details: String(err) },
      { status: 500 }
    );
  }
}
