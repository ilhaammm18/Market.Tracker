"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Star, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { StockData, TimeFrame } from "@/types/stock";
import { formatCurrency } from "@/lib/utils";
import { StockChart } from "./StockChart";

interface HeroSectionProps {
  stock: StockData;
  timeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  stock,
  timeframe,
  onTimeframeChange,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const [realtimeClock, setRealtimeClock] = useState<string>("");
  const isPositive = stock.changePercent >= 0;

  // Real-time clock display (WIB)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setRealtimeClock(
        now.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
          " · " +
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) +
          " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full pt-6 pb-12 overflow-hidden radial-glow-hero">
      {/* Background Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ================= LEFT COLUMN: IDENTITAS SAHAM ================= */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            
            {/* Subtitle Kategori dengan Garis Emas */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#F5B700] rounded-full inline-block" />
              <span className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-[#F5B700] uppercase">
                {stock.category}
              </span>
            </div>

            {/* Nama Ticker Raksasa (6rem - 8rem) dengan Animasi Transisi Karakter */}
            <div className="relative overflow-visible my-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stock.ticker}
                  initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -25, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-4 flex-wrap"
                >
                  <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black tracking-tight text-[#F5B700] font-mono leading-none drop-shadow-[0_4px_35px_rgba(245,183,0,0.35)] select-none">
                    {stock.ticker}
                  </h1>

                  {/* Watchlist Star Toggle */}
                  <button
                    onClick={() => onToggleWatchlist(stock.ticker)}
                    className={`p-3 rounded-2xl border transition-all duration-300 ${
                      isWatchlisted
                        ? "bg-[#F5B700] text-navy-950 border-[#F5B700] shadow-gold scale-105"
                        : "bg-white/[0.05] text-white/50 border-white/10 hover:text-[#F5B700] hover:border-[#F5B700]/50"
                    }`}
                    title={isWatchlisted ? "Hapus dari Watchlist" : "Simpan ke Watchlist"}
                  >
                    <Star className={`w-6 h-6 ${isWatchlisted ? "fill-current" : ""}`} />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nama Lengkap & Deskripsi 1 Kalimat */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>{stock.name}</span>
                {stock.yahooSymbol && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/60 font-normal">
                    Yahoo: {stock.yahooSymbol}
                  </span>
                )}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
                {stock.description}
              </p>
            </div>

            {/* Deretan Pill Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Pill Pertama: Kuning Solid teks gelap */}
              <div className="px-3.5 py-1.5 rounded-full bg-[#F5B700] text-navy-950 font-mono font-extrabold text-xs tracking-wider shadow-gold uppercase">
                {stock.exchangeLabel}
              </div>

              {/* Status Jam Bursa (Market State Badge) */}
              <div
                className={`px-3.5 py-1.5 rounded-full font-mono text-xs flex items-center gap-2 border backdrop-blur-md ${
                  stock.isMarketOpen
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-emerald"
                    : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                }`}
              >
                {stock.isMarketOpen ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="font-bold tracking-wide">
                  {stock.marketStateText || (stock.isMarketOpen ? "MARKET OPEN · LIVE" : "MARKET CLOSED · HARGA PENUTUPAN")}
                </span>
              </div>

              {/* Pill Glassmorphism Sektor */}
              <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-white/80 font-mono text-xs backdrop-blur-md">
                {stock.sector}
              </div>

              {/* Pill Glassmorphism Negara */}
              <div className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-cyan-400 font-mono text-xs flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                {stock.country}
              </div>

              {/* Pill Mata Uang */}
              <div className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-white/60 font-mono text-xs backdrop-blur-md">
                {stock.currency} ({stock.currencySymbol})
              </div>
            </div>

            {/* Callout Box di Bagian Kiri Bawah dengan Garis Vertikal Kuning */}
            <div className="relative mt-2 p-4 sm:p-5 rounded-2xl bg-[#0A192F]/80 border border-white/[0.08] shadow-glass backdrop-blur-xl">
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-[#F5B700] to-[#E5A700] rounded-r-full shadow-gold" />
              <div className="pl-3 flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-[#F5B700]/10 text-[#F5B700]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-[#F5B700] uppercase">
                      INTELLIGENCE BRIEF & RESMI PASAR
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                      YAHOO FINANCE LIVE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {stock.insight}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE ORBITAL PRICE CARD ================= */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-6">
            
            {/* Orbital Rings Container (2 Lingkaran Orbit Tipis Berputar Lambat) */}
            <div className="absolute w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] pointer-events-none flex items-center justify-center">
              
              {/* Outer Orbit Ring (Rotasi Searah Jarum Jam) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-cyan-500/15"
              >
                {/* Node Cyan Bercahaya */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#06B6D4] shadow-cyan ring-4 ring-[#06B6D4]/20" />
                <div className="absolute bottom-6 right-16 w-2 h-2 rounded-full bg-cyan-300 shadow-cyan" />
              </motion.div>

              {/* Inner Orbit Ring (Rotasi Berlawanan Arah) */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
                className="absolute w-[80%] h-[80%] rounded-full border border-[#F5B700]/15"
              >
                {/* Node Kuning Emas Bercahaya */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-[#F5B700] shadow-gold ring-4 ring-[#F5B700]/20" />
                <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-[#F5B700]/80 shadow-gold" />
              </motion.div>

              {/* Faint Inner Core Glow */}
              <div className="absolute w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#F5B700]/5 via-cyan-500/5 to-transparent blur-2xl" />
            </div>

            {/* Floating Glassmorphism Price Card (Di Tengah Orbit) */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-[420px] rounded-3xl p-5 sm:p-6 bg-[#0A192F]/85 border border-white/10 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 hover:border-[#F5B700]/30 transition-all duration-300"
            >
              
              {/* Header Kartu: Ticker · Exchange & Live Clock */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F5B700]" />
                  <span className="font-mono font-bold text-sm text-white tracking-wider">
                    {stock.ticker} <span className="text-white/40">·</span> {stock.exchange}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {stock.isMarketOpen ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                  <span className="text-[11px] font-mono text-white/60">
                    {realtimeClock || "Pasar Terkoneksi"}
                  </span>
                </div>
              </div>

              {/* Harga Saat Ini Asli Tanpa Fluktuasi Palsu */}
              <div className="pt-4 pb-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1 flex items-center justify-between">
                  <span>{stock.isMarketOpen ? "Harga Real-Time Live" : "Harga Penutupan Resmi Terakhir"}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Yahoo Finance Feed</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black font-number text-white tracking-tight leading-none">
                    {formatCurrency(stock.price, stock.currency, stock.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Badge Persentase Perubahan Harian Asli */}
              <div className="flex items-center gap-2.5 pt-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold border transition-colors ${
                    isPositive
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-rose"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>
                    {isPositive ? "▲ +" : "▼ "}
                    {Math.abs(stock.changePercent).toFixed(2)}% hari ini
                  </span>
                </div>

                <span className="text-xs font-mono text-white/60">
                  ({isPositive ? "+" : ""}
                  {formatCurrency(stock.change, stock.currency, stock.currencySymbol)})
                </span>
              </div>

              {/* Sparkline / Area Chart Interaktif Kuning Emas dengan Data Riil */}
              <StockChart
                history={stock.history}
                timeframe={timeframe}
                onTimeframeChange={onTimeframeChange}
                currency={stock.currency}
                currencySymbol={stock.currencySymbol}
                isPositive={isPositive}
              />

            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
};
