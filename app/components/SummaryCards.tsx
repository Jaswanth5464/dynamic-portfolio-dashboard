// components/SummaryCards.tsx
// Shows the top-level portfolio summary:
// Total Investment, Current Value, and Total Gain/Loss

import type { PortfolioResponse } from "@/types/portfolio";

interface Props {
  data: PortfolioResponse;
}

// Format a number as Indian Rupees with commas
function formatINR(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SummaryCards({ data }: Props) {
  const gainLoss = data.totalGainLoss;
  const isPositive = gainLoss !== null && gainLoss >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* Total Investment */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Total Investment</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatINR(data.totalInvestment)}
        </p>
      </div>

      {/* Current Value */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Current Value</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatINR(data.totalPresentValue)}
        </p>
      </div>

      {/* Total Gain/Loss */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Total Gain / Loss</p>
        <p
          className={`text-2xl font-bold ${
            gainLoss === null
              ? "text-gray-400"
              : isPositive
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {gainLoss !== null && isPositive ? "+" : ""}
          {formatINR(gainLoss)}
        </p>
      </div>
    </div>
  );
}
