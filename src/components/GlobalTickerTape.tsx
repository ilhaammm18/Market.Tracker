"use client";

import React from "react";
import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { TickerTapeItem } from "@/types/stock";

interface GlobalTickerTapeProps {
  tapeItems: TickerTapeItem[];
  onSelectStock: (ticker: string) => void;
  activeTicker: string;
}

export const GlobalTickerTape: React.FC<GlobalTickerTapeProps> = ({
  tapeItems,
  onSelectStock,
  activeTicker,
}) => {
  // Duplicate list to achieve smooth infinite CSS marquee loop
  const displayItems = [...tapeItems, ...tapeItems];

  return (
    <div className="w-full bg-[#061024]/95 border-y border-white/[0.08] overflow-hidden py-2 backdrop-blur-md select-none">
      <div className="flex items-center">
        {/* Left Pulse Pill Indicator */}
        <div className="px-3.5 py-1 mr-1 border-r border-white/10 flex items-center gap-2 text-[11px] font-mono font-bold text-[#F5B700] shrink-0 z-10 bg-[#061024]">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span className="hidden md:inline uppercase tracking-wider text-white/80">BURSA</span>
        </div>

        {/* Marquee Track */}
        <div className="flex overflow-hidden whitespace-nowrap group">
          <div className="flex items-center gap-4 sm:gap-6 animate-ticker group-hover:[animation-play-state:paused] px-2">
            {displayItems.map((item, idx) => {
              const isPositive = item.change >= 0;
              const isActive = item.ticker === activeTicker;

              return (
                <button
                  key={`${item.ticker}-${idx}`}
                  onClick={() => onSelectStock(item.ticker)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#F5B700]/20 border border-[#F5B700] text-white shadow-gold"
                      : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#F5B700]/40 text-white/90"
                  }`}
                >
                  {/* Ticker & Exchange e.g. BBCA (IDX) */}
                  <span className={`font-bold ${isActive ? "text-[#F5B700]" : "text-white"}`}>
                    {item.ticker}
                  </span>
                  <span className="text-[10px] text-white/50">
                    ({item.exchange})
                  </span>

                  {/* Synchronized Exact Real Price */}
                  <span className="font-semibold text-white/95 ml-0.5">
                    {item.priceFormatted}
                  </span>

                  {/* Percentage Change */}
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
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
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
