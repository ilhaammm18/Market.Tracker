"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HeaderNav } from "@/components/HeaderNav";
import { GlobalTickerTape } from "@/components/GlobalTickerTape";
import { PortfolioSummaryCard } from "@/components/PortfolioSummaryCard";
import { LandingSection } from "@/components/LandingSection";
import { WatchlistDrawer } from "@/components/WatchlistDrawer";
import { PortfolioDrawer } from "@/components/PortfolioDrawer";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";
import { Footer } from "@/components/Footer";
import {
  StockData,
  TickerTapeItem,
  PortfolioItem,
  PriceAlertItem,
} from "@/types/stock";
import { MOCK_STOCKS, INITIAL_TICKER_TAPE } from "@/data/mockStocks";
import {
  loadPortfolio,
  savePortfolio,
  DEFAULT_PORTFOLIO_ITEMS,
} from "@/lib/portfolio";
import {
  loadPriceAlerts,
  savePriceAlerts,
  evaluatePriceAlerts,
  countTriggeredAlerts,
  DEFAULT_PRICE_ALERTS,
} from "@/lib/alerts";

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
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    DEFAULT_PORTFOLIO_ITEMS
  );
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertItem[]>(
    DEFAULT_PRICE_ALERTS
  );
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [portfolioOpen, setPortfolioOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Load watchlist, portfolio & price alerts from LocalStorage on mount
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

      const loadedAlerts = loadPriceAlerts();
      setPriceAlerts(loadedAlerts);
    }
  }, []);

  const evaluatedAlerts = useMemo(
    () => evaluatePriceAlerts(priceAlerts, knownStocks),
    [priceAlerts, knownStocks]
  );

  const triggeredAlertsCount = useMemo(
    () => countTriggeredAlerts(evaluatedAlerts),
    [evaluatedAlerts]
  );

  const handleUpdatePortfolio = (nextItems: PortfolioItem[]) => {
    setPortfolio(nextItems);
    savePortfolio(nextItems);
  };

  const handleAddAlert = (alertInput: Omit<PriceAlertItem, "id" | "createdAt">) => {
    const newAlert: PriceAlertItem = {
      ...alertInput,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const nextAlerts = [newAlert, ...priceAlerts];
    setPriceAlerts(nextAlerts);
    savePriceAlerts(nextAlerts);
  };

  const handleRemoveAlert = (id: string) => {
    const nextAlerts = priceAlerts.filter((a) => a.id !== id);
    setPriceAlerts(nextAlerts);
    savePriceAlerts(nextAlerts);
  };

  // Fetch real-time ticker tape & hydrate snapshot cards + portfolio prices
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
      {/* 1. Header Navigation with Route Links (Home vs Market Terminal), Portfolio, Alerts & Global Search */}
      <HeaderNav
        activeStock={featuredStock}
        onSelectStock={handleNavigateToMarket}
        watchlistCount={watchlist.length}
        triggeredAlertsCount={triggeredAlertsCount}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        portfolioCount={portfolio.length}
        onOpenPortfolio={() => setPortfolioOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 2. Global Ticker Tape at the Very Top */}
      <GlobalTickerTape
        tapeItems={tapeItems}
        onSelectStock={handleNavigateToMarket}
        activeTicker=""
      />

      {/* 3. Quick Portfolio Overview Widget on Home Page */}
      <PortfolioSummaryCard
        portfolio={portfolio}
        knownStocks={knownStocks}
        onOpenPortfolio={() => setPortfolioOpen(true)}
        onSelectStock={handleNavigateToMarket}
      />

      {/* 4. Modern Fintech Landing Section (Hero, Live Market Snapshot & Platform Capabilities) */}
      <LandingSection
        knownStocks={knownStocks}
        onSelectStock={handleNavigateToMarket}
      />

      {/* Drawers & Modals */}
      <PortfolioDrawer
        isOpen={portfolioOpen}
        onClose={() => setPortfolioOpen(false)}
        portfolio={portfolio}
        knownStocks={knownStocks}
        onUpdatePortfolio={handleUpdatePortfolio}
        onSelectStock={handleNavigateToMarket}
      />

      <WatchlistDrawer
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        watchlist={watchlist}
        knownStocks={knownStocks}
        onSelectStock={handleNavigateToMarket}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        alerts={evaluatedAlerts}
        onAddAlert={handleAddAlert}
        onRemoveAlert={handleRemoveAlert}
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
