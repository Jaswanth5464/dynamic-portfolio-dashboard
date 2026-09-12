// portfolioData.ts
// Loads the portfolio JSON from disk and returns it.
// This is the only place we read the raw data file.

import portfolioData from "@/data/portfolio.json";
import type { RawSector } from "@/types/portfolio";

export function getPortfolioData(): RawSector[] {
  return portfolioData as RawSector[];
}
