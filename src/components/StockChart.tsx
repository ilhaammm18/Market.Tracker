"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
  IChartApi,
} from "lightweight-charts";
import { TrendingUp, CandlestickChart as CandleIcon } from "lucide-react";
import { TimeFrame, StockPricePoint, ChartMode } from "@/types/stock";
import { formatCurrency, isIntegerCurrency } from "@/lib/utils";

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
}

export const StockChart: React.FC<StockChartProps> = ({
  history,
  timeframe,
  onTimeframeChange,
  currency,
  currencySymbol,
  isPositive,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>("area");
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
        const high = Number.isFinite(pt.high) ? Math.max(pt.high, open, pt.close) : Math.max(open, pt.close);
        const low = Number.isFinite(pt.low) ? Math.min(pt.low, open, pt.close) : Math.min(open, pt.close);
        mapBySec.set(sec, {
          ...pt,
          open,
          high,
          low,
          sec,
        });
      }
    }

    return Array.from(mapBySec.values()).sort((a, b) => a.sec - b.sec);
  }, [data]);

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

    const lows = normalizedData.map((d) => (chartMode === "candlestick" ? d.low : d.close));
    const highs = normalizedData.map((d) => (chartMode === "candlestick" ? d.high : d.close));

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

  // Render & update lightweight-charts instance
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const isInt = isIntegerCurrency(currency);
    const isIntraday = timeframe === "1D" || timeframe === "1W";

    const chart = createChart(container, {
      width: container.clientWidth || 360,
      height: 185,
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
          top: 0.12,
          bottom: 0.08,
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

    // Lookup map by timestamp seconds for rich tooltip
    const pointBySec = new Map<number, StockPricePoint>();
    for (const pt of normalizedData) {
      pointBySec.set(pt.sec as number, pt);
    }

    let mainSeries: any;

    if (chartMode === "area") {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: "#F5B700",
        topColor: "rgba(245, 183, 0, 0.38)",
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

      mainSeries.setData(
        normalizedData.map((d) => ({
          time: d.sec,
          value: d.close,
        }))
      );
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
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

      mainSeries.setData(
        normalizedData.map((d) => ({
          time: d.sec,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
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
  }, [normalizedData, chartMode, currency, timeframe]);

  const timeframes: TimeFrame[] = ["1D", "1W", "1M", "1Y", "ALL"];

  return (
    <div className="w-full mt-4 flex flex-col">
      {/* Controls Row: Timeframe Selector + Chart Mode Toggle (Area vs Candlestick) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
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

      {/* Interactive Crosshair Detail Readout */}
      <div className="min-h-[34px] flex items-center justify-between pt-2 text-[11px] font-mono">
        {hoveredBar ? (
          chartMode === "candlestick" ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <span className="text-white/60 text-[10px]">{hoveredBar.timeStr}</span>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-white/50">
                  O: <b className="text-white">{formatCurrency(hoveredBar.open, currency, currencySymbol)}</b>
                </span>
                <span className="text-white/50">
                  H: <b className="text-emerald-400">{formatCurrency(hoveredBar.high, currency, currencySymbol)}</b>
                </span>
                <span className="text-white/50">
                  L: <b className="text-rose-400">{formatCurrency(hoveredBar.low, currency, currencySymbol)}</b>
                </span>
                <span className="text-white/50">
                  C: <b className="text-[#F5B700]">{formatCurrency(hoveredBar.close, currency, currencySymbol)}</b>
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <span className="text-white/60 text-[10px]">{hoveredBar.timeStr}</span>
              <span className="text-xs font-bold text-[#F5B700]">
                {formatCurrency(hoveredBar.close, currency, currencySymbol)}
              </span>
            </div>
          )
        ) : (
          <div className="w-full flex items-center justify-between text-[10px] text-white/40 px-1">
            <span>
              Mode: <b className="text-white/70 uppercase">{chartMode === "area" ? "Area Gold" : "OHLC Candlestick"}</b>
            </span>
            <span>Arahkan kursor pada grafik untuk detail OHLC & waktu</span>
          </div>
        )}
      </div>

      {/* Lightweight-Charts Canvas Container */}
      <div className="relative w-full h-[185px] mt-1 select-none">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Accurate Chart Footer Details: Min, Volatility, Max */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mt-2 pt-2 border-t border-white/[0.06]">
        <span>
          Min: <b className="text-white/80">{formatCurrency(minPrice, currency, currencySymbol)}</b>
        </span>
        <span className={volatilityColor}>
          Volatilitas ({timeframe}): <b>{volatilityText}</b>
        </span>
        <span>
          Maks: <b className="text-white/80">{formatCurrency(maxPrice, currency, currencySymbol)}</b>
        </span>
      </div>
    </div>
  );
};
