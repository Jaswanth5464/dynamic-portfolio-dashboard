// calculations.ts
// Pure calculation functions for portfolio metrics.
// Each function is simple, testable, and does one thing.

/**
 * Investment = Purchase Price × Quantity
 */
export function calculateInvestment(
  purchasePrice: number,
  quantity: number
): number {
  return purchasePrice * quantity;
}

/**
 * Present Value = CMP × Quantity
 */
export function calculatePresentValue(
  cmp: number | null,
  quantity: number
): number | null {
  if (cmp === null) return null;
  return cmp * quantity;
}

/**
 * Gain/Loss = Present Value - Investment
 */
export function calculateGainLoss(
  presentValue: number | null,
  investment: number
): number | null {
  if (presentValue === null) return null;
  return presentValue - investment;
}

/**
 * Portfolio % = (Individual Investment / Total Portfolio Investment) × 100
 */
export function calculatePortfolioPercent(
  investment: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  return (investment / totalInvestment) * 100;
}

/**
 * Sum up investments for a list of stocks, ignoring nulls.
 */
export function sumValues(values: (number | null)[]): number | null {
  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length === 0) return null;
  return validValues.reduce((sum, v) => sum + v, 0);
}
