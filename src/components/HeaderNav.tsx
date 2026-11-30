"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Command,
  Star,
  Sliders,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  Globe2,
  ChevronDown,
  Newspaper,
  Home,
  LineChart,
  Briefcase,
} from "lucide-react";
import {
  StockData,
  SearchQuoteItem,
  StockNewsItem,
  NavSectionId,
} from "@/types/stock";
import { MOCK_STOCKS } from "@/data/mockStocks";
import { formatCurrency } from "@/lib/utils";

interface HeaderNavProps {
  activeStock: StockData;
  onSelectStock: (ticker: string) => void;
  watchlistCount?: number;
  onOpenWatchlist?: () => void;
  portfolioCount?: number;
  onOpenPortfolio?: () => void;
  onOpenSettings?: () => void;
  isLiveUpdating?: boolean;
  activeSection?: NavSectionId;
  onNavigateSection?: (section: NavSectionId) => void;
}

export const NAV_SECTIONS: {
  id: NavSectionId;
  num: string;
  label: string;
  shortDesc: string;
}[] = [
  {
    id: "overview",
    num: "01",
    label: "OVERVIEW",
    shortDesc: "Identitas Emiten, Intelligence Brief & Orbital Chart",
  },
  {
    id: "fundamentals",
    num: "02",
    label: "FUNDAMENTALS",
    shortDesc: "Bento Grid Fundamental & Statistik Pasar Lengkap",
  },
  {
    id: "compare",
    num: "03",
    label: "COMPARE & SIMULATOR",
    shortDesc: "Head-to-Head Return & Kalkulator Lot Pintar",
  },
  {
    id: "news",
    num: "04",
    label: "MARKET NEWS",
    shortDesc: "Berita Terkini Saham & Rilis Media Global",
  },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeStock,
  onSelectStock,
  watchlistCount = 0,
  onOpenWatchlist,
  portfolioCount = 0,
  onOpenPortfolio,
  onOpenSettings,
  activeSection = "overview",
  onNavigateSection,
}) => {
  const pathname = usePathname();
  const isMarketRoute = pathname?.startsWith("/market");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState<SearchQuoteItem[]>([]);
  const [liveNewsPreview, setLiveNewsPreview] = useState<StockNewsItem[]>([]);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  const currentNav =
    NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0];
  const currentNavIndex =
    NAV_SECTIONS.findIndex((s) => s.id === activeSection) + 1;

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNavMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close nav dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        navDropdownRef.current &&
        !navDropdownRef.current.contains(e.target as Node)
      ) {
        setNavMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Debounced (300ms) live search via /api/search
  useEffect(() => {
    if (!searchOpen) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setLiveQuotes([]);
      setLiveNewsPreview([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLiveQuotes(Array.isArray(json.quotes) ? json.quotes : []);
            setLiveNewsPreview(
              Array.isArray(json.news) ? json.news.slice(0, 2) : []
            );
          }
        }
      } catch {
        // Keep existing state
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const defaultPresets = Object.values(MOCK_STOCKS);

  const handleSelect = (symbolOrTicker: string) => {
    onSelectStock(symbolOrTicker);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (liveQuotes.length > 0) {
        handleSelect(liveQuotes[0].symbol);
      } else {
        handleSelect(searchQuery.trim().toUpperCase());
      }
    }
  };

  const isRegularOpen =
    activeStock.marketState === "REGULAR" || activeStock.isMarketOpen;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#040914]/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          {/* Left: Brand / Active Stock Badge & Route Switcher (Home vs Market Terminal) */}
          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            <Link
              href="/"
              className="relative group flex items-center gap-3"
              title="Market.Tracker — Institutional Global Market Intelligence"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#F5B700] to-[#E5A700] text-navy-950 font-black text-sm flex items-center justify-center shadow-gold font-mono tracking-wider ring-2 ring-[#F5B700]/30 transition-transform group-hover:scale-105">
                {isMarketRoute ? activeStock.ticker.slice(0, 2) : "MT"}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                  {isMarketRoute ? (
                    <>
                      <span className="text-[#F5B700]">
                        {activeStock.ticker}
                      </span>
                      <span className="text-white/40">/</span>
                      <span className="text-white/80">
                        {activeStock.exchange}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-white">MARKET</span>
                      <span className="text-[#F5B700]">.TRACKER</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-white/50 truncate max-w-[110px] sm:max-w-[160px]">
                  {isMarketRoute
                    ? activeStock.name
                    : "Global Market Intelligence"}
                </span>
              </div>
            </Link>

            {/* Route Navigation Links: Home (/) & Market Terminal (/market) */}
            <nav
              aria-label="Main Route Navigation"
              className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]"
            >
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  !isMarketRoute
                    ? "bg-[#F5B700] text-navy-950 shadow-gold"
                    : "text-white/65 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <Link
                href="/market"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isMarketRoute
                    ? "bg-[#F5B700] text-navy-950 shadow-gold"
                    : "text-white/65 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Market Terminal</span>
              </Link>
            </nav>
          </div>

          {/* Center: Global Search Bar (Cmd+K) */}
          <div className="flex-1 max-w-md mx-1 sm:mx-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.09] hover:border-[#F5B700]/40 flex items-center justify-between text-sm text-white/50 transition-all duration-200 group shadow-inner"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-white/40 group-hover:text-[#F5B700] transition-colors shrink-0" />
                <span className="text-white/40 group-hover:text-white/70 transition-colors truncate text-xs sm:text-sm">
                  Cari saham dunia (BBCA, BREN, NVDA, AAPL, BTC)...
                </span>
              </div>
              <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-[11px] font-mono text-white/60 shrink-0 ml-2">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right: Interactive 01/04 Navigation, Watchlist & Market State Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Quick Link to Toggle Route */}
            <Link
              href={isMarketRoute ? "/" : "/market"}
              className="sm:hidden px-2.5 py-1.5 rounded-xl bg-[#F5B700]/15 border border-[#F5B700]/40 text-[#F5B700] font-mono text-[11px] font-bold flex items-center gap-1"
            >
              {isMarketRoute ? (
                <>
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </>
              ) : (
                <>
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Terminal</span>
                </>
              )}
            </Link>

            {/* Interactive Page/Section Indicator (01 / 04 — OVERVIEW) on Market Terminal */}
            {isMarketRoute && onNavigateSection && (
              <div ref={navDropdownRef} className="relative hidden lg:block">
                <div className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#F5B700]/40 rounded-xl px-3 py-1.5 transition-all">
                  {/* Direct Quick Number Pills 01-04 */}
                  <div className="hidden xl:flex items-center gap-1 pr-2 border-r border-white/10">
                    {NAV_SECTIONS.map((sec) => {
                      const active = sec.id === activeSection;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => onNavigateSection(sec.id)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                            active
                              ? "bg-[#F5B700] text-navy-950 shadow-gold"
                              : "text-white/45 hover:text-white hover:bg-white/10"
                          }`}
                          title={`Scroll ke ${sec.num} — ${sec.label}`}
                        >
                          {sec.num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Section Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => setNavMenuOpen((prev) => !prev)}
                    className="flex flex-col items-end text-right cursor-pointer"
                    title="Klik untuk navigasi cepat antar seksi (01 - 04)"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider font-semibold text-white/90">
                      <span className="text-[#F5B700] font-bold">
                        {currentNav.num} / 04
                      </span>
                      <span className="text-white/40">—</span>
                      <span className="text-white/80 uppercase">
                        {currentNav.label}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#F5B700] transition-transform duration-200 ${
                          navMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {/* Dynamic Progress Bar (25%, 50%, 75%, 100%) */}
                    <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[#F5B700] rounded-full transition-all duration-300"
                        style={{ width: `${(currentNavIndex / 4) * 100}%` }}
                      />
                    </div>
                  </button>
                </div>

                {/* Section Navigation Dropdown Menu */}
                {navMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0A192F]/95 border border-white/15 shadow-2xl backdrop-blur-2xl p-2 z-50 ring-1 ring-[#F5B700]/25 animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b border-white/[0.06] mb-1">
                      Navigasi Cepat Halaman (01 / 04)
                    </div>
                    {NAV_SECTIONS.map((sec) => {
                      const isCurrent = sec.id === activeSection;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => {
                            onNavigateSection(sec.id);
                            setNavMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-all ${
                            isCurrent
                              ? "bg-[#F5B700]/15 border border-[#F5B700]/40 text-white"
                              : "hover:bg-white/[0.06] text-white/70 border border-transparent"
                          }`}
                        >
                          <span
                            className={`font-mono text-xs font-black px-2 py-0.5 rounded-md mt-0.5 ${
                              isCurrent
                                ? "bg-[#F5B700] text-navy-950"
                                : "bg-white/[0.06] text-[#F5B700]"
                            }`}
                          >
                            {sec.num}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs font-bold tracking-wide text-white">
                              {sec.num} / 04 — {sec.label}
                            </div>
                            <div className="text-[11px] text-white/50 truncate mt-0.5">
                              {sec.shortDesc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Portfolio Quick Button with Asset Count Badge */}
            {onOpenPortfolio && (
              <button
                type="button"
                onClick={onOpenPortfolio}
                className="relative px-3 py-2 rounded-xl bg-[#F5B700]/10 hover:bg-[#F5B700]/20 border border-[#F5B700]/30 text-[#F5B700] font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Buka Multi-Asset Portfolio & PnL Tracker"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Portfolio</span>
                {portfolioCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F5B700] text-navy-950 font-extrabold text-[10px] leading-tight">
                    {portfolioCount}
                  </span>
                )}
              </button>
            )}

            {/* Watchlist Quick Button */}
            {onOpenWatchlist && (
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
            )}

            {/* API Settings Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-[#06B6D4] transition-all hidden sm:flex"
                title="Pengaturan Data API"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Official Market State Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isRegularOpen
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {isRegularOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isRegularOpen ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                ></span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold uppercase hidden sm:inline whitespace-nowrap">
                {isRegularOpen
                  ? "MARKET OPEN · LIVE"
                  : "MARKET CLOSED · HARGA PENUTUPAN RESMI"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal (Connected to /api/search with 300ms debounce & IDX priority) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0A192F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-[#F5B700]/25">
            {/* Search Input Bar */}
            <form
              onSubmit={handleCustomSubmit}
              className="relative p-4 border-b border-white/10 flex items-center gap-3"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-[#F5B700] animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-[#F5B700] shrink-0" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik kode saham dunia (misal: BBRI, BREN, ANTM, GOTO, AAPL, QQQ, BTC)..."
                className="w-full bg-transparent text-white placeholder-white/40 text-sm sm:text-base focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-mono text-white/40 hover:text-white px-2 py-1 rounded bg-white/5"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Search Results Body */}
            <div className="max-h-[420px] overflow-y-auto p-2 divide-y divide-white/[0.04]">
              {searchQuery.trim() ? (
                <>
                  <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-[#F5B700]" />
                      HASIL PENCARIAN GLOBAL YAHOO FINANCE (PRIORITAS BEI / IDX)
                    </span>
                    {isSearching && (
                      <span className="text-[#F5B700]">Mencari...</span>
                    )}
                  </div>

                  {liveQuotes.length > 0 ? (
                    liveQuotes.map((q) => (
                      <button
                        key={q.symbol}
                        type="button"
                        onClick={() => handleSelect(q.symbol)}
                        className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-white/[0.06] transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl border font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                              q.isIdx
                                ? "bg-[#F5B700]/15 border-[#F5B700]/40 text-[#F5B700]"
                                : "bg-navy-800 border-white/10 text-cyan-400 group-hover:border-[#F5B700]/50"
                            }`}
                          >
                            {q.cleanTicker.slice(0, 4)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-white group-hover:text-[#F5B700] transition-colors">
                                {q.symbol}
                              </span>
                              {q.isIdx && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5B700] text-navy-950 font-mono font-extrabold">
                                  PRIORITAS BEI · IDX
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">
                                {q.exchangeDisplay}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
                                {q.quoteType}
                              </span>
                            </div>
                            <span className="text-xs text-white/60 truncate block max-w-xs sm:max-w-md mt-0.5">
                              {q.longName}
                              {q.sector ? ` · ${q.sector}` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0 ml-2">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] group-hover:bg-[#F5B700] text-white/70 group-hover:text-navy-950 font-bold transition-all">
                            Analisis →
                          </span>
                        </div>
                      </button>
                    ))
                  ) : !isSearching ? (
                    <div className="p-8 text-center text-white/50">
                      <p>
                        Menampilkan pencocokan langsung untuk &quot;
                        {searchQuery.toUpperCase()}&quot;.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleSelect(searchQuery.trim().toUpperCase())
                        }
                        className="mt-3 px-4 py-2 rounded-xl bg-[#F5B700] text-navy-950 font-mono font-bold text-xs shadow-gold"
                      >
                        Analisis Ticker &quot;
                        {searchQuery.trim().toUpperCase()}&quot; Sekarang →
                      </button>
                    </div>
                  ) : null}

                  {/* Quick News Preview inside Search Modal */}
                  {liveNewsPreview.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-white/10 px-3 pb-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#06B6D4] mb-2 flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5" />
                        Berita Terkait Pencarian
                      </div>
                      <div className="space-y-1.5">
                        {liveNewsPreview.map((n) => (
                          <a
                            key={n.uuid}
                            href={n.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-xs text-white/80 hover:text-[#F5B700] transition-colors"
                          >
                            <div className="font-medium line-clamp-1">
                              {n.title}
                            </div>
                            <div className="text-[10px] text-white/40 font-mono mt-0.5">
                              {n.publisher} · {n.publishedAtText}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-mono text-white/40 flex items-center justify-between">
                    <span>
                      EMITEN POPULER MULTI-BURSA (KETIK UNTUK CARI SAHAM APA PUN
                      DI DUNIA)
                    </span>
                    <span className="text-[#F5B700]">
                      IDX · US · KRX · ASX · CRYPTO
                    </span>
                  </div>
                  {defaultPresets.map((stock) => {
                    const isPositive = stock.changePercent >= 0;
                    return (
                      <button
                        key={stock.id}
                        type="button"
                        onClick={() =>
                          handleSelect(stock.yahooSymbol || stock.ticker)
                        }
                        className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-white/[0.06] transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-navy-800 border border-white/10 text-[#F5B700] font-mono font-bold text-xs flex items-center justify-center group-hover:border-[#F5B700]/50 transition-colors">
                            {stock.ticker.slice(0, 4)}
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
                            {formatCurrency(
                              stock.price,
                              stock.currency,
                              stock.currencySymbol
                            )}
                          </div>
                          <div
                            className={`text-xs flex items-center justify-end gap-1 ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {isPositive ? "+" : ""}
                              {stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-3 bg-[#061024] border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between px-4">
              <span>
                Debounce 300ms · Otomatis deteksi .JK untuk 4 huruf kode emiten
                BEI
              </span>
              <span className="font-mono text-[#F5B700]">
                Yahoo Finance Search v1
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
