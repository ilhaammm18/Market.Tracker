"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  PieChart,
  ChevronRight,
  Coins,
  Plus,
} from "lucide-react";
import { PortfolioItem, StockData } from "@/types/stock";
import { calculatePortfolioSummary } from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";

interface PortfolioSummaryCardProps {
  portfolio: PortfolioItem[];
  knownStocks: Record<string, StockData>;
  onOpenPortfolio: () => void;
  onSelectStock?: (ticker: string) => void;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({
  portfolio,
  knownStocks,
  onOpenPortfolio,
  onSelectStock,
}) => {
  const summary = useMemo(
    () => calculatePortfolioSummary(portfolio, knownStocks),
    [portfolio, knownStocks]
  );

  const isPositive = summary.totalPnLIDR >= 0;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-[#0A192F]/90 via-[#0F264A]/85 to-[#0A192F]/90 border border-[#F5B700]/30 shadow-glass backdrop-blur-xl overflow-hidden"
      >
        {/* Top Row: Widget Title, Asset Count & Quick Open Drawer Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Equity & PnL Metrics */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F5B700]/15 border border-[#F5B700]/35 flex items-center justify-center text-[#F5B700] shadow-gold shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/60 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-[#F5B700]" />
                    Ringkasan Portofolio (IDR)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/30">
                    {portfolio.length} Aset
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight mt-0.5">
                  {formatCurrency(summary.totalEquityIDR, "IDR", "Rp")}
                </div>
              </div>
            </div>

            {/* Divider on desktop */}
            <div className="hidden md:block h-10 w-[1px] bg-white/10" />

            {/* Floating PnL & Return Percentage */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/45 block">
                Total Floating PnL & Return
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-mono text-xs font-extrabold border ${
                    isPositive
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {summary.totalPnLPercent.toFixed(2)}%
                  </span>
                </span>
                <span
                  className={`font-mono text-xs sm:text-sm font-bold ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  ({isPositive ? "+" : ""}
                  {formatCurrency(summary.totalPnLIDR, "IDR", "Rp")})
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons to Open PortfolioDrawer */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-center">
            <button
              type="button"
              onClick={onOpenPortfolio}
              className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 rounded-xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-mono font-extrabold text-xs tracking-wide shadow-gold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kelola Portofolio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Compact Segmented Allocation Bar & Quick Asset Pills */}
        {summary.allocation.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Progress Bar */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <PieChart className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden flex gap-[2px] p-[1px] border border-white/10">
                {summary.allocation.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      width: `${Math.max(item.weightPercent, 4)}%`,
                      backgroundColor: item.color,
                    }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                    title={`${item.ticker}: ${item.weightPercent.toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>

            {/* Interactive Asset Allocation Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {summary.allocation.map((item) => {
                const itemUp = item.pnlPercent >= 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onSelectStock
                        ? onSelectStock(item.ticker)
                        : onOpenPortfolio()
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-mono flex items-center gap-1.5 transition-all"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-white">{item.ticker}</span>
                    <span className="text-white/45">
                      {item.weightPercent.toFixed(0)}%
                    </span>
                    <span
                      className={`font-semibold ${
                        itemUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {itemUp ? "+" : ""}
                      {item.pnlPercent.toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};
