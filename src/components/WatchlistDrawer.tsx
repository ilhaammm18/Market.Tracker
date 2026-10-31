"use client";

import React from "react";
import { X, Star, Trash2, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { MOCK_STOCKS } from "@/data/mockStocks";
import { formatCurrency } from "@/lib/utils";

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  onSelectStock: (ticker: string) => void;
  onRemoveFromWatchlist: (ticker: string) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  onSelectStock,
  onRemoveFromWatchlist,
}) => {
  if (!isOpen) return null;

  const watchedStocks = watchlist
    .map((ticker) => MOCK_STOCKS[ticker])
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0A192F] border-l border-white/10 shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#F5B700]/10 text-[#F5B700]">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Watchlist Pribadi</h3>
                <span className="text-xs text-white/50 font-mono">
                  {watchlist.length} Saham Tersimpan di LocalStorage
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of Watchlist Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {watchedStocks.length > 0 ? (
              watchedStocks.map((s) => {
                const isPositive = s.changePercent >= 0;

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all flex items-center justify-between group"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        onSelectStock(s.ticker);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white group-hover:text-[#F5B700] transition-colors">
                          {s.ticker}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                          {s.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 truncate max-w-[180px]">
                        {s.name}
                      </div>
                    </div>

                    <div className="text-right font-mono mr-3">
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(s.price, s.currency, s.currencySymbol)}
                      </div>
                      <div
                        className={`text-xs flex items-center justify-end gap-1 ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isPositive ? "+" : ""}{s.changePercent.toFixed(2)}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveFromWatchlist(s.ticker)}
                      className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus dari Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 text-white/40">
                <Star className="w-12 h-12 mx-auto mb-3 text-white/20" />
                <p className="text-sm text-white/60 font-medium">Watchlist Masih Kosong</p>
                <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
                  Klik ikon bintang pada saham mana pun untuk menyimpannya ke daftar pantau Anda.
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-[#061024] text-xs text-white/50 flex items-center justify-between">
            <span>Tersimpan secara lokal di browser</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#F5B700] text-navy-950 font-bold font-mono text-xs hover:bg-[#F5B700]/90 transition-colors"
            >
              Tutup Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

