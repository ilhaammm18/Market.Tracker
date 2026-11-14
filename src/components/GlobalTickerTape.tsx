"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
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
        {/* Marquee Track starting directly with Ticker items e.g. BBCA (IDX) */}
        <div className="flex overflow-hidden whitespace-nowrap group w-full">
          <div className="flex items-center gap-3 sm:gap-5 animate-ticker group-hover:[animation-play-state:paused] px-3">
            {displayItems.map((item, idx) => {
              const isPositive = item.change >= 0;
              const isActive =
                item.ticker.toUpperCase() === activeTicker.toUpperCase() ||
                item.yahooSymbol?.toUpperCase() === activeTicker.toUpperCase();

              return (
                <button
                  key={`${item.ticker}-${idx}`}
                  onClick={() => onSelectStock(item.yahooSymbol || item.ticker)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#F5B700]/20 border border-[#F5B700] text-white shadow-gold"
                      : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#F5B700]/40 text-white/90"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive
                        ? "bg-[#F5B700]"
                        : isPositive
                        ? "bg-emerald-400"
                        : "bg-rose-400"
                    }`}
                  />

                  {/* Ticker & Exchange e.g. BBCA (IDX) */}
                  <span className={`font-bold ${isActive ? "text-[#F5B700]" : "text-white"}`}>
                    {item.ticker} ({item.exchange})
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
