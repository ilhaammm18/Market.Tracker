"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, TrendingUp } from "lucide-react";

export const Footer: React.FC = () => {
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).toUpperCase();
    setCurrentDateFormatted(formatted);
  }, []);

  return (
    <footer className="w-full mt-12 border-t border-white/[0.08] bg-[#040914] py-6 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        
        {/* Left: Real-time Date info */}
        <div className="flex items-center gap-2.5 text-white/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>
            DATA REAL-TIME PER{" "}
            <strong className="text-white/80 font-bold">
              {currentDateFormatted || "HARI INI"}
            </strong>
          </span>
        </div>

        {/* Center: System tag */}
        <div className="text-[11px] text-white/30 hidden md:block">
          GLOBAL STOCK INTELLIGENCE & TRACKER · FINTECH SUITE
        </div>

        {/* Right: Disclaimer */}
        <div className="flex items-center gap-2 text-rose-400/80 font-semibold tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>BUKAN AJAKAN MEMBELI / MENJUAL</span>
        </div>

      </div>
    </footer>
  );
};

