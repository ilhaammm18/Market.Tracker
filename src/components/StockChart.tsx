"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
  IChartApi,
} from "lightweight-charts";
import {
  TrendingUp,
  CandlestickChart as CandleIcon,
  Activity,
  BarChart3,
} from "lucide-react";
import { TimeFrame, StockPricePoint, ChartMode } from "@/types/stock";
import { formatCurrency, formatNumber, isIntegerCurrency } from "@/lib/utils";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  summarizeTechnicalMomentum,
} from "@/lib/indicators";

interface StockChartProps {
  history: Record<TimeFrame, StockPricePoint[]>;
  timeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
  currency: string;
  currencySymbol: string;
  isPositive?: boolean;
}

interface HoveredBarInfo {
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  ema50?: number;
}

export const StockChart: React.FC<StockChartProps> = ({
  history,
  timeframe,
  onTimeframeChange,
  currency,
  currencySymbol,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>("area");
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showEMA50, setShowEMA50] = useState<boolean>(false);
  const [hoveredBar, setHoveredBar] = useState<HoveredBarInfo | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);

  const data = useMemo(() => {
    return history[timeframe] || history["1D"] || [];
  }, [history, timeframe]);

  // Normalize and sort strictly ascending by UNIX seconds for lightweight-charts
  const normalizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const mapBySec = new Map<number, StockPricePoint & { sec: UTCTimestamp }>();

    for (const pt of data) {
      if (
        pt &&
        Number.isFinite(pt.timestamp) &&
        Number.isFinite(pt.close)
      ) {
        const sec = Math.floor(pt.timestamp / 1000) as UTCTimestamp;
        const open = Number.isFinite(pt.open) ? pt.open : pt.close;
        const high = Number.isFinite(pt.high)
          ? Math.max(pt.high, open, pt.close)
          : Math.max(open, pt.close);
        const low = Number.isFinite(pt.low)
          ? Math.min(pt.low, open, pt.close)
          : Math.min(open, pt.close);
        const volume =
          Number.isFinite(pt.volume) && pt.volume > 0 ? pt.volume : 0;

        mapBySec.set(sec, {
          ...pt,
          open,
          high,
          low,
          volume,
          sec,
        });
      }
    }

    return Array.from(mapBySec.values()).sort((a, b) => a.sec - b.sec);
  }, [data]);

  // Technical Indicators Calculation (SMA 20, EMA 50, RSI 14)
  const sma20Series = useMemo(
    () => calculateSMA(normalizedData, 20),
    [normalizedData]
  );
  const ema50Series = useMemo(
    () => calculateEMA(normalizedData, 50),
    [normalizedData]
  );
  const rsi14 = useMemo(
    () => calculateRSI(normalizedData, 14),
    [normalizedData]
  );
  const momentum = useMemo(
    () =>
      summarizeTechnicalMomentum(normalizedData, sma20Series, ema50Series),
    [normalizedData, sma20Series, ema50Series]
  );

  // Sample last 24 volume bars for compact visual bar strip in footer
  const recentVolumeBars = useMemo(() => {
    const slice = normalizedData.slice(-24);
    if (slice.length === 0) return [];
    const maxVol = Math.max(...slice.map((d) => d.volume), 1);
    return slice.map((d, idx) => {
      const prevClose = idx > 0 ? slice[idx - 1].close : d.open;
      const isUp = d.close >= prevClose;
      const heightPct = Math.max(15, Math.round((d.volume / maxVol) * 100));
      return {
        key: `${d.sec}-${idx}`,
        isUp,
        heightPct,
      };
    });
  }, [normalizedData]);

  // Accurate Min, Max, and Volatility calculation from active timeframe price array
  const { minPrice, maxPrice, volatilityText, volatilityColor } = useMemo(() => {
    if (normalizedData.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 0,
        volatilityText: "Rendah (0.0%)",
        volatilityColor: "text-[#06B6D4]",
      };
    }

    const lows = normalizedData.map((d) =>
      chartMode === "candlestick" ? d.low : d.close
    );
    const highs = normalizedData.map((d) =>
      chartMode === "candlestick" ? d.high : d.close
    );

    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const spreadPct = min > 0 ? ((max - min) / min) * 100 : 0;

    let label = "Rendah";
    let color = "text-emerald-400";
    if (spreadPct >= 15) {
      label = "Tinggi";
      color = "text-rose-400";
    } else if (spreadPct >= 6) {
      label = "Sedang";
      color = "text-[#F5B700]";
    } else if (spreadPct >= 2.2) {
      label = "Rendah-Sedang";
      color = "text-[#06B6D4]";
    }

    return {
      minPrice: min,
      maxPrice: max,
      volatilityText: `${label} (${spreadPct.toFixed(1)}%)`,
      volatilityColor: color,
    };
  }, [normalizedData, chartMode]);

  // Render & update lightweight-charts instance with SMA 20, EMA 50 & Volume overlays
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const isInt = isIntegerCurrency(currency);
    const isIntraday = timeframe === "1D" || timeframe === "1W";

    const chart = createChart(container, {
      width: container.clientWidth || 360,
      height: 195,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(248, 250, 252, 0.45)",
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
        vertLine: {
          color: "rgba(245, 183, 0, 0.65)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#F5B700",
        },
        horzLine: {
          color: "rgba(245, 183, 0, 0.65)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#0F264A",
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.18,
        },
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
        priceFormatter: (priceVal: number) => {
          if (isInt) {
            return Math.round(priceVal).toLocaleString("id-ID");
          }
          return priceVal.toFixed(2);
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartApiRef.current = chart;

    // Lookup maps by timestamp seconds for rich crosshair tooltip
    const pointBySec = new Map<number, StockPricePoint>();
    for (const pt of normalizedData) {
      pointBySec.set(pt.sec as number, pt);
    }

    const smaBySec = new Map<number, number>();
    for (const pt of sma20Series) {
      smaBySec.set(pt.time, pt.value);
    }

    const emaBySec = new Map<number, number>();
    for (const pt of ema50Series) {
      emaBySec.set(pt.time, pt.value);
    }

    // 1. Subtle Volume Histogram Overlay at bottom of chart
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    volumeSeries.setData(
      normalizedData.map((d, idx) => {
        const prevClose = idx > 0 ? normalizedData[idx - 1].close : d.open;
        const isUp = d.close >= prevClose;
        return {
          time: d.sec,
          value: d.volume,
          color: isUp
            ? "rgba(16, 185, 129, 0.22)"
            : "rgba(244, 63, 94, 0.22)",
        };
      })
    );

    // 2. Main Price Series (Area or Candlestick)
    if (chartMode === "area") {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: "#F5B700",
        topColor: "rgba(245, 183, 0, 0.36)",
        bottomColor: "rgba(245, 183, 0, 0.0)",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: "#040914",
        crosshairMarkerBackgroundColor: "#F5B700",
        priceFormat: {
          type: "price",
          precision: isInt ? 0 : 2,
          minMove: isInt ? 1 : 0.01,
        },
      });

      areaSeries.setData(
        normalizedData.map((d) => ({
          time: d.sec,
          value: d.close,
        }))
      );
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#10B981",
        downColor: "#F43F5E",
        borderUpColor: "#10B981",
        borderDownColor: "#F43F5E",
        wickUpColor: "#10B981",
        wickDownColor: "#F43F5E",
        priceFormat: {
          type: "price",
          precision: isInt ? 0 : 2,
          minMove: isInt ? 1 : 0.01,
        },
      });

      candleSeries.setData(
        normalizedData.map((d) => ({
          time: d.sec,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    }

    // 3. SMA 20 Overlay Line (Amber/Yellow)
    if (showSMA20 && sma20Series.length > 0) {
      const smaLine = chart.addSeries(LineSeries, {
        color: "#F59E0B",
        lineWidth: 2,
        lineStyle: chartMode === "area" ? 2 : 0, // Dashed on gold area for clear visual contrast, solid on candle
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
        priceFormat: {
          type: "price",
          precision: isInt ? 0 : 2,
          minMove: isInt ? 1 : 0.01,
        },
      });

      smaLine.setData(
        sma20Series.map((pt) => ({
          time: pt.time as UTCTimestamp,
          value: pt.value,
        }))
      );
    }

    // 4. EMA 50 Overlay Line (Cyan/Blue)
    if (showEMA50 && ema50Series.length > 0) {
      const emaLine = chart.addSeries(LineSeries, {
        color: "#06B6D4",
        lineWidth: 2,
        lineStyle: 0,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
        priceFormat: {
          type: "price",
          precision: isInt ? 0 : 2,
          minMove: isInt ? 1 : 0.01,
        },
      });

      emaLine.setData(
        ema50Series.map((pt) => ({
          time: pt.time as UTCTimestamp,
          value: pt.value,
        }))
      );
    }

    chart.timeScale().fitContent();

    // Crosshair hover handler
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.time ||
        param.point === undefined ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        setHoveredBar(null);
        return;
      }

      const secKey = Number(param.time);
      const matched = pointBySec.get(secKey);

      if (matched) {
        const d = new Date(matched.timestamp);
        const formattedTime = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: isIntraday ? "2-digit" : undefined,
          minute: isIntraday ? "2-digit" : undefined,
        });
        setHoveredBar({
          timeStr: formattedTime,
          open: matched.open,
          high: matched.high,
          low: matched.low,
          close: matched.close,
          volume: matched.volume,
          sma20: smaBySec.get(secKey),
          ema50: emaBySec.get(secKey),
        });
      }
    });

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
      setHoveredBar(null);
      chart.remove();
      chartApiRef.current = null;
    };
  }, [
    normalizedData,
    sma20Series,
    ema50Series,
    chartMode,
    showSMA20,
    showEMA50,
    currency,
    timeframe,
  ]);

  const timeframes: TimeFrame[] = ["1D", "1W", "1M", "1Y", "ALL"];

  const rsiBadgeClasses =
    rsi14.signal === "Overbought"
      ? "bg-rose-500/15 text-rose-400 border-rose-500/35"
      : rsi14.signal === "Oversold"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
      : "bg-cyan-500/10 text-cyan-300 border-cyan-500/25";

  return (
    <div className="w-full mt-4 flex flex-col">
      {/* Row 1: Timeframe Selector + Chart Mode Toggle (Area vs Candlestick) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        {/* Timeframe Selector Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-navy-900/90 border border-white/[0.08]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all duration-200 ${
                timeframe === tf
                  ? "bg-[#F5B700] text-navy-950 shadow-gold scale-[1.03]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Mode Toggle (Area vs Candlestick) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-navy-900/90 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setChartMode("area")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all duration-200 ${
              chartMode === "area"
                ? "bg-[#F5B700] text-navy-950 shadow-gold"
                : "text-white/60 hover:text-white hover:bg-white/[0.06]"
            }`}
            title="Mode Grafik Area Kuning Emas"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Area</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode("candlestick")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all duration-200 ${
              chartMode === "candlestick"
                ? "bg-emerald-500 text-navy-950 shadow-emerald"
                : "text-white/60 hover:text-white hover:bg-white/[0.06]"
            }`}
            title="Mode Grafik Candlestick OHLC"
          >
            <CandleIcon className="w-3.5 h-3.5" />
            <span>Candle</span>
          </button>
        </div>
      </div>

      {/* Row 2: Technical Indicators Toolbar (SMA 20 Toggle, EMA 50 Toggle & RSI 14 Badge) */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-white/[0.06]">
        {/* Overlay Indicator Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSMA20((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all duration-200 ${
              showSMA20
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm"
                : "bg-white/[0.03] text-white/45 border-white/[0.08] hover:text-white/80"
            }`}
            title="Toggle Overlay Simple Moving Average (20)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showSMA20 ? "bg-amber-400" : "bg-white/25"
              }`}
            />
            <span>SMA 20</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEMA50((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all duration-200 ${
              showEMA50
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm"
                : "bg-white/[0.03] text-white/45 border-white/[0.08] hover:text-white/80"
            }`}
            title="Toggle Overlay Exponential Moving Average (50)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showEMA50 ? "bg-cyan-400" : "bg-white/25"
              }`}
            />
            <span>EMA 50</span>
          </button>
        </div>

        {/* RSI (14) Live Indicator Badge */}
        <div
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 border ${rsiBadgeClasses}`}
          title="Relative Strength Index (14) — >70 Overbought, <30 Oversold"
        >
          <Activity className="w-3 h-3 shrink-0" />
          <span>RSI (14): {rsi14.value.toFixed(1)}</span>
          <span className="opacity-60">·</span>
          <span className="uppercase tracking-wider">{rsi14.signal}</span>
        </div>
      </div>

      {/* Interactive Crosshair Detail Readout */}
      <div className="min-h-[34px] flex items-center justify-between pt-2 text-[11px] font-mono">
        {hoveredBar ? (
          chartMode === "candlestick" ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <span className="text-white/60 text-[10px]">
                {hoveredBar.timeStr}
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-white/50">
                  O:{" "}
                  <b className="text-white">
                    {formatCurrency(hoveredBar.open, currency, currencySymbol)}
                  </b>
                </span>
                <span className="text-white/50">
                  H:{" "}
                  <b className="text-emerald-400">
                    {formatCurrency(hoveredBar.high, currency, currencySymbol)}
                  </b>
                </span>
                <span className="text-white/50">
                  L:{" "}
                  <b className="text-rose-400">
                    {formatCurrency(hoveredBar.low, currency, currencySymbol)}
                  </b>
                </span>
                <span className="text-white/50">
                  C:{" "}
                  <b className="text-[#F5B700]">
                    {formatCurrency(hoveredBar.close, currency, currencySymbol)}
                  </b>
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <span className="text-white/60 text-[10px]">
                {hoveredBar.timeStr}
              </span>
              <div className="flex items-center gap-2.5 text-[10px]">
                {showSMA20 && hoveredBar.sma20 !== undefined && (
                  <span className="text-amber-300">
                    SMA20:{" "}
                    <b>
                      {formatCurrency(hoveredBar.sma20, currency, currencySymbol)}
                    </b>
                  </span>
                )}
                {showEMA50 && hoveredBar.ema50 !== undefined && (
                  <span className="text-cyan-300">
                    EMA50:{" "}
                    <b>
                      {formatCurrency(hoveredBar.ema50, currency, currencySymbol)}
                    </b>
                  </span>
                )}
                <span className="text-xs font-bold text-[#F5B700]">
                  {formatCurrency(hoveredBar.close, currency, currencySymbol)}
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="w-full flex items-center justify-between text-[10px] text-white/45 px-1">
            <span className="flex items-center gap-2">
              {showSMA20 && (
                <span className="text-amber-300">
                  SMA20:{" "}
                  <b>
                    {formatCurrency(
                      momentum.latestSMA20,
                      currency,
                      currencySymbol
                    )}
                  </b>
                </span>
              )}
              {showEMA50 && (
                <span className="text-cyan-300">
                  EMA50:{" "}
                  <b>
                    {formatCurrency(
                      momentum.latestEMA50,
                      currency,
                      currencySymbol
                    )}
                  </b>
                </span>
              )}
              {!showSMA20 && !showEMA50 && (
                <span>
                  Mode:{" "}
                  <b className="text-white/70 uppercase">
                    {chartMode === "area" ? "Area Gold" : "OHLC Candlestick"}
                  </b>
                </span>
              )}
            </span>
            <span>Hover grafik untuk detail OHLC & indikator</span>
          </div>
        )}
      </div>

      {/* Lightweight-Charts Canvas Container */}
      <div className="relative w-full h-[195px] mt-1 select-none">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Volume Bars & Technical Momentum Summary Panel */}
      <div className="mt-2 pt-2.5 border-t border-white/[0.06] space-y-2">
        {/* Visual Volume Bar Strip + Momentum Signal */}
        <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
            <div className="text-[10px] font-mono">
              <span className="text-white/45 block leading-tight">
                Vol Rata-Rata ({timeframe})
              </span>
              <span className="text-white/85 font-bold">
                {formatNumber(momentum.avgVolume)}{" "}
                <span className="text-cyan-400">
                  ({momentum.volumeRatio}x)
                </span>
              </span>
            </div>
          </div>

          {/* Mini Volume Bars Visualization */}
          <div
            className="flex items-end gap-[2px] h-6 flex-1 max-w-[130px] px-1"
            title="Distribusi Volume Sesi Terakhir"
          >
            {recentVolumeBars.map((bar) => (
              <div
                key={bar.key}
                className={`flex-1 rounded-t-sm transition-all ${
                  bar.isUp ? "bg-emerald-400/70" : "bg-rose-400/70"
                }`}
                style={{ height: `${bar.heightPct}%` }}
              />
            ))}
          </div>

          {/* Technical Momentum Bias Badge */}
          <div className="text-right font-mono text-[10px] shrink-0">
            <span className="text-white/45 block leading-tight">
              Momentum MA
            </span>
            <span
              className={`font-bold ${
                momentum.trendBias === "Bullish"
                  ? "text-emerald-400"
                  : momentum.trendBias === "Bearish"
                  ? "text-rose-400"
                  : "text-[#F5B700]"
              }`}
            >
              {momentum.trendBias === "Bullish"
                ? "▲ BULLISH"
                : momentum.trendBias === "Bearish"
                ? "▼ BEARISH"
                : "◆ SIDEWAYS"}
            </span>
          </div>
        </div>

        {/* Accurate Chart Footer Details: Min, Volatility, Max */}
        <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
          <span>
            Min:{" "}
            <b className="text-white/80">
              {formatCurrency(minPrice, currency, currencySymbol)}
            </b>
          </span>
          <span className={volatilityColor}>
            Volatilitas ({timeframe}): <b>{volatilityText}</b>
          </span>
          <span>
            Maks:{" "}
            <b className="text-white/80">
              {formatCurrency(maxPrice, currency, currencySymbol)}
            </b>
          </span>
        </div>
      </div>
    </div>
  );
};
