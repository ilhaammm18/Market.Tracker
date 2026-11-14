"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  Building2,
  ArrowUpDown,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { StockData } from "@/types/stock";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface BentoFundamentalsProps {
  stock: StockData;
}

export const BentoFundamentals: React.FC<BentoFundamentalsProps> = ({ stock }) => {
  // Safe numbers with nullish coalescing fallbacks
  const price = stock.price ?? 0;
  const openPrice = stock.openPrice ?? stock.previousClose ?? price;
  const prevClose = stock.previousClose ?? price;
  const high24h = stock.high24h ?? price;
  const low24h = stock.low24h ?? price;
  const high52w = stock.high52w ?? high24h;
  const low52w = stock.low52w ?? low24h;
  const volume = stock.volume ?? 0;
  const change = stock.change ?? 0;
  const changePercent = stock.changePercent ?? 0;
  const marketCap = stock.marketCap ?? 0;
  const peRatio = stock.peRatio ?? 0;
  const beta = stock.beta ?? 1.0;

  // Position in 52-week range (0 to 100%)
  const range52 = Math.max(high52w - low52w, 0.0001);
  const pos52 = Math.min(100, Math.max(0, ((price - low52w) / range52) * 100));

  // Position in 24h intraday range (0 to 100%)
  const range24 = Math.max(high24h - low24h, 0.0001);
  const pos24 =
    high24h > low24h
      ? Math.min(100, Math.max(0, ((price - low24h) / range24) * 100))
      : 50;

  const spread24Pct =
    low24h > 0 ? ((high24h - low24h) / low24h) * 100 : 0;
  const spread52Pct =
    low52w > 0 ? ((high52w - low52w) / low52w) * 100 : 0;

  const estimatedTurnover = volume * price;
  const isIdx = stock.exchange === "IDX" || (stock.yahooSymbol ?? "").endsWith(".JK");
  const volumeLots = isIdx ? Math.round(volume / 100) : 0;

  return (
    <section
      id="section-fundamentals"
      className="w-full py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-white/[0.08] gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#F5B700] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#F5B700] inline-block shadow-gold" />
            02 / 04 — BENTO GRID FUNDAMENTAL & STATISTIK PASAR
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Metrik Real-Time & Parameter Perdagangan {stock.ticker} ({stock.yahooSymbol})
          </h3>
        </div>

        <div className="text-xs font-mono text-white/50 flex items-center gap-2">
          <span>
            Bursa: <b className="text-white/80">{stock.exchange}</b>
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[#06B6D4]">Yahoo Finance v8 Verified</span>
        </div>
      </div>

      {/* Bento Grid Layout (6 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* ================= CARD 1: RENTANG HARGA HARIAN (24H RANGE) ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <ArrowUpDown className="w-4 h-4 text-[#F5B700]" />
              <span>RENTANG HARGA HARIAN (24H)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/30">
              SPREAD: {spread24Pct.toFixed(2)}%
            </span>
          </div>

          {/* Intraday Progress Bar */}
          <div className="my-2.5 space-y-2">
            <div className="w-full h-2.5 rounded-full bg-navy-950 border border-white/10 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-[#F5B700] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pos24}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-white/40 block">Low Harian</span>
                <span className="font-bold text-rose-400">
                  {formatCurrency(low24h ?? 0, stock.currency, stock.currencySymbol)}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-white/40 block">Saat Ini</span>
                <span className="font-bold text-[#F5B700]">
                  {formatCurrency(price ?? 0, stock.currency, stock.currencySymbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 block">High Harian</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(high24h ?? 0, stock.currency, stock.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50 mt-2">
            Posisi harga berada di <b className="text-white/80">{pos24.toFixed(0)}%</b> dari rentang fluktuasi sesi perdagangan terakhir.
          </p>
        </motion.div>

        {/* ================= CARD 2: RENTANG 52-MINGGU (52W HIGH / LOW) ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <SlidersHorizontal className="w-4 h-4 text-[#06B6D4]" />
              <span>RENTANG 52-MINGGU</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
              POSISI: {pos52.toFixed(0)}%
            </span>
          </div>

          {/* 52W Progress Bar Range */}
          <div className="my-2.5 space-y-2">
            <div className="w-full h-2.5 rounded-full bg-navy-950 border border-white/10 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-[#F5B700] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pos52}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/60">
              <div>
                <span className="text-[10px] text-white/40 block">52W Terendah (Support)</span>
                <span className="font-bold text-rose-400">
                  {formatCurrency(low52w ?? 0, stock.currency, stock.currencySymbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 block">52W Tertinggi (Resistance)</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(high52w ?? 0, stock.currency, stock.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50 mt-2">
            {pos52 >= 75
              ? "Bergerak kuat mendekati area Resistance 52-Minggu Tertinggi."
              : pos52 <= 25
              ? "Berada di dekat area Support 52-Minggu Terendah (zona pantauan)."
              : "Bergerak di zona konsolidasi tengah rentang tahunan."}
          </p>
        </motion.div>

        {/* ================= CARD 3: VOLUME TRANSAKSI HARIAN & LIKUIDITAS ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>VOLUME TRANSAKSI HARIAN</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              REAL VOLUME
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight my-1">
            {stock.volumeDisplay || formatNumber(volume ?? 0)}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-[10px] text-white/40 block">
                {isIdx ? "Setara Satuan Lot BEI" : "Volume Aktual"}
              </span>
              <span className="text-[#F5B700] font-semibold">
                {isIdx
                  ? `${formatNumber(volumeLots ?? 0)} Lot`
                  : `${(volume ?? 0).toLocaleString("en-US")} Unit`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/40 block">Est. Nilai Transaksi</span>
              <span className="text-white/85 font-semibold">
                {stock.currencySymbol} {formatNumber(estimatedTurnover ?? 0)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ================= CARD 4: HARGA PEMBUKAAN & PENUTUPAN SEBELUMNYA ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <Clock className="w-4 h-4 text-[#F5B700]" />
              <span>PEMBUKAAN & PENUTUPAN</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/80 border border-white/10">
              SESI BURSA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-2">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-white/40 block">
                Harga Pembukaan (Open)
              </span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-white mt-0.5 block">
                {formatCurrency(openPrice ?? 0, stock.currency, stock.currencySymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-white/40 block">
                Penutupan Sebelumnya
              </span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-cyan-300 mt-0.5 block">
                {formatCurrency(prevClose ?? 0, stock.currency, stock.currencySymbol)}
              </span>
            </div>
          </div>

          <p className="text-xs text-white/50 mt-2 flex items-center justify-between font-mono">
            <span>Selisih vs Prev Close:</span>
            <b className={change >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {change >= 0 ? "+" : ""}
              {formatCurrency(change ?? 0, stock.currency, stock.currencySymbol)} (
              {change >= 0 ? "+" : ""}
              {(changePercent ?? 0).toFixed(2)}%)
            </b>
          </p>
        </motion.div>

        {/* ================= CARD 5: ESTIMASI KAPITALISASI & VALUASI ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[#F5B700]">
            <Building2 className="w-16 h-16" />
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <Building2 className="w-4 h-4 text-[#F5B700]" />
              <span>KAPITALISASI & VALUASI</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/30">
              {(marketCap ?? 0) > 1e12 ? "MEGA-CAP" : "LARGE-CAP"}
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight my-1">
            {stock.marketCapDisplay || formatNumber(marketCap ?? 0)}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-[10px] text-white/40 block">P/E Ratio (Valuasi)</span>
              <span className="text-white/90 font-bold">
                {(peRatio ?? 0) > 0 ? `${(peRatio ?? 0).toFixed(1)}x` : "N/A (Spot Asset)"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/40 block">Dividend Yield</span>
              <span className="text-emerald-400 font-bold">{stock.dividendYield || "0.00%"}</span>
            </div>
          </div>
        </motion.div>

        {/* ================= CARD 6: PROFIL VOLATILITAS & BETA PASAR ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
              <span>PROFIL VOLATILITAS & BETA</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
              {beta < 0.95
                ? "DEFENSIF"
                : beta > 1.3
                ? "HIGH BETA"
                : "MODERAT"}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {`${beta.toFixed(2)}x`}
            </span>
            <span className="text-xs font-mono text-white/50">
              Rentang 52W: <b className="text-cyan-400">{spread52Pct.toFixed(1)}%</b>
            </span>
          </div>

          <p className="text-xs text-white/50 mt-2.5 pt-2 border-t border-white/[0.06] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Ayunan harga tahunan {spread52Pct.toFixed(1)}% dengan volatilitas harian{" "}
              {spread24Pct.toFixed(2)}%.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
