"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  createChart,
  LineSeries,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
} from "lightweight-charts";
import {
  GitCompare,
  Calculator,
  TrendingUp,
  TrendingDown,
  Search,
  Layers,
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { StockData, TimeFrame } from "@/types/stock";
import { MOCK_STOCKS } from "@/data/mockStocks";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface CompareAndSimulatorProps {
  stock: StockData;
}

const COMPARE_PRESETS = [
  { label: "BBCA.JK", value: "BBCA" },
  { label: "BMRI.JK", value: "BMRI" },
  { label: "BBRI.JK", value: "BBRI" },
  { label: "TLKM.JK", value: "TLKM" },
  { label: "ASII.JK", value: "ASII" },
  { label: "VOO", value: "VOO" },
  { label: "QQQ", value: "QQQ" },
  { label: "AAPL", value: "AAPL" },
  { label: "NVDA", value: "NVDA" },
  { label: "MSFT", value: "MSFT" },
  { label: "BTC-USD", value: "BTC" },
];

export const CompareAndSimulator: React.FC<CompareAndSimulatorProps> = ({ stock }) => {
  // ---------------- HEAD-TO-HEAD COMPARISON STATE ----------------
  const [compareTicker, setCompareTicker] = useState<string>("BBCA");
  const [customCompareInput, setCustomCompareInput] = useState<string>("");
  const [compareTimeframe, setCompareTimeframe] = useState<TimeFrame>("1M");
  const [primaryChartStock, setPrimaryChartStock] = useState<StockData>(stock);
  const [secondaryStock, setSecondaryStock] = useState<StockData>(MOCK_STOCKS["BBCA"]);
  const [isLoadingCompare, setIsLoadingCompare] = useState<boolean>(false);

  const compareChartContainerRef = useRef<HTMLDivElement | null>(null);

  // Automatically pick a smart default opponent when active stock changes
  useEffect(() => {
    const activeUpper = stock.ticker.toUpperCase();
    if (activeUpper === compareTicker.toUpperCase()) {
      if (stock.exchange === "IDX") {
        setCompareTicker(activeUpper === "BBCA" ? "BMRI" : "BBCA");
      } else if (activeUpper === "VOO") {
        setCompareTicker("QQQ");
      } else if (activeUpper === "AAPL") {
        setCompareTicker("NVDA");
      } else {
        setCompareTicker("VOO");
      }
    }
  }, [stock.ticker, stock.exchange, compareTicker]);

  // Fetch both primary and secondary stock histories for the selected compareTimeframe
  useEffect(() => {
    let cancelled = false;
    const loadComparison = async () => {
      setIsLoadingCompare(true);
      try {
        const [resA, resB] = await Promise.all([
          fetch(
            `/api/stock?ticker=${encodeURIComponent(
              stock.yahooSymbol || stock.ticker
            )}&timeframe=${compareTimeframe}`
          ),
          fetch(
            `/api/stock?ticker=${encodeURIComponent(compareTicker)}&timeframe=${compareTimeframe}`
          ),
        ]);

        if (!cancelled) {
          if (resA.ok) {
            const jsonA = await resA.json();
            if (jsonA.success && jsonA.stock) {
              setPrimaryChartStock(jsonA.stock);
            }
          }
          if (resB.ok) {
            const jsonB = await resB.json();
            if (jsonB.success && jsonB.stock) {
              setSecondaryStock(jsonB.stock);
            }
          }
        }
      } catch {
        // Fallback to existing state
      } finally {
        if (!cancelled) setIsLoadingCompare(false);
      }
    };

    loadComparison();
    return () => {
      cancelled = true;
    };
  }, [stock.ticker, stock.yahooSymbol, compareTicker, compareTimeframe]);

  // Compute normalized % return series for both stocks
  const { seriesAData, seriesBData, returnAPct, returnBPct } = useMemo(() => {
    const rawA =
      primaryChartStock.history[compareTimeframe] ||
      primaryChartStock.history["1D"] ||
      [];
    const rawB =
      secondaryStock.history[compareTimeframe] ||
      secondaryStock.history["1D"] ||
      [];

    const buildNormalized = (pts: typeof rawA) => {
      const valid = pts.filter((p) => p && Number.isFinite(p.close) && p.close > 0);
      if (valid.length === 0) return { list: [], lastReturn: 0 };

      const base = valid[0].close;
      const mapSec = new Map<number, { time: UTCTimestamp; value: number }>();

      for (const p of valid) {
        const sec = Math.floor(p.timestamp / 1000) as UTCTimestamp;
        const pct = ((p.close - base) / base) * 100;
        mapSec.set(sec, { time: sec, value: Math.round(pct * 100) / 100 });
      }

      const sorted = Array.from(mapSec.values()).sort((a, b) => a.time - b.time);
      const lastRet = sorted.length > 0 ? sorted[sorted.length - 1].value : 0;
      return { list: sorted, lastReturn: lastRet };
    };

    const normA = buildNormalized(rawA);
    const normB = buildNormalized(rawB);

    return {
      seriesAData: normA.list,
      seriesBData: normB.list,
      returnAPct: normA.lastReturn,
      returnBPct: normB.lastReturn,
    };
  }, [primaryChartStock, secondaryStock, compareTimeframe]);

  // Render Head-to-Head Comparison Chart using lightweight-charts
  useEffect(() => {
    const container = compareChartContainerRef.current;
    if (!container) return;

    const isIntraday = compareTimeframe === "1D" || compareTimeframe === "1W";

    const chart = createChart(container, {
      width: container.clientWidth || 500,
      height: 230,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(248, 250, 252, 0.5)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)", style: 2 },
        horzLines: { color: "rgba(255, 255, 255, 0.04)", style: 2 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: isIntraday,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      localization: {
        locale: "id-ID",
        priceFormatter: (val: number) => `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`,
      },
    });

    const lineA = chart.addSeries(LineSeries, {
      color: "#F5B700",
      lineWidth: 2,
      title: stock.ticker,
    });

    const lineB = chart.addSeries(LineSeries, {
      color: "#06B6D4",
      lineWidth: 2,
      title: secondaryStock.ticker,
    });

    if (seriesAData.length > 0) {
      lineA.setData(seriesAData);
    }
    if (seriesBData.length > 0) {
      lineB.setData(seriesBData);
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({ width });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [seriesAData, seriesBData, stock.ticker, secondaryStock.ticker, compareTimeframe]);

  const handleCustomCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCompareInput.trim()) {
      setCompareTicker(customCompareInput.trim().toUpperCase());
      setCustomCompareInput("");
    }
  };

  // ---------------- SMART INVESTMENT & LOT CALCULATOR STATE ----------------
  const isIdxStock =
    stock.exchange === "IDX" ||
    stock.yahooSymbol.toUpperCase().endsWith(".JK") ||
    stock.currency === "IDR";

  const [calcMode, setCalcMode] = useState<"quantity" | "budget">("quantity");
  const [lotOrUnitCount, setLotOrUnitCount] = useState<number>(10);
  const [budgetAmount, setBudgetAmount] = useState<number>(10000000);
  const [targetGainPercent, setTargetGainPercent] = useState<number>(10);

  // Reset appropriate defaults when switching between IDX and Global stock
  useEffect(() => {
    if (isIdxStock) {
      setLotOrUnitCount(10); // 10 Lot = 1,000 Lembar
      setBudgetAmount(Math.max(5000000, Math.round(stock.price * 100 * 10)));
    } else {
      setLotOrUnitCount(stock.price > 1000 ? 0.5 : 10);
      setBudgetAmount(5000);
    }
  }, [stock.ticker, isIdxStock, stock.price]);

  const calcSummary = useMemo(() => {
    const unitPrice = stock.price || 0;
    const pricePerLot = isIdxStock ? unitPrice * 100 : unitPrice;
    const brokerFeeRate = isIdxStock ? 0.0015 : 0.001; // 0.15% IDX broker buy fee, 0.10% global

    let effectiveLotsOrUnits = lotOrUnitCount;
    let totalShares = isIdxStock ? lotOrUnitCount * 100 : lotOrUnitCount;

    if (calcMode === "budget") {
      if (isIdxStock && pricePerLot > 0) {
        // Must be integer lots on IDX (1 Lot = 100 Lembar)
        effectiveLotsOrUnits = Math.floor(
          budgetAmount / (pricePerLot * (1 + brokerFeeRate))
        );
        totalShares = effectiveLotsOrUnits * 100;
      } else if (unitPrice > 0) {
        effectiveLotsOrUnits =
          Math.round((budgetAmount / (unitPrice * (1 + brokerFeeRate))) * 10000) /
          10000;
        totalShares = effectiveLotsOrUnits;
      }
    }

    const grossPrincipal = totalShares * unitPrice;
    const brokerFee = grossPrincipal * brokerFeeRate;
    const netTotalCapital = grossPrincipal + brokerFee;
    const remainingCash =
      calcMode === "budget" ? Math.max(0, budgetAmount - netTotalCapital) : 0;

    const targetSellPrice = unitPrice * (1 + targetGainPercent / 100);
    const projectedGrossValue = totalShares * targetSellPrice;
    const projectedProfit = projectedGrossValue - netTotalCapital;

    // Parse dividend yield % if available
    const parsedDivPct = parseFloat(String(stock.dividendYield).replace("%", "")) || 0;
    const estimatedAnnualDividend = grossPrincipal * (parsedDivPct / 100);

    return {
      effectiveLotsOrUnits,
      totalShares,
      pricePerLot,
      grossPrincipal,
      brokerFee,
      netTotalCapital,
      remainingCash,
      targetSellPrice,
      projectedGrossValue,
      projectedProfit,
      parsedDivPct,
      estimatedAnnualDividend,
    };
  }, [
    stock.price,
    stock.dividendYield,
    isIdxStock,
    calcMode,
    lotOrUnitCount,
    budgetAmount,
    targetGainPercent,
  ]);

  const timeframes: TimeFrame[] = ["1D", "1W", "1M", "1Y", "ALL"];

  return (
    <section
      id="section-compare"
      className="w-full py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-white/[0.08] gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#F5B700] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#F5B700] inline-block shadow-gold" />
            03 / 04 — COMPARE & SIMULATOR
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Komparasi Kinerja Saham Head-to-Head & Kalkulator Lot Pintar
          </h3>
        </div>

        <div className="text-xs font-mono text-white/50 flex items-center gap-2">
          <span>
            Mode Kalkulator:{" "}
            <b className="text-[#F5B700]">
              {isIdxStock ? "BEI (1 Lot = 100 Lembar)" : "Global (Unit / Fractional)"}
            </b>
          </span>
        </div>
      </div>

      {/* Main Split Grid: Left = Head-to-Head Comparison, Right = Smart Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN (7 COLS): HEAD-TO-HEAD COMPARISON ================= */}
        <div className="lg:col-span-7 rounded-3xl p-5 sm:p-6 bg-[#0A192F]/80 border border-white/10 shadow-glass backdrop-blur-xl flex flex-col justify-between">
          <div>
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F5B700]/15 text-[#F5B700]">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    Bandingkan Saham (Head-to-Head Return %)
                  </h4>
                  <p className="text-xs text-white/50">
                    Perbandingan persentase imbal hasil pada satu grafik terpadu
                  </p>
                </div>
              </div>

              {/* Timeframe Selector for Comparison */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-navy-900/90 border border-white/[0.08]">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setCompareTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                      compareTimeframe === tf
                        ? "bg-[#F5B700] text-navy-950 shadow-gold"
                        : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Selector Presets & Custom Search Input */}
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-white/60">
                  Pilih Saham Pembanding vs <b className="text-[#F5B700]">{stock.ticker}</b>:
                </span>

                <form onSubmit={handleCustomCompareSubmit} className="flex items-center gap-1.5">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5" />
                    <input
                      type="text"
                      value={customCompareInput}
                      onChange={(e) => setCustomCompareInput(e.target.value)}
                      placeholder="Ketik ticker (mis: ANTM, QQQ)..."
                      className="pl-8 pr-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#06B6D4] w-44"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-[#06B6D4]/20 hover:bg-[#06B6D4] text-[#06B6D4] hover:text-navy-950 font-mono font-bold text-xs border border-[#06B6D4]/30 transition-colors"
                  >
                    Bandingkan
                  </button>
                </form>
              </div>

              {/* Preset Opponent Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {COMPARE_PRESETS.filter(
                  (p) => p.value.toUpperCase() !== stock.ticker.toUpperCase()
                ).map((preset) => {
                  const isSelected =
                    compareTicker.toUpperCase() === preset.value.toUpperCase() ||
                    secondaryStock.ticker.toUpperCase() === preset.value.toUpperCase();
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setCompareTicker(preset.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-[#06B6D4] text-navy-950 font-bold shadow-cyan"
                          : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                      }`}
                    >
                      vs {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend & Live Return Readout */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Stock A Card (Gold) */}
              <div className="p-3 rounded-2xl bg-[#F5B700]/[0.07] border border-[#F5B700]/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-[#F5B700] shrink-0 shadow-gold" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-white truncate">
                      {stock.ticker}{" "}
                      <span className="text-[10px] text-white/50">({stock.exchange})</span>
                    </div>
                    <div className="text-[11px] font-mono text-white/60">
                      {formatCurrency(stock.price, stock.currency, stock.currencySymbol)}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0">
                  <span className="text-[10px] text-white/40 block">Return ({compareTimeframe})</span>
                  <span
                    className={`text-sm font-black ${
                      returnAPct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {returnAPct >= 0 ? "+" : ""}
                    {returnAPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Stock B Card (Cyan) */}
              <div className="p-3 rounded-2xl bg-[#06B6D4]/[0.07] border border-[#06B6D4]/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-[#06B6D4] shrink-0 shadow-cyan" />
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                      <span>{secondaryStock.ticker}</span>
                      <span className="text-[10px] text-white/50">
                        ({secondaryStock.exchange})
                      </span>
                      {isLoadingCompare && (
                        <Loader2 className="w-3 h-3 text-[#06B6D4] animate-spin" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-white/60">
                      {formatCurrency(
                        secondaryStock.price,
                        secondaryStock.currency,
                        secondaryStock.currencySymbol
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0">
                  <span className="text-[10px] text-white/40 block">Return ({compareTimeframe})</span>
                  <span
                    className={`text-sm font-black ${
                      returnBPct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {returnBPct >= 0 ? "+" : ""}
                    {returnBPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Dual-Series Lightweight Chart */}
            <div className="relative w-full h-[230px] mt-4 pt-2 rounded-2xl bg-navy-950/60 border border-white/[0.06] px-2">
              <div ref={compareChartContainerRef} className="w-full h-full" />
            </div>

            {/* Head-to-Head Metrics Comparison Table */}
            <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="text-white/40">Metrik Komparasi</div>
              <div className="text-right text-[#F5B700] font-bold">{stock.ticker}</div>
              <div className="text-right text-[#06B6D4] font-bold">
                {secondaryStock.ticker}
              </div>

              <div className="text-white/60 py-1 border-t border-white/[0.04]">
                Perubahan Harian
              </div>
              <div
                className={`text-right py-1 border-t border-white/[0.04] font-semibold ${
                  stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {stock.changePercent >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </div>
              <div
                className={`text-right py-1 border-t border-white/[0.04] font-semibold ${
                  secondaryStock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {secondaryStock.changePercent >= 0 ? "+" : ""}
                {secondaryStock.changePercent.toFixed(2)}%
              </div>

              <div className="text-white/60 py-1 border-t border-white/[0.04]">
                52-Week High
              </div>
              <div className="text-right text-white/90 py-1 border-t border-white/[0.04]">
                {formatCurrency(stock.high52w, stock.currency, stock.currencySymbol)}
              </div>
              <div className="text-right text-white/90 py-1 border-t border-white/[0.04]">
                {formatCurrency(
                  secondaryStock.high52w,
                  secondaryStock.currency,
                  secondaryStock.currencySymbol
                )}
              </div>

              <div className="text-white/60 py-1 border-t border-white/[0.04]">
                Volume Transaksi
              </div>
              <div className="text-right text-white/80 py-1 border-t border-white/[0.04]">
                {stock.volumeDisplay}
              </div>
              <div className="text-right text-white/80 py-1 border-t border-white/[0.04]">
                {secondaryStock.volumeDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (5 COLS): SMART INVESTMENT & LOT CALCULATOR ================= */}
        <div className="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-[#0A192F]/80 border border-white/10 shadow-glass backdrop-blur-xl flex flex-col justify-between">
          <div>
            {/* Calculator Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    Kalkulator Investasi & Lot Pintar
                  </h4>
                  <p className="text-xs text-white/50">
                    {isIdxStock
                      ? "Standar Bursa Efek Indonesia (1 Lot = 100 Lembar)"
                      : "Pembelian Saham Global / ETF / Kripto per Unit"}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-[#F5B700] text-navy-950 shadow-gold">
                {isIdxStock ? "1 LOT = 100 LBR" : "PER LEMBAR / UNIT"}
              </span>
            </div>

            {/* Mode Switcher: Hitung Berdasarkan Lot/Unit vs Target Modal */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-navy-950/80 border border-white/[0.08] mt-4">
              <button
                type="button"
                onClick={() => setCalcMode("quantity")}
                className={`py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  calcMode === "quantity"
                    ? "bg-[#F5B700] text-navy-950 shadow-gold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Input Jumlah {isIdxStock ? "Lot" : "Lembar/Unit"}
              </button>
              <button
                type="button"
                onClick={() => setCalcMode("budget")}
                className={`py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  calcMode === "budget"
                    ? "bg-[#F5B700] text-navy-950 shadow-gold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Input Target Modal ({stock.currencySymbol})
              </button>
            </div>

            {/* Input Controls */}
            <div className="mt-4 space-y-4">
              {calcMode === "quantity" ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <label className="text-white/70 font-semibold">
                      Jumlah {isIdxStock ? "Lot (1 Lot = 100 Lembar)" : "Lembar / Unit"}:
                    </label>
                    <span className="text-[#F5B700] font-bold">
                      {isIdxStock
                        ? `${lotOrUnitCount.toLocaleString("id-ID")} Lot = ${(
                            lotOrUnitCount * 100
                          ).toLocaleString("id-ID")} Lembar`
                        : `${lotOrUnitCount} Unit`}
                    </span>
                  </div>

                  <input
                    type="number"
                    min={isIdxStock ? 1 : 0.01}
                    step={isIdxStock ? 1 : 0.1}
                    value={lotOrUnitCount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLotOrUnitCount(
                        Number.isFinite(val) && val >= 0
                          ? isIdxStock
                            ? Math.max(1, Math.round(val))
                            : val
                          : 0
                      );
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white font-mono font-bold text-lg focus:outline-none focus:border-[#F5B700]"
                  />

                  {/* Quick Lot/Unit Presets */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {(isIdxStock ? [1, 5, 10, 25, 50, 100, 500] : [1, 5, 10, 25, 50, 100]).map(
                      (q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setLotOrUnitCount(q)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                            lotOrUnitCount === q
                              ? "bg-[#F5B700]/20 border-[#F5B700] text-[#F5B700]"
                              : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white"
                          }`}
                        >
                          {q} {isIdxStock ? "Lot" : "Unit"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <label className="text-white/70 font-semibold">
                      Target Modal Tersedia ({stock.currency}):
                    </label>
                    <span className="text-[#F5B700] font-bold">
                      Dapat: {calcSummary.effectiveLotsOrUnits.toLocaleString("id-ID")}{" "}
                      {isIdxStock ? "Lot" : "Unit"}
                    </span>
                  </div>

                  <input
                    type="number"
                    min={0}
                    step={isIdxStock ? 500000 : 100}
                    value={budgetAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBudgetAmount(Number.isFinite(val) && val >= 0 ? val : 0);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white font-mono font-bold text-lg focus:outline-none focus:border-[#F5B700]"
                  />

                  {/* Quick Budget Presets */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {(isIdxStock
                      ? [
                          { label: "Rp 1 Jt", val: 1000000 },
                          { label: "Rp 5 Jt", val: 5000000 },
                          { label: "Rp 10 Jt", val: 10000000 },
                          { label: "Rp 50 Jt", val: 50000000 },
                          { label: "Rp 100 Jt", val: 100000000 },
                        ]
                      : [
                          { label: `${stock.currencySymbol}500`, val: 500 },
                          { label: `${stock.currencySymbol}1,000`, val: 1000 },
                          { label: `${stock.currencySymbol}5,000`, val: 5000 },
                          { label: `${stock.currencySymbol}10,000`, val: 10000 },
                        ]
                    ).map((b) => (
                      <button
                        key={b.val}
                        type="button"
                        onClick={() => setBudgetAmount(b.val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                          budgetAmount === b.val
                            ? "bg-[#F5B700]/20 border-[#F5B700] text-[#F5B700]"
                            : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Profit Simulator Slider / Presets */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-white/60">Simulasi Target Kenaikan Harga:</span>
                  <span className="text-emerald-400 font-bold">
                    +{targetGainPercent}% (Target:{" "}
                    {formatCurrency(
                      calcSummary.targetSellPrice,
                      stock.currency,
                      stock.currencySymbol
                    )}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 25, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTargetGainPercent(pct)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                        targetGainPercent === pct
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white"
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculation Breakdown Box */}
            <div className="mt-5 p-4 rounded-2xl bg-navy-950/90 border border-white/10 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-white/60">
                <span>Harga {stock.ticker} per Lembar/Unit:</span>
                <span className="text-white font-semibold">
                  {formatCurrency(stock.price, stock.currency, stock.currencySymbol)}
                </span>
              </div>

              {isIdxStock && (
                <div className="flex items-center justify-between text-white/60">
                  <span>Harga per 1 Lot (100 Lembar):</span>
                  <span className="text-[#F5B700] font-semibold">
                    {formatCurrency(calcSummary.pricePerLot, stock.currency, stock.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-white/60">
                <span>Total Volume Pembelian:</span>
                <span className="text-white font-semibold">
                  {isIdxStock
                    ? `${calcSummary.effectiveLotsOrUnits.toLocaleString("id-ID")} Lot (${calcSummary.totalShares.toLocaleString("id-ID")} Lbr)`
                    : `${calcSummary.totalShares.toLocaleString("en-US")} Unit`}
                </span>
              </div>

              <div className="flex items-center justify-between text-white/60">
                <span>Est. Biaya Sekuritas ({isIdxStock ? "0.15%" : "0.10%"}):</span>
                <span className="text-white/80">
                  {formatCurrency(calcSummary.brokerFee, stock.currency, stock.currencySymbol)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-white font-bold">Total Modal Dibutuhkan:</span>
                <span className="text-base sm:text-lg font-black text-[#F5B700]">
                  {formatCurrency(
                    calcSummary.netTotalCapital,
                    stock.currency,
                    stock.currencySymbol
                  )}
                </span>
              </div>

              {calcMode === "budget" && isIdxStock && calcSummary.remainingCash > 0 && (
                <div className="flex items-center justify-between text-[11px] text-cyan-400">
                  <span>Sisa Kas (di bawah 1 Lot):</span>
                  <span>
                    {formatCurrency(
                      calcSummary.remainingCash,
                      stock.currency,
                      stock.currencySymbol
                    )}
                  </span>
                </div>
              )}

              {/* Projected Profit & Dividend */}
              <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-300/70 block">
                    Est. Profit (+{targetGainPercent}%)
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400 block mt-0.5">
                    +
                    {formatCurrency(
                      calcSummary.projectedProfit,
                      stock.currency,
                      stock.currencySymbol
                    )}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-300/70 block">
                    Est. Dividen/Thn ({stock.dividendYield})
                  </span>
                  <span className="text-sm font-extrabold text-cyan-300 block mt-0.5">
                    {formatCurrency(
                      calcSummary.estimatedAnnualDividend,
                      stock.currency,
                      stock.currencySymbol
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
