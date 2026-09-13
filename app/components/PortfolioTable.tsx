// components/PortfolioTable.tsx
// A table showing all the required columns for one sector's stocks.
// Columns: Name, Purchase Price, Qty, Investment, Portfolio%, Exchange, CMP,
//          Present Value, Gain/Loss, P/E Ratio, Latest Earnings

import type { EnrichedStock } from "@/types/portfolio";

interface Props {
  stocks: EnrichedStock[];
  totalInvestment: number; // portfolio-wide total, for reference
}

// Format a number as Indian Rupees
function formatINR(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

// Format a plain number (price, P/E, EPS)
function formatNum(value: number | null, decimals = 2): string {
  if (value === null) return "—";
  return value.toFixed(decimals);
}

// Tailwind class for gain/loss coloring
function gainLossClass(value: number | null): string {
  if (value === null) return "text-gray-400";
  return value >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium";
}

export default function PortfolioTable({ stocks }: Props) {
  return (
    // Horizontal scroll on small screens
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-left">
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Stock Name
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Buy Price
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Qty
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Investment
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Portfolio %
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              NSE/BSE
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              CMP
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Present Value
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Gain / Loss
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              P/E Ratio
            </th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap border-b border-gray-200">
              Latest EPS
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, i) => (
            <tr
              key={stock.symbol + i}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                {stock.name}
              </td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                {formatINR(stock.purchasePrice)}
              </td>
              <td className="px-3 py-2 text-gray-700">{stock.quantity}</td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                {formatINR(stock.investment)}
              </td>
              <td className="px-3 py-2 text-gray-700">
                {formatNum(stock.portfolioPercent, 2)}%
              </td>
              <td className="px-3 py-2 text-gray-600">
                <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">
                  {stock.exchange}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                {stock.cmp !== null ? formatINR(stock.cmp) : "—"}
              </td>
              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                {formatINR(stock.presentValue)}
              </td>
              <td className={`px-3 py-2 whitespace-nowrap ${gainLossClass(stock.gainLoss)}`}>
                {stock.gainLoss !== null
                  ? `${stock.gainLoss >= 0 ? "+" : ""}${formatINR(stock.gainLoss)}`
                  : "—"}
              </td>
              <td className="px-3 py-2 text-gray-700">{formatNum(stock.peRatio)}</td>
              <td className="px-3 py-2 text-gray-700">
                {formatNum(stock.latestEarnings)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
