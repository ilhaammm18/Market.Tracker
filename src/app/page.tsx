"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { GlobalTickerTape } from "@/components/GlobalTickerTape";
import { LandingSection } from "@/components/LandingSection";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";
import { Footer } from "@/components/Footer";
import { StockData, TickerTapeItem } from "@/types/stock";
import { MOCK_STOCKS, INITIAL_TICKER_TAPE } from "@/data/mockStocks";

export default function HomePage() {
  const router = useRouter();
  const [knownStocks, setKnownStocks] =
    useState<Record<string, StockData>>(MOCK_STOCKS);
  const [tapeItems, setTapeItems] =
    useState<TickerTapeItem[]>(INITIAL_TICKER_TAPE);
  const [watchlist, setWatchlist] = useState<string[]>([
    "BMRI",
    "BBCA",
    "BBRI",
    "AAPL",
    "NVDA",
    "BTC",
  ]);
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Load watchlist from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gsi_watchlist");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWatchlist(parsed);
          }
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  // Fetch real-time ticker tape & hydrate snapshot cards
  const fetchTape = useCallback(async () => {
    try {
      const res = await fetch("/api/stock?action=tape");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const freshTape: TickerTapeItem[] = json.data;
          setTapeItems(freshTape);

          setKnownStocks((prev) => {
            const next = { ...prev };
            for (const item of freshTape) {
              if (next[item.ticker]) {
                next[item.ticker] = {
                  ...next[item.ticker],
                  price: item.price,
                  change: item.change,
                  changePercent: item.changePercent,
                  isMarketOpen:
                    item.isMarketOpen ?? next[item.ticker].isMarketOpen,
                  marketState:
                    item.marketState ?? next[item.ticker].marketState,
                };
              }
            }
            return next;
          });
        }
      }
    } catch {
      // Keep existing snapshot state
    }
  }, []);

  useEffect(() => {
    fetchTape();
  }, [fetchTape]);

  const handleNavigateToMarket = (tickerOrSymbol: string) => {
    const clean = tickerOrSymbol.trim().toUpperCase();
    router.push(`/market?ticker=${encodeURIComponent(clean)}`);
  };

  const handleRemoveFromWatchlist = (ticker: string) => {
    setWatchlist((prev) => {
      const nextList = prev.filter((t) => t !== ticker);
      if (typeof window !== "undefined") {
        localStorage.setItem("gsi_watchlist", JSON.stringify(nextList));
      }
      return nextList;
    });
  };

  const featuredStock = knownStocks["BBCA"] || MOCK_STOCKS["BBCA"];

  return (
    <main className="min-h-screen bg-[#040914] text-slate-100 flex flex-col justify-between selection:bg-[#F5B700] selection:text-navy-950">
      {/* 1. Header Navigation with Route Links (Home vs Market Terminal) & Global Search */}
      <HeaderNav
        activeStock={featuredStock}
        onSelectStock={handleNavigateToMarket}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 2. Global Ticker Tape at the Very Top */}
      <GlobalTickerTape
        tapeItems={tapeItems}
        onSelectStock={handleNavigateToMarket}
        activeTicker=""
      />

      {/* 3. Modern Fintech Landing Section (Hero, Live Market Snapshot & Platform Capabilities) */}
      <LandingSection
        knownStocks={knownStocks}
        onSelectStock={handleNavigateToMarket}
      />

      {/* Drawers & Modals */}
      <WatchlistDrawer
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        watchlist={watchlist}
        knownStocks={knownStocks}
        onSelectStock={handleNavigateToMarket}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
      />

      <ApiSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRefreshData={fetchTape}
      />

      {/* Footer */}
      <Footer />
    </main>
  );
}
