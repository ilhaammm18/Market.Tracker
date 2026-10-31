"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Command, Activity, Star, Sliders, X, TrendingUp, TrendingDown } from "lucide-react";
import { StockData } from "@/types/stock";
import { MOCK_STOCKS } from "@/data/mockStocks";

interface HeaderNavProps {
  activeStock: StockData;
  onSelectStock: (ticker: string) => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenSettings: () => void;
  isLiveUpdating: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeStock,
  onSelectStock,
  watchlistCount,
  onOpenWatchlist,
  onOpenSettings,
  isLiveUpdating,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const searchResults = Object.values(MOCK_STOCKS).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.ticker.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.exchange.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (ticker: string) => {
    onSelectStock(ticker);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectStock(searchQuery.trim().toUpperCase());
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#040914]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Active Stock Badge & Logo */}
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#F5B700] to-[#E5A700] text-navy-950 font-black text-sm flex items-center justify-center shadow-gold font-mono tracking-wider ring-2 ring-[#F5B700]/30 transition-transform group-hover:scale-105">
                {activeStock.ticker.slice(0, 2)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                  <span className="text-[#F5B700]">{activeStock.ticker}</span>
                  <span className="text-white/40">/</span>
                  <span className="text-white/80">{activeStock.exchange}</span>
                </div>
                <span className="text-[11px] text-white/50 truncate max-w-[150px] sm:max-w-[200px]">
                  {activeStock.name}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar (Cmd+K) */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.09] hover:border-[#F5B700]/40 flex items-center justify-between text-sm text-white/50 transition-all duration-200 group shadow-inner"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-white/40 group-hover:text-[#F5B700] transition-colors" />
                <span className="text-white/40 group-hover:text-white/70 transition-colors">
                  Cari saham global (IDX, Wall St, KRX, ETF, Kripto)...
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-[11px] font-mono text-white/60">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right: Overview Indicator & Live Status */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Watchlist Quick Button */}
            <button
              onClick={onOpenWatchlist}
              className="relative p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-[#F5B700] transition-all"
              title="Buka Watchlist"
            >
              <Star className="w-4 h-4" />
              {watchlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5B700] text-navy-950 font-bold text-[10px] flex items-center justify-center">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* API Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-[#06B6D4] transition-all hidden sm:flex"
              title="Pengaturan Data API"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Page/Mode Indicator */}
            <div className="hidden lg:flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider font-semibold text-white/80">
                <span className="text-[#F5B700]">01 / 04</span>
                <span className="text-white/40">—</span>
                <span className="text-white/70 uppercase">OVERVIEW</span>
              </div>
              <div className="w-20 h-0.5 bg-[#F5B700]/70 rounded-full mt-1" />
            </div>

            {/* Live Market Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                activeStock.isMarketOpen
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {activeStock.isMarketOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeStock.isMarketOpen ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                ></span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold uppercase hidden sm:inline">
                {activeStock.isMarketOpen ? "LIVE MARKET DATA" : "MARKET CLOSED"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0A192F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-[#F5B700]/20">
            {/* Search Input Bar */}
            <form onSubmit={handleCustomSubmit} className="relative p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#F5B700]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau ticker (contoh: BMRI, AAPL, BBCA, NVDA, VOO)..."
                className="w-full bg-transparent text-white placeholder-white/40 text-base focus:outline-none font-sans"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Search Results / Suggestions */}
            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/[0.04]">
              {searchResults.length > 0 ? (
                searchResults.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  return (
                    <button
                      key={stock.id}
                      onClick={() => handleSelect(stock.ticker)}
                      className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-white/[0.06] transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-navy-800 border border-white/10 text-[#F5B700] font-mono font-bold text-xs flex items-center justify-center group-hover:border-[#F5B700]/50 transition-colors">
                          {stock.ticker.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white group-hover:text-[#F5B700] transition-colors">
                              {stock.ticker}
                            </span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-mono">
                              {stock.exchange}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 truncate block max-w-xs sm:max-w-md">
                            {stock.name} · {stock.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-sm font-semibold text-white">
                          {stock.currencySymbol} {stock.price.toLocaleString()}
                        </div>
                        <div
                          className={`text-xs flex items-center justify-end gap-1 ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-white/50">
                  <p>Tidak ada hasil lokal ditemukan untuk &quot;{searchQuery}&quot;.</p>
                  <p className="text-xs text-white/40 mt-1">
                    Tekan <b>Enter</b> untuk memuat dan menganalisis ticker &quot;{searchQuery.toUpperCase()}&quot; secara global via API.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#061024] border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between px-4">
              <span>Gunakan panah untuk navigasi · Enter untuk memilih</span>
              <span className="font-mono text-[#F5B700]">Global Equities & Crypto</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

