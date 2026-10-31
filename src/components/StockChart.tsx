"use client";

import React, { useState, useMemo } from "react";
import { TimeFrame, StockPricePoint } from "@/types/stock";
import { formatCurrency } from "@/lib/utils";

interface StockChartProps {
  history: Record<TimeFrame, StockPricePoint[]>;
  timeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
  currency: string;
  currencySymbol: string;
  isPositive: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  history,
  timeframe,
  onTimeframeChange,
  currency,
  currencySymbol,
  isPositive,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    return history[timeframe] || history["1D"] || [];
  }, [history, timeframe]);

  const { points, minPrice, maxPrice, pathD, areaD } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], minPrice: 0, maxPrice: 0, pathD: "", areaD: "" };
    }

    const prices = data.map((d) => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || max * 0.05 || 1;
    const yMin = min - padding;
    const yMax = max + padding;

    const width = 500;
    const height = 180;

    const calculatedPoints = data.map((d, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - ((d.close - yMin) / (yMax - yMin)) * height;
      return { x, y, data: d };
    });

    // Create smooth bezier curve
    if (calculatedPoints.length < 2) {
      return { points: calculatedPoints, minPrice: min, maxPrice: max, pathD: "", areaD: "" };
    }

    let linePath = `M ${calculatedPoints[0].x} ${calculatedPoints[0].y}`;
    for (let i = 0; i < calculatedPoints.length - 1; i++) {
      const current = calculatedPoints[i];
      const next = calculatedPoints[i + 1];
      const controlX = (current.x + next.x) / 2;
      linePath += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    const lastPoint = calculatedPoints[calculatedPoints.length - 1];
    const firstPoint = calculatedPoints[0];
    const fillPath = `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

    return {
      points: calculatedPoints,
      minPrice: min,
      maxPrice: max,
      pathD: linePath,
      areaD: fillPath,
    };
  }, [data]);

  const activeHoverPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  const timeframes: TimeFrame[] = ["1D", "1W", "1M", "1Y", "ALL"];

  return (
    <div className="w-full mt-4 flex flex-col">
      {/* Timeframe Selector Buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-navy-900/90 border border-white/[0.08]">
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

        {/* Hovered Price / Tooltip Value */}
        <div className="text-right font-mono">
          {activeHoverPoint ? (
            <div>
              <div className="text-xs font-semibold text-[#F5B700]">
                {formatCurrency(activeHoverPoint.data.close, currency, currencySymbol)}
              </div>
              <div className="text-[10px] text-white/50">{activeHoverPoint.data.time}</div>
            </div>
          ) : (
            <div className="text-[11px] text-white/40">Hover titik untuk detail</div>
          )}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full h-[175px] mt-3 group select-none">
        <svg
          viewBox="0 0 500 180"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const relativeX = (mouseX / rect.width) * 500;
            const index = Math.round((relativeX / 500) * (points.length - 1));
            if (index >= 0 && index < points.length) {
              setHoverIndex(index);
            }
          }}
        >
          <defs>
            {/* Radiant Gold Gradient for Chart Area */}
            <linearGradient id="goldAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5B700" stopOpacity="0.38" />
              <stop offset="60%" stopColor="#F5B700" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#F5B700" stopOpacity="0.0" />
            </linearGradient>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="45" x2="500" y2="45" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <line x1="0" y1="135" x2="500" y2="135" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#goldAreaGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Glowing Stroke */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#F5B700"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#goldGlow)"
            />
          )}

          {/* Active Hover Crosshair Line */}
          {activeHoverPoint && (
            <>
              <line
                x1={activeHoverPoint.x}
                y1="0"
                x2={activeHoverPoint.x}
                y2="180"
                stroke="#F5B700"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              <circle
                cx={activeHoverPoint.x}
                cy={activeHoverPoint.y}
                r="5"
                fill="#F5B700"
                stroke="#040914"
                strokeWidth="2.5"
                className="animate-pulse"
              />
            </>
          )}

          {/* Latest Point Indicator */}
          {!activeHoverPoint && points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4.5"
              fill="#F5B700"
              stroke="#040914"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* Chart Footer details */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mt-1 pt-1">
        <span>Min: {formatCurrency(minPrice, currency, currencySymbol)}</span>
        <span className="text-[#06B6D4]">Volatilitas: Rendah-Sedang</span>
        <span>Maks: {formatCurrency(maxPrice, currency, currencySymbol)}</span>
      </div>
    </div>
  );
};

