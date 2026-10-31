"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { GlobalTickerTape } from "@/components/GlobalTickerTape";
import { HeroSection } from "@/components/HeroSection";
import { BentoFundamentals } from "@/components/BentoFundamentals";
import { MarketExplorer } from "@/components/MarketExplorer";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";
import { Footer } from "@/components/Footer";
import { StockData, TimeFrame, TickerTapeItem } from "@/types/stock";
import { MOCK_STOCKS, INITIAL_TICKER_TAPE } from "@/data/mockStocks";

export default function Home() {
  const [activeTicker, setActiveTicker] = useState<string>("BMRI");
  const [timeframe, setTimeframe] = useState<TimeFrame>("1D");
  const [stock, setStock] = useState<StockData>(MOCK_STOCKS["BMRI"]);
  const [tapeItems, setTapeItems] = useState<TickerTapeItem[]>(INITIAL_TICKER_TAPE);
  const [watchlist, setWatchlist] = useState<string[]>(["BMRI", "BBCA", "BBRI", "AAPL", "NVDA", "BTC"]);
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState<boolean>(true);

  // Load watchlist from LocalStorage on mount
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

  // Save watchlist to LocalStorage
  const handleToggleWatchlist = (ticker: string) => {
    setWatchlist((prev) => {
      const exists = prev.includes(ticker);
      const nextList = exists ? prev.filter((t) => t !== ticker) : [...prev, ticker];
      if (typeof window !== "undefined") {
        localStorage.setItem("gsi_watchlist", JSON.stringify(nextList));
      }
      return nextList;
    });
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

  // Fetch real-time ticker tape from server API route
  const fetchTape = useCallback(async () => {
    try {
      const res = await fetch("/api/stock?action=tape");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTapeItems(json.data);
        }
      }
    } catch {
      // Keep existing tape items
    }
  }, []);

  // Fetch single active stock from Yahoo Finance server route
  const fetchStock = useCallback(async (tickerToFetch: string, tf: TimeFrame) => {
    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(tickerToFetch)}&timeframe=${tf}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.stock) {
          setStock(json.stock);

          // Synchronize price in tapeItems if this ticker is also in the tape
          setTapeItems((prevTape) =>
            prevTape.map((item) => {
              if (item.ticker.toUpperCase() === json.stock.ticker.toUpperCase()) {
                return {
                  ...item,
                  price: json.stock.price,
                  priceFormatted: `${json.stock.currencySymbol}${
                    json.stock.currency === "IDR" || json.stock.currency === "KRW"
                      ? Math.round(json.stock.price).toLocaleString("id-ID")
                      : json.stock.price.toFixed(2)
                  }`,
                  change: json.stock.change,
                  changePercent: json.stock.changePercent,
                };
              }
              return item;
            })
          );
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Fallback directly to static verified baseline
    const fallback = MOCK_STOCKS[tickerToFetch] || MOCK_STOCKS["BMRI"];
    setStock(fallback);
  }, []);

  // Initial load
  useEffect(() => {
    fetchStock(activeTicker, timeframe);
    fetchTape();
  }, [activeTicker, timeframe, fetchStock, fetchTape]);

  // Periodic Auto-refresh (every 15s) fetching genuine Yahoo Finance data (NO Math.random!)
  useEffect(() => {
    if (!isLiveUpdating) return;
    const interval = setInterval(() => {
      fetchStock(activeTicker, timeframe);
      fetchTape();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTicker, timeframe, isLiveUpdating, fetchStock, fetchTape]);

  const handleSelectStock = (ticker: string) => {
    setActiveTicker(ticker.toUpperCase());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#040914] text-slate-100 flex flex-col justify-between selection:bg-[#F5B700] selection:text-navy-950">
      {/* 1. Header Navigation */}
      <HeaderNav
        activeStock={stock}
        onSelectStock={handleSelectStock}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        isLiveUpdating={isLiveUpdating}
      />

      {/* Global Ticker Tape Marquee (Synchronized exact real prices) */}
      <GlobalTickerTape
        tapeItems={tapeItems}
        onSelectStock={handleSelectStock}
        activeTicker={activeTicker}
      />

      {/* 2. Hero Section (Split Layout dengan Orbit Animation & Floating Glassmorphism Price Card) */}
      <HeroSection
        stock={stock}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        isWatchlisted={watchlist.includes(stock.ticker)}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* 3. Bento Grid Fundamental & Statistik */}
      <BentoFundamentals stock={stock} />

      {/* 4. Multi-Market Filter & Explorer */}
      <MarketExplorer
        activeTicker={activeTicker}
        onSelectStock={handleSelectStock}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* 5. Drawers and Modals */}
      <WatchlistDrawer
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        watchlist={watchlist}
        onSelectStock={handleSelectStock}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
      />

      <ApiSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRefreshData={() => {
          fetchStock(activeTicker, timeframe);
          fetchTape();
        }}
      />

      {/* 6. Footer */}
      <Footer />
    </main>
  );
}
