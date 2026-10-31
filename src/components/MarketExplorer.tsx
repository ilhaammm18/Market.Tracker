"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, TrendingUp, TrendingDown, Star, Sparkles, ArrowRight } from "lucide-react";
import { StockData, MarketRegion } from "@/types/stock";
import { MOCK_STOCKS } from "@/data/mockStocks";
import { formatCurrency } from "@/lib/utils";

interface MarketExplorerProps {
  activeTicker: string;
  onSelectStock: (ticker: string) => void;
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
}

export const MarketExplorer: React.FC<MarketExplorerProps> = ({
  activeTicker,
  onSelectStock,
  watchlist,
  onToggleWatchlist,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>("ALL");

  const regions: { key: MarketRegion; label: string; badge: string }[] = [
    { key: "ALL", label: "SEMUA BURSA", badge: "Global" },
    { key: "IDX", label: "BEI / IDX", badge: "Indonesia" },
    { key: "US", label: "WALL STREET", badge: "US Markets" },
    { key: "KRX", label: "KRX KOREA", badge: "Korea" },
    { key: "ASX", label: "ASX AUSTRALIA", badge: "Australia" },
    { key: "ETF", label: "ETF GLOBAL", badge: "Indeks S&P" },
    { key: "CRYPTO", label: "KRIPTO", badge: "Digital Gold" },
  ];

  const stocks = Object.values(MOCK_STOCKS).filter((s) => {
    if (selectedRegion === "ALL") return true;
    if (selectedRegion === "IDX") return s.exchange === "IDX";
    if (selectedRegion === "US") return s.exchange === "NASDAQ" || s.exchange === "NYSE";
    if (selectedRegion === "KRX") return s.exchange === "KRX";
    if (selectedRegion === "ASX") return s.exchange === "ASX";
    if (selectedRegion === "ETF") return s.category.includes("ETF");
    if (selectedRegion === "CRYPTO") return s.exchange === "CRYPTO";
    return true;
  });

  return (
    <section className="w-full py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-3 border-b border-white/[0.08] gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#F5B700] uppercase">
            <Globe2 className="w-4 h-4 text-[#F5B700]" />
            MULTI-MARKET EXPLORER & GLOBAL WATCH
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Jelajahi Emiten Unggulan Multi-Bursa Internasional
          </h3>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {regions.map((reg) => (
            <button
              key={reg.key}
              onClick={() => setSelectedRegion(reg.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 ${
                selectedRegion === reg.key
                  ? "bg-[#F5B700] text-navy-950 shadow-gold scale-[1.02]"
                  : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stocks.map((s) => {
          const isPositive = s.changePercent >= 0;
          const isActive = s.ticker === activeTicker;
          const isWatched = watchlist.includes(s.ticker);

          return (
            <motion.div
              key={s.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`relative rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between ${
                isActive
                  ? "bg-[#0A192F] border-[#F5B700] ring-1 ring-[#F5B700]/40 shadow-gold"
                  : "bg-[#0A192F]/60 border-white/[0.08] hover:border-white/20 hover:bg-[#0A192F]/90"
              }`}
            >
              <div>
                {/* Top Row: Ticker & Star */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-white">
                      {s.ticker}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60">
                      {s.exchange}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(s.ticker);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isWatched
                        ? "text-[#F5B700] bg-[#F5B700]/10 border-[#F5B700]/30"
                        : "text-white/30 hover:text-white/80 border-transparent hover:border-white/10"
                    }`}
                    title={isWatched ? "Hapus dari Watchlist" : "Tambah ke Watchlist"}
                  >
                    <Star className={`w-4 h-4 ${isWatched ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Company Name & Sector */}
                <div className="text-xs text-white/80 font-medium truncate mb-1">
                  {s.name}
                </div>
                <div className="text-[10px] text-white/40 truncate mb-3">
                  {s.category}
                </div>

                {/* Price & Change */}
                <div className="my-2">
                  <div className="text-lg font-mono font-bold text-white">
                    {formatCurrency(s.price, s.currency, s.currencySymbol)}
                  </div>
                  <div
                    className={`text-xs font-mono font-semibold flex items-center gap-1 mt-0.5 ${
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isPositive ? "+" : ""}{s.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40">
                  Vol: {s.volumeDisplay}
                </span>

                <button
                  onClick={() => onSelectStock(s.ticker)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                    isActive
                      ? "bg-[#F5B700] text-navy-950"
                      : "bg-white/[0.06] hover:bg-[#F5B700] text-white/80 hover:text-navy-950"
                  }`}
                >
                  <span>{isActive ? "Aktif" : "Analisis"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

