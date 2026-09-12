// Types for the portfolio dashboard

// Raw stock data from portfolio.json
export interface RawStock {
  no: number;
  name: string;
  purchasePrice: number;
  quantity: number;
  exchange: string; // "NSE" or "BSE"
  symbol: string;   // NSE ticker or BSE code
}

export interface RawSector {
  sector: string;
  stocks: RawStock[];
}

// Enriched stock with calculated fields and live market data
export interface EnrichedStock {
  name: string;
  purchasePrice: number;
  quantity: number;
  exchange: string;
  symbol: string;
  investment: number;
  portfolioPercent: number;
  cmp: number | null;        // Current Market Price from Yahoo Finance
  presentValue: number | null;
  gainLoss: number | null;
  peRatio: number | null;     // P/E Ratio from Google Finance
  latestEarnings: number | null; // Latest EPS from Google Finance
  error?: string;             // Error message if external data failed
}

// Sector with aggregated totals
export interface SectorData {
  name: string;
  stocks: EnrichedStock[];
  totalInvestment: number;
  totalPresentValue: number | null;
  totalGainLoss: number | null;
}

// Full API response shape
export interface PortfolioResponse {
  stocks: EnrichedStock[];
  sectors: SectorData[];
  totalInvestment: number;
  totalPresentValue: number | null;
  totalGainLoss: number | null;
  lastUpdated: string;
  error?: string;
}
