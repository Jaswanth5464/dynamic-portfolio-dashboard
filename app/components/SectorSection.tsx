// components/SectorSection.tsx
// Renders one sector block: heading, stock table, and sector-level summary row.

import type { SectorData } from "@/types/portfolio";
import PortfolioTable from "./PortfolioTable";

interface Props {
  sector: SectorData;
  totalPortfolioInvestment: number;
}

// Format a number as Indian Rupees
function formatINR(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function gainLossClass(value: number | null): string {
  if (value === null) return "text-gray-400";
  return value >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
}

export default function SectorSection({ sector, totalPortfolioInvestment }: Props) {
  return (
    <div className="mb-10">
      {/* Sector heading */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-bold text-gray-800">{sector.name} Sector</h2>
        <span className="text-sm text-gray-500">
          ({sector.stocks.length} stocks)
        </span>
      </div>

      {/* Stock table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <PortfolioTable
          stocks={sector.stocks}
          totalInvestment={totalPortfolioInvestment}
        />
      </div>

      {/* Sector summary row */}
      <div className="mt-3 flex flex-wrap gap-6 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
        <div>
          <span className="text-gray-500">Sector Investment: </span>
          <span className="font-semibold text-gray-800">
            {formatINR(sector.totalInvestment)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Present Value: </span>
          <span className="font-semibold text-gray-800">
            {formatINR(sector.totalPresentValue)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Gain / Loss: </span>
          <span className={gainLossClass(sector.totalGainLoss)}>
            {sector.totalGainLoss !== null
              ? `${sector.totalGainLoss >= 0 ? "+" : ""}${formatINR(sector.totalGainLoss)}`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
