"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { GlobalTickerTape } from "@/components/GlobalTickerTape";
import { HeroSection } from "@/components/HeroSection";
import { BentoFundamentals } from "@/components/BentoFundamentals";
import { CompareAndSimulator } from "@/components/CompareAndSimulator";
import { MarketNewsSection } from "@/components/MarketNewsSection";
import { MarketExplorer } from "@/components/MarketExplorer";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { PortfolioDrawer } from "@/components/PortfolioDrawer";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";
import { Footer } from "@/components/Footer";
import {
  StockData,
  TimeFrame,
  TickerTapeItem,
  NavSectionId,
  PortfolioItem,
} from "@/types/stock";
import { MOCK_STOCKS, INITIAL_TICKER_TAPE } from "@/data/mockStocks";
import { formatCurrency } from "@/lib/utils";
import {
  loadPortfolio,
  savePortfolio,
  DEFAULT_PORTFOLIO_ITEMS,
} from "@/lib/portfolio";

function MarketTerminalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryTicker = searchParams.get("ticker");

  const initialClean = queryTicker
    ? queryTicker
        .replace(/\.(JK|KS|KQ|AX)$/i, "")
        .replace(/-USD$/i, "")
        .toUpperCase()
    : "BMRI";

  const [activeTicker, setActiveTicker] = useState<string>(
    queryTicker ? queryTicker.trim().toUpperCase() : "BMRI"
  );
  const [timeframe, setTimeframe] = useState<TimeFrame>("1D");
  const [stock, setStock] = useState<StockData>(
    MOCK_STOCKS[initialClean] || MOCK_STOCKS["BMRI"]
  );
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
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    DEFAULT_PORTFOLIO_ITEMS
  );
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [portfolioOpen, setPortfolioOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isLiveUpdating] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<NavSectionId>("overview");

  // Sync URL query param ?ticker=... when changed externally
  useEffect(() => {
    if (queryTicker && queryTicker.trim().toUpperCase() !== activeTicker) {
      setActiveTicker(queryTicker.trim().toUpperCase());
    }
  }, [queryTicker, activeTicker]);

  // Load watchlist & portfolio from LocalStorage on mount
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

      const loadedPortfolio = loadPortfolio();
      setPortfolio(loadedPortfolio);
    }
  }, []);

  const handleUpdatePortfolio = (nextItems: PortfolioItem[]) => {
    setPortfolio(nextItems);
    savePortfolio(nextItems);
  };

  // Scroll-spy for 01 / 04 — 04 / 04 navigation indicator
  useEffect(() => {
    const sectionMap: { id: NavSectionId; domId: string }[] = [
      { id: "overview", domId: "section-overview" },
      { id: "fundamentals", domId: "section-fundamentals" },
      { id: "compare", domId: "section-compare" },
      { id: "news", domId: "section-news" },
    ];

    const handleScroll = () => {
      const viewportTrigger = window.innerHeight * 0.35;
      let current: NavSectionId = "overview";

      for (const sec of sectionMap) {
        const el = document.getElementById(sec.domId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportTrigger) {
            current = sec.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigateSection = (sectionId: NavSectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Save watchlist to LocalStorage
  const handleToggleWatchlist = (ticker: string) => {
    const clean = ticker
      .replace(/\.(JK|KS|KQ|AX)$/i, "")
      .replace(/-USD$/i, "")
      .toUpperCase();
    setWatchlist((prev) => {
      const exists = prev.includes(clean);
      const nextList = exists
        ? prev.filter((t) => t !== clean)
        : [...prev, clean];
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
          const freshTape: TickerTapeItem[] = json.data;
          setTapeItems(freshTape);

          // Sync knownStocks prices with fresh tape quotes
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
      // Keep existing tape items
    }
  }, []);

  // Fetch single active stock from Yahoo Finance server route
  const fetchStock = useCallback(
    async (tickerToFetch: string, tf: TimeFrame) => {
      try {
        const res = await fetch(
          `/api/stock?ticker=${encodeURIComponent(tickerToFetch)}&timeframe=${tf}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.stock) {
            const loadedStock: StockData = json.stock;
            setStock(loadedStock);

            // Cache in knownStocks for Watchlist, Portfolio & Explorer
            setKnownStocks((prev) => ({
              ...prev,
              [loadedStock.ticker]: loadedStock,
            }));

            // Synchronize exact price in Global Ticker Tape from the same API state
            const formattedPrice = formatCurrency(
              loadedStock.price,
              loadedStock.currency,
              loadedStock.currencySymbol
            );

            setTapeItems((prevTape) => {
              const existsInTape = prevTape.some(
                (item) =>
                  item.ticker.toUpperCase() ===
                  loadedStock.ticker.toUpperCase()
              );

              if (existsInTape) {
                return prevTape.map((item) => {
                  if (
                    item.ticker.toUpperCase() ===
                    loadedStock.ticker.toUpperCase()
                  ) {
                    return {
                      ...item,
                      price: loadedStock.price,
                      priceFormatted: formattedPrice,
                      change: loadedStock.change,
                      changePercent: loadedStock.changePercent,
                      isMarketOpen: loadedStock.isMarketOpen,
                      marketState: loadedStock.marketState,
                    };
                  }
                  return item;
                });
              }

              // If user searched a custom global stock not in default tape, keep BBCA (IDX) first and insert after
              const newTapeItem: TickerTapeItem = {
                ticker: loadedStock.ticker,
                yahooSymbol: loadedStock.yahooSymbol,
                exchange: loadedStock.exchange,
                price: loadedStock.price,
                priceFormatted: formattedPrice,
                change: loadedStock.change,
                changePercent: loadedStock.changePercent,
                currencySymbol: loadedStock.currencySymbol,
                isMarketOpen: loadedStock.isMarketOpen,
                marketState: loadedStock.marketState,
              };

              if (prevTape.length > 0) {
                return [prevTape[0], newTapeItem, ...prevTape.slice(1)];
              }
              return [newTapeItem];
            });
            return;
          }
        }
      } catch {
        // Fallback handled below
      }

      const cleanKey = tickerToFetch
        .replace(/\.(JK|KS|KQ|AX)$/i, "")
        .replace(/-USD$/i, "")
        .toUpperCase();
      const fallback = MOCK_STOCKS[cleanKey] || MOCK_STOCKS["BMRI"];
      setStock(fallback);
    },
    []
  );

  // Initial load & when activeTicker or timeframe changes
  useEffect(() => {
    fetchStock(activeTicker, timeframe);
  }, [activeTicker, timeframe, fetchStock]);

  useEffect(() => {
    fetchTape();
  }, [fetchTape]);

  // Periodic Auto-refresh: only poll if market is open (REGULAR)
  useEffect(() => {
    if (!isLiveUpdating) return;
    const interval = setInterval(() => {
      if (stock.marketState === "REGULAR" || stock.isMarketOpen) {
        fetchStock(activeTicker, timeframe);
      }
      fetchTape();
    }, 20000);
    return () => clearInterval(interval);
  }, [
    activeTicker,
    timeframe,
    isLiveUpdating,
    stock.marketState,
    stock.isMarketOpen,
    fetchStock,
    fetchTape,
  ]);

  const handleSelectStock = (tickerOrSymbol: string) => {
    const clean = tickerOrSymbol.trim().toUpperCase();
    setActiveTicker(clean);
    router.replace(`/market?ticker=${encodeURIComponent(clean)}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#040914] text-slate-100 flex flex-col justify-between selection:bg-[#F5B700] selection:text-navy-950">
      {/* 1. Header Navigation with Interactive 01/04 Indicator, Portfolio & Global Search */}
      <HeaderNav
        activeStock={stock}
        onSelectStock={handleSelectStock}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        portfolioCount={portfolio.length}
        onOpenPortfolio={() => setPortfolioOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        isLiveUpdating={isLiveUpdating}
        activeSection={activeSection}
        onNavigateSection={handleNavigateSection}
      />

      {/* Global Ticker Tape Marquee */}
      <GlobalTickerTape
        tapeItems={tapeItems}
        onSelectStock={handleSelectStock}
        activeTicker={stock.ticker}
      />

      {/* 01 / 04 — OVERVIEW: Hero Section (Split Layout + Intelligence Brief + Orbital Chart) */}
      <HeroSection
        stock={stock}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        isWatchlisted={watchlist.includes(stock.ticker)}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* 02 / 04 — FUNDAMENTALS: Bento Grid Fundamental & Statistik Pasar Lengkap */}
      <BentoFundamentals stock={stock} />

      {/* 03 / 04 — COMPARE & SIMULATOR: Head-to-Head Return Chart & Smart Lot Calculator */}
      <CompareAndSimulator stock={stock} />

      {/* 04 / 04 — MARKET NEWS: Latest Stock News from /api/search */}
      <MarketNewsSection stock={stock} onSelectStock={handleSelectStock} />

      {/* Multi-Market Filter & Explorer */}
      <MarketExplorer
        activeTicker={stock.ticker}
        knownStocks={knownStocks}
        onSelectStock={handleSelectStock}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Drawers and Modals */}
      <PortfolioDrawer
        isOpen={portfolioOpen}
        onClose={() => setPortfolioOpen(false)}
        portfolio={portfolio}
        knownStocks={knownStocks}
        onUpdatePortfolio={handleUpdatePortfolio}
        onSelectStock={handleSelectStock}
      />

      <WatchlistDrawer
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        watchlist={watchlist}
        knownStocks={knownStocks}
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

      {/* Footer */}
      <Footer />
    </main>
  );
}

export default function MarketTerminalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040914] text-slate-100 flex items-center justify-center font-mono text-sm text-[#F5B700]">
          Memuat Market Terminal...
        </div>
      }
    >
      <MarketTerminalContent />
    </Suspense>
  );
}
