"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  Globe2,
  Activity,
  LineChart,
  Calculator,
  Newspaper,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Loader2,
  ShieldCheck,
  Layers,
  Terminal,
} from "lucide-react";
import { StockData, SearchQuoteItem } from "@/types/stock";
import { formatCurrency } from "@/lib/utils";
import { calculateRSI } from "@/lib/indicators";

interface LandingSectionProps {
  knownStocks: Record<string, StockData>;
  onSelectStock: (tickerOrSymbol: string) => void;
}

const SNAPSHOT_TICKERS: {
  key: string;
  displaySymbol: string;
  querySymbol: string;
}[] = [
  { key: "BBCA", displaySymbol: "BBCA.JK", querySymbol: "BBCA" },
  { key: "NVDA", displaySymbol: "NVDA", querySymbol: "NVDA" },
  { key: "BTC", displaySymbol: "BTC-USD", querySymbol: "BTC-USD" },
  { key: "AAPL", displaySymbol: "AAPL", querySymbol: "AAPL" },
];

export const LandingSection: React.FC<LandingSectionProps> = ({
  knownStocks,
  onSelectStock,
}) => {
  const [quickQuery, setQuickQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchQuoteItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close suggestion dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced 300ms live search for Hero Quick Search
  useEffect(() => {
    const trimmed = quickQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
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
          if (json.success && Array.isArray(json.quotes)) {
            setSuggestions(json.quotes.slice(0, 6));
          }
        }
      } catch {
        // Ignore network error and allow direct submit
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [quickQuery]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickQuery.trim();
    if (!trimmed) return;
    if (suggestions.length > 0) {
      onSelectStock(suggestions[0].symbol);
    } else {
      onSelectStock(trimmed.toUpperCase());
    }
    setDropdownOpen(false);
  };

  // Build SVG sparkline path from stock sparkline numbers
  const buildSparklinePath = (values: number[]) => {
    const pts = values && values.length > 1 ? values : [100, 101, 100.5, 102];
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = Math.max(max - min, 0.0001);
    const width = 140;
    const height = 42;

    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      linePath: `M ${coords.join(" L ")}`,
      areaPath: `M 0,${height} L ${coords.join(" L ")} L ${width},${height} Z`,
    };
  };

  const capabilities = [
    {
      num: "01",
      title: "Real-Time Multi-Exchange Data",
      badge: "YAHOO FINANCE V8 LIVE",
      icon: Globe2,
      accentColor: "text-[#F5B700]",
      borderGlow: "hover:border-[#F5B700]/40",
      badgeStyle:
        "bg-[#F5B700]/15 text-[#F5B700] border-[#F5B700]/30",
      description:
        "Integrasi langsung dengan endpoint resmi Yahoo Finance v8 tanpa simulasi acak. Mencakup saham Indonesia (BEI .JK), Wall Street (NASDAQ & NYSE), Korea (KRX), Australia (ASX), ETF, dan Kripto dengan aturan pembulatan harga presisi.",
      highlights: [
        "Sinkronisasi satu sumber state antara Global Tape & Kartu Utama",
        "Prioritas pencarian emiten BEI (.JK) otomatis dengan debounce 300ms",
        "Deteksi status jam bursa resmi (REGULAR vs MARKET CLOSED)",
      ],
    },
    {
      num: "02",
      title: "Technical Charting & Indicators",
      badge: "SMA 20 · EMA 50 · RSI 14",
      icon: LineChart,
      accentColor: "text-[#06B6D4]",
      borderGlow: "hover:border-[#06B6D4]/40",
      badgeStyle:
        "bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30",
      description:
        "Visualisasi grafik interaktif berbasis lightweight-charts dalam mode Area Emas maupun Candlestick OHLC profesional, dilengkapi overlay indikator teknikal dan histogram volume.",
      highlights: [
        "Toggle interaktif overlay garis SMA 20 (Amber) & EMA 50 (Cyan)",
        "Indikator momentum RSI (14) real-time (Overbought, Oversold, Neutral)",
        "Distribusi bar volume & analisis bias tren lintas 5 timeframe (1D–ALL)",
      ],
    },
    {
      num: "03",
      title: "Head-to-Head Stock & Lot Simulator",
      badge: "DUAL RETURN & IDX LOT",
      icon: Calculator,
      accentColor: "text-emerald-400",
      borderGlow: "hover:border-emerald-500/40",
      badgeStyle:
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      description:
        "Bandingkan kinerja persentase return dua saham secara berdampingan pada satu kanvas grafik dan hitung simulasi modal pembelian secara akurat.",
      highlights: [
        "Komparasi persentase return relatif (misal BBCA vs BMRI atau VOO vs QQQ)",
        "Kalkulator Lot Pintar: otomatis 1 Lot = 100 Lembar untuk saham BEI (.JK)",
        "Simulasi instan estimasi nilai portofolio & target persentase profit",
      ],
    },
    {
      num: "04",
      title: "Live Financial News",
      badge: "GLOBAL MEDIA FEED",
      icon: Newspaper,
      accentColor: "text-amber-300",
      borderGlow: "hover:border-amber-400/40",
      badgeStyle:
        "bg-amber-500/15 text-amber-300 border-amber-500/30",
      description:
        "Kurasi berita pasar modal dan rilis media finansial terkini yang terhubung langsung dengan emiten yang sedang Anda pantau di terminal.",
      highlights: [
        "Agregasi berita real-time dari penerbit finansial terkemuka dunia",
        "Tag emiten terkait yang interaktif untuk berpindah analisis saham",
        "Akses langsung ke artikel sumber asli beserta cap waktu publikasi",
      ],
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* ================= 1. HERO BANNER SECTION ================= */}
      <section className="relative w-full pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden radial-glow-hero border-b border-white/[0.06]">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[560px] h-[280px] bg-gradient-to-tr from-[#F5B700]/10 via-[#06B6D4]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Top Institutional Badge */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0A192F]/90 border border-[#F5B700]/30 text-xs font-mono text-[#F5B700] shadow-gold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>MULTI-ASSET FINANCIAL INTELLIGENCE PLATFORM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]"
            >
              Institutional-Grade{" "}
              <span className="bg-gradient-to-r from-[#F5B700] via-amber-200 to-[#06B6D4] bg-clip-text text-transparent">
                Global Market Intelligence
              </span>
            </motion.h1>

            {/* Subtitle Description */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed"
            >
              Platform analitik saham dan aset global real-time dengan grafik
              OHLC Candlestick, indikator teknikal{" "}
              <span className="text-[#F5B700] font-mono font-medium">
                SMA 20 · EMA 50 · RSI 14
              </span>
              , simulasi komparasi return, dan kalkulator lot otomatis untuk
              Bursa Efek Indonesia (IDX) maupun pasar dunia.
            </motion.p>

            {/* Quick Search Box (Navigates to /market?ticker=SYMBOL) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              ref={searchBoxRef}
              className="relative max-w-2xl mx-auto pt-2"
            >
              <form
                onSubmit={handleQuickSubmit}
                className="relative flex items-center bg-[#0A192F]/90 border border-white/15 focus-within:border-[#F5B700] rounded-2xl p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 transition-all"
              >
                <div className="pl-3 pr-2 text-[#F5B700]">
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </div>
                <input
                  type="text"
                  value={quickQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setQuickQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  placeholder="Ketik kode saham dunia (BBCA, BMRI, BREN, NVDA, AAPL, BTC-USD)..."
                  className="w-full bg-transparent text-white placeholder-white/40 text-sm sm:text-base focus:outline-none font-sans py-2"
                />
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-mono font-extrabold text-xs sm:text-sm tracking-wide transition-all shrink-0 shadow-gold"
                >
                  Analisis →
                </button>
              </form>

              {/* Quick Autocomplete Dropdown */}
              {dropdownOpen && quickQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#0A192F] border border-white/15 shadow-2xl overflow-hidden z-30 text-left divide-y divide-white/[0.05]">
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onSelectStock(item.symbol);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.06] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 font-mono font-bold text-xs text-[#F5B700] flex items-center justify-center shrink-0">
                            {item.cleanTicker.slice(0, 4)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white group-hover:text-[#F5B700]">
                                {item.symbol}
                              </span>
                              {item.isIdx && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5B700] text-navy-950 font-mono font-bold">
                                  IDX
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-white/50">
                                {item.exchangeDisplay}
                              </span>
                            </div>
                            <span className="text-xs text-white/50 truncate block max-w-md">
                              {item.longName}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#F5B700] font-bold">
                          Buka Terminal →
                        </span>
                      </button>
                    ))
                  ) : !isSearching ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onSelectStock(quickQuery.trim().toUpperCase());
                      }}
                      className="w-full px-4 py-3 text-xs font-mono text-white/70 hover:text-[#F5B700] hover:bg-white/[0.05] flex items-center justify-between"
                    >
                      <span>
                        Buka langsung ticker &quot;
                        {quickQuery.trim().toUpperCase()}&quot; di Market
                        Terminal
                      </span>
                      <span className="text-[#F5B700] font-bold">Enter ↵</span>
                    </button>
                  ) : null}
                </div>
              )}

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs font-mono">
                <span className="text-white/40">Akses Cepat:</span>
                {["BBCA", "BMRI", "BBRI", "NVDA", "AAPL", "VOO", "BTC-USD"].map(
                  (sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => onSelectStock(sym)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-[#F5B700]/20 border border-white/[0.08] hover:border-[#F5B700]/40 text-white/70 hover:text-[#F5B700] transition-all"
                    >
                      {sym}
                    </button>
                  )
                )}
              </div>
            </motion.div>

            {/* Primary CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/market"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-mono font-black text-sm sm:text-base tracking-wide shadow-gold transition-all hover:scale-[1.02]"
              >
                <Terminal className="w-5 h-5" />
                <span>Launch Market Terminal</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#platform-capabilities"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/85 font-mono font-bold text-sm transition-all"
              >
                <Layers className="w-4 h-4 text-[#06B6D4]" />
                <span>Explore Capabilities</span>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= 2. LIVE MARKET SNAPSHOT (4 MINI INTERACTIVE CARDS) ================= */}
      <section className="w-full py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#F5B700] uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>REAL-TIME MULTI-MARKET FEED</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Live Market Snapshot
            </h2>
          </div>
          <Link
            href="/market"
            className="text-xs font-mono font-bold text-[#06B6D4] hover:text-[#F5B700] flex items-center gap-1.5 transition-colors"
          >
            <span>Lihat Seluruh Bursa di Market Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SNAPSHOT_TICKERS.map((item, idx) => {
            const stock = knownStocks[item.key] || knownStocks["BMRI"];
            const isPositive = stock.changePercent >= 0;
            const spark = buildSparklinePath(stock.sparkline);
            const rsiSnap = calculateRSI(stock.history["1D"] || [], 14);
            const strokeColor = isPositive ? "#10B981" : "#F43F5E";
            const gradId = `snap-grad-${item.key}`;

            return (
              <motion.button
                key={item.key}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
                whileHover={{ y: -5 }}
                onClick={() => onSelectStock(item.querySymbol)}
                className="text-left group relative rounded-2xl p-5 bg-[#0A192F]/80 border border-white/[0.08] hover:border-[#F5B700]/50 shadow-glass backdrop-blur-xl transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Top Row: Ticker & Exchange */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-white group-hover:text-[#F5B700] transition-colors">
                        {item.displaySymbol}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70">
                        {stock.exchange}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1 border ${
                        isPositive
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  <p className="text-xs text-white/50 truncate mb-3">
                    {stock.name}
                  </p>
                </div>

                {/* Middle Row: Price & Sparkline */}
                <div className="flex items-end justify-between gap-2 my-2">
                  <div>
                    <span className="text-[10px] font-mono text-white/40 block">
                      Harga Terkini
                    </span>
                    <span className="text-xl font-black font-mono text-white">
                      {formatCurrency(
                        stock.price,
                        stock.currency,
                        stock.currencySymbol
                      )}
                    </span>
                  </div>

                  <svg
                    width="115"
                    height="42"
                    viewBox="0 0 140 42"
                    className="overflow-visible shrink-0"
                  >
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={strokeColor}
                          stopOpacity="0.32"
                        />
                        <stop
                          offset="100%"
                          stopColor={strokeColor}
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    <path d={spark.areaPath} fill={`url(#${gradId})`} />
                    <path
                      d={spark.linePath}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Footer Row: RSI(14) & Action */}
                <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-white/50 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#06B6D4]" />
                    RSI(14):{" "}
                    <b className="text-white/80">{rsiSnap.value.toFixed(1)}</b>
                  </span>
                  <span className="text-[#F5B700] font-bold group-hover:translate-x-0.5 transition-transform">
                    Analisis →
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ================= 3. PLATFORM CAPABILITIES (BENTO GRID SHOWCASE) ================= */}
      <section
        id="platform-capabilities"
        className="w-full py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-white/[0.08] gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#06B6D4] uppercase">
              <ShieldCheck className="w-4 h-4 text-[#F5B700]" />
              <span>INSTITUTIONAL ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Platform Capabilities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-white/50 font-mono">
            4 Pilar Utama Ekosistem Analitik Pasar Global Market.Tracker
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((cap, idx) => {
            const IconComponent = cap.icon;
            return (
              <motion.div
                key={cap.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-3xl p-6 sm:p-7 bg-[#0A192F]/75 border border-white/[0.08] ${cap.borderGlow} shadow-glass backdrop-blur-xl transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                        <IconComponent
                          className={`w-5 h-5 ${cap.accentColor}`}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-white/40">
                        MODULE {cap.num}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${cap.badgeStyle}`}
                    >
                      {cap.badge}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5">
                    {cap.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed mb-5 font-light">
                    {cap.description}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                  {cap.highlights.map((hl, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs font-mono text-white/75"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5B700] shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Call-to-Action Banner */}
        <div className="mt-12 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0A192F] via-[#0F264A] to-[#0A192F] border border-[#F5B700]/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="text-xs font-mono font-bold text-[#F5B700] uppercase tracking-wider">
              READY FOR DEEP TECHNICAL & FUNDAMENTAL ANALYSIS
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Mulai Eksplorasi Saham IDX & Global di Market Terminal
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Nikmati grafik interaktif dengan indikator SMA 20, EMA 50, RSI 14,
              perbandingan return head-to-head, dan berita pasar modal real-time.
            </p>
          </div>

          <Link
            href="/market"
            className="px-6 py-3.5 rounded-2xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-mono font-black text-sm tracking-wide shadow-gold flex items-center gap-2.5 shrink-0 transition-all hover:scale-105"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch Market Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
