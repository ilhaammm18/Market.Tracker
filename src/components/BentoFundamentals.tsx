"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Coins,
  BarChart3,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  Building2,
  TrendingUp,
  Percent,
  CheckCircle2,
} from "lucide-react";
import { StockData } from "@/types/stock";
import { formatCurrency } from "@/lib/utils";

interface BentoFundamentalsProps {
  stock: StockData;
}

export const BentoFundamentals: React.FC<BentoFundamentalsProps> = ({ stock }) => {
  // Calculate position in 52-week range (0 to 100%)
  const range52 = stock.high52w - stock.low52w || 1;
  const pos52 = Math.min(100, Math.max(0, ((stock.price - stock.low52w) / range52) * 100));

  return (
    <section className="w-full py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-white/[0.08] gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#F5B700] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#F5B700] inline-block shadow-gold" />
            BENTO GRID FUNDAMENTAL & STATISTIK
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Metrik Finansial & Parameter Pasar {stock.ticker}
          </h3>
        </div>

        <div className="text-xs font-mono text-white/50 flex items-center gap-2">
          <span>Sektor: <b className="text-white/80">{stock.sector}</b></span>
          <span className="text-white/20">|</span>
          <span className="text-[#06B6D4]">Updated Live</span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* ================= CARD 1: MARKET CAP ================= */}
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
              <span>MARKET CAP (KAPITALISASI)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/30">
              {stock.marketCap > 1e12 ? "MEGA-CAP" : "LARGE-CAP"}
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight my-1">
            {stock.marketCapDisplay}
          </div>

          <p className="text-xs text-white/50 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Emiten berbobot dominan di indeks {stock.exchange}</span>
          </p>
        </motion.div>

        {/* ================= CARD 2: P/E RATIO & VALUASI ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-400">
            <BarChart3 className="w-16 h-16" />
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>P/E RATIO & EPS</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              TTM VALUATION
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {stock.peRatio > 0 ? `${stock.peRatio.toFixed(1)}x` : "N/A (Crypto)"}
            </span>
            {stock.eps ? (
              <span className="text-xs font-mono text-white/50">
                EPS: <b className="text-white/80">{stock.eps > 10 ? Math.round(stock.eps) : stock.eps.toFixed(2)}</b>
              </span>
            ) : null}
          </div>

          <p className="text-xs text-white/50 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" />
            <span>
              {stock.peRatio > 0 && stock.peRatio < 15
                ? "Valuasi menarik di bawah rata-rata historis industri"
                : stock.peRatio >= 15
                ? "Multiple valuasi mencerminkan ekspektasi pertumbuhan laba"
                : "Aset komoditas moneter digital"}
            </span>
          </p>
        </motion.div>

        {/* ================= CARD 3: 52-WEEK HIGH / LOW ================= */}
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

          {/* Progress Bar Range */}
          <div className="my-2 space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-navy-950 border border-white/10 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-[#F5B700] to-emerald-500 rounded-full"
                style={{ width: `${pos52}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/60">
              <div>
                <span className="text-[10px] text-white/40 block">52W Terendah</span>
                <span className="font-semibold text-rose-400">
                  {formatCurrency(stock.low52w, stock.currency, stock.currencySymbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 block">52W Tertinggi</span>
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(stock.high52w, stock.currency, stock.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50 mt-1">
            Harga saat ini bergerak {pos52 > 70 ? "mendekati level resistensi tertinggi tahunan" : "dalam rentang konsolidasi tengah tahunan"}.
          </p>
        </motion.div>

        {/* ================= CARD 4: VOLUME HARIAN & LIKUIDITAS ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <Activity className="w-4 h-4 text-[#F5B700]" />
              <span>VOLUME HARIAN & LIKUIDITAS</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/80 border border-white/10">
              TIER-1 LIQUIDITY
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight my-1">
            {stock.volumeDisplay}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-[10px] text-white/40 block">High 24H</span>
              <span className="text-white/80 font-semibold">
                {formatCurrency(stock.high24h, stock.currency, stock.currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block">Low 24H</span>
              <span className="text-white/80 font-semibold">
                {formatCurrency(stock.low24h, stock.currency, stock.currencySymbol)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ================= CARD 5: DIVIDEND YIELD ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>DIVIDEND YIELD (IMBAL HASIL)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              CASH FLOW
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight my-1">
            {stock.dividendYield}
          </div>

          <p className="text-xs text-white/50 mt-2">
            Imbal hasil dividen kas tahunan terdistribusi kepada pemegang saham reguler.
          </p>
        </motion.div>

        {/* ================= CARD 6: BETA & RISK PROFILE ================= */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-5 bg-[#0A192F]/70 border border-white/[0.08] hover:border-[#F5B700]/30 shadow-glass backdrop-blur-xl group overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
              <span>BETA (VOLATILITAS PASAR)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
              PROFIL RISIKO
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {stock.beta !== undefined ? stock.beta.toFixed(2) : "1.00"}
            </span>
            <span className="text-xs font-mono text-white/50">
              {stock.beta && stock.beta < 1
                ? "Defensif (Fluktuasi < Indeks)"
                : stock.beta && stock.beta > 1.3
                ? "Agresif (High Volatility)"
                : "Moderat / Selaras Indeks"}
            </span>
          </div>

          <p className="text-xs text-white/50 mt-2">
            Mengukur sensitivitas pergerakan harga saham terhadap fluktuasi pasar modal secara agregat.
          </p>
        </motion.div>

      </div>
    </section>
  );
};

