"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  Bell,
  BellRing,
  Plus,
  Target,
  CheckCircle2,
} from "lucide-react";
import { MOCK_STOCKS } from "@/data/mockStocks";
import {
  StockData,
  EvaluatedPriceAlert,
  PriceAlertCondition,
  PriceAlertItem,
} from "@/types/stock";
import { formatCurrency } from "@/lib/utils";
import {
  resolveStockForPortfolio,
  getCurrencySymbolByCode,
} from "@/lib/portfolio";

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  knownStocks?: Record<string, StockData>;
  onSelectStock: (ticker: string) => void;
  onRemoveFromWatchlist: (ticker: string) => void;
  alerts?: EvaluatedPriceAlert[];
  onAddAlert?: (alert: Omit<PriceAlertItem, "id" | "createdAt">) => void;
  onRemoveAlert?: (id: string) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  knownStocks = MOCK_STOCKS,
  onSelectStock,
  onRemoveFromWatchlist,
  alerts = [],
  onAddAlert,
  onRemoveAlert,
}) => {
  const [activeTab, setActiveTab] = useState<"watchlist" | "alerts">(
    "watchlist"
  );
  const [alertTicker, setAlertTicker] = useState<string>("BBCA");
  const [alertCondition, setAlertCondition] =
    useState<PriceAlertCondition>("target_buy");
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>("");

  if (!isOpen) return null;

  const watchedStocks = watchlist
    .map((ticker) => knownStocks[ticker] || MOCK_STOCKS[ticker])
    .filter(Boolean);

  const triggeredCount = alerts.filter((a) => a.isTriggered).length;

  const handleQuickAlertFromStock = (stock: StockData) => {
    setAlertTicker(stock.ticker);
    setAlertTargetPrice(String(stock.price));
    setActiveTab("alerts");
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAlert) return;

    const cleanTicker = alertTicker.trim().toUpperCase();
    const targetVal = parseFloat(alertTargetPrice);

    if (!cleanTicker || !Number.isFinite(targetVal) || targetVal <= 0) {
      return;
    }

    const matched = resolveStockForPortfolio(cleanTicker, knownStocks);
    const currency = (
      matched?.currency ||
      (cleanTicker.endsWith(".JK") ? "IDR" : "USD")
    ).toUpperCase();
    const currencySymbol =
      matched?.currencySymbol || getCurrencySymbolByCode(currency);

    onAddAlert({
      ticker: matched?.ticker || cleanTicker,
      name: matched?.name || cleanTicker,
      condition: alertCondition,
      targetPrice: targetVal,
      currency,
      currencySymbol,
    });

    setAlertTargetPrice("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex sm:pl-10 w-full sm:w-auto justify-end">
        <div className="w-full sm:w-screen sm:max-w-md bg-[#0A192F]/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
          {/* Drawer Header */}
          <div className="px-4 py-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#040914]/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/30 shrink-0">
                {activeTab === "alerts" ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <Star className="w-5 h-5 fill-current" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">
                  Watchlist & Smart Price Alerts
                </h3>
                <span className="text-[11px] sm:text-xs text-white/50 font-mono block truncate">
                  {watchlist.length} Saham · {alerts.length} Target Harga (
                  {triggeredCount} Tercapai)
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile-First Tab Switcher: Watchlist vs Smart Price Alerts */}
          <div className="px-4 pt-3 pb-2 border-b border-white/[0.06] bg-[#040914]/40">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#040914]/90 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("watchlist")}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "watchlist"
                    ? "bg-[#F5B700] text-navy-950 shadow-gold"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Watchlist ({watchlist.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("alerts")}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "alerts"
                    ? "bg-[#F5B700] text-navy-950 shadow-gold"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Price Alerts ({alerts.length})</span>
                {triggeredCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {triggeredCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-3">
            {activeTab === "watchlist" ? (
              watchedStocks.length > 0 ? (
                watchedStocks.map((s) => {
                  const isPositive = s.changePercent >= 0;
                  const stockTriggered = alerts.some(
                    (a) =>
                      a.ticker.toUpperCase() === s.ticker.toUpperCase() &&
                      a.isTriggered
                  );

                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all flex items-center justify-between gap-2 group"
                    >
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          onSelectStock(s.yahooSymbol || s.ticker);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-white group-hover:text-[#F5B700] transition-colors">
                            {s.ticker}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                            {s.exchange}
                          </span>
                          {stockTriggered && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              ALERT HIT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/50 truncate">
                          {s.name}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(
                            s.price,
                            s.currency,
                            s.currencySymbol
                          )}
                        </div>
                        <div
                          className={`text-xs flex items-center justify-end gap-1 ${
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
                            {s.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onAddAlert && (
                          <button
                            type="button"
                            onClick={() => handleQuickAlertFromStock(s)}
                            className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg text-white/40 hover:text-[#F5B700] hover:bg-[#F5B700]/10 flex items-center justify-center transition-colors"
                            title={`Pasang Target Harga untuk ${s.ticker}`}
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveFromWatchlist(s.ticker)}
                          className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                          title="Hapus dari Watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 px-4 text-white/40">
                  <Star className="w-12 h-12 mx-auto mb-3 text-white/20" />
                  <p className="text-sm text-white/60 font-medium">
                    Watchlist Masih Kosong
                  </p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
                    Klik ikon bintang pada saham mana pun untuk menyimpannya ke
                    daftar pantau Anda.
                  </p>
                </div>
              )
            ) : (
              /* Smart Price Alerts Tab Content */
              <div className="space-y-4">
                {/* Create New Price Alert Form */}
                {onAddAlert && (
                  <form
                    onSubmit={handleCreateAlert}
                    className="rounded-2xl p-3.5 bg-[#040914]/70 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#F5B700] uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        <span>Pasang Target Harga Baru</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <label className="text-[10px] font-mono text-white/50 block mb-1">
                          Kode Ticker
                        </label>
                        <input
                          type="text"
                          required
                          value={alertTicker}
                          onChange={(e) =>
                            setAlertTicker(e.target.value.toUpperCase())
                          }
                          placeholder="BBCA / NVDA / BTC"
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0A192F] border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white focus:outline-none"
                        />
                      </div>

                      <div className="col-span-6">
                        <label className="text-[10px] font-mono text-white/50 block mb-1">
                          Tipe Target
                        </label>
                        <select
                          value={alertCondition}
                          onChange={(e) =>
                            setAlertCondition(
                              e.target.value as PriceAlertCondition
                            )
                          }
                          className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#0A192F] border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="target_buy">Target Buy (≤)</option>
                          <option value="target_sell">Target Sell (≥)</option>
                        </select>
                      </div>

                      <div className="col-span-12">
                        <label className="text-[10px] font-mono text-white/50 block mb-1">
                          Harga Target (
                          {resolveStockForPortfolio(alertTicker, knownStocks)
                            ?.currency || "IDR / USD"}
                          )
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="any"
                            min="0.000001"
                            required
                            value={alertTargetPrice}
                            onChange={(e) =>
                              setAlertTargetPrice(e.target.value)
                            }
                            placeholder="Contoh: 9500 atau 140.00"
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0A192F] border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="min-h-[38px] px-3.5 rounded-xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-mono font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-gold transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Buat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* Active & Triggered Alerts List */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider px-0.5">
                    Daftar Smart Price Alerts ({alerts.length})
                  </div>

                  {alerts.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/40">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-white/20" />
                      <p className="text-xs font-semibold text-white/60">
                        Belum Ada Target Harga Aktif
                      </p>
                      <p className="text-[11px] text-white/40 mt-1">
                        Tambahkan Target Buy atau Target Sell di atas untuk
                        pemantauan otomatis.
                      </p>
                    </div>
                  ) : (
                    alerts.map((alert) => {
                      const isBuy = alert.condition === "target_buy";
                      return (
                        <div
                          key={alert.id}
                          className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                            alert.isTriggered
                              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
                              : "bg-white/[0.03] border-white/[0.08]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="min-w-0 cursor-pointer"
                              onClick={() => {
                                onSelectStock(alert.ticker);
                                onClose();
                              }}
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-sm text-white hover:text-[#F5B700]">
                                  {alert.ticker}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                                    isBuy
                                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                      : "bg-[#F5B700]/15 text-[#F5B700] border-[#F5B700]/30"
                                  }`}
                                >
                                  {isBuy ? "TARGET BUY ≤" : "TARGET SELL ≥"}
                                </span>
                                {alert.isTriggered && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500 text-navy-950 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    TERCAPAI
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-white/50 truncate mt-0.5">
                                {alert.name}
                              </p>
                            </div>

                            {onRemoveAlert && (
                              <button
                                type="button"
                                onClick={() => onRemoveAlert(alert.id)}
                                className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg text-white/35 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors shrink-0"
                                title="Hapus alert"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.07] font-mono text-[11px]">
                            <div>
                              <span className="text-[9px] text-white/40 block">
                                Target Harga
                              </span>
                              <span className="font-bold text-[#F5B700]">
                                {formatCurrency(
                                  alert.targetPrice,
                                  alert.currency,
                                  alert.currencySymbol
                                )}
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] text-white/40 block">
                                Harga Live
                              </span>
                              <span className="font-bold text-white">
                                {alert.currentPrice > 0
                                  ? formatCurrency(
                                      alert.currentPrice,
                                      alert.currency,
                                      alert.currencySymbol
                                    )
                                  : "N/A"}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] text-white/40 block">
                                Jarak Target
                              </span>
                              <span
                                className={`font-bold ${
                                  alert.isTriggered
                                    ? "text-emerald-400"
                                    : "text-white/75"
                                }`}
                              >
                                {alert.isTriggered
                                  ? "HIT!"
                                  : `${alert.distancePercent > 0 ? "+" : ""}${
                                      alert.distancePercent
                                    }%`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#061024] text-xs text-white/50 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[11px]">
              Tersimpan lokal di LocalStorage
            </span>
            <button
              onClick={onClose}
              className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#F5B700] text-navy-950 font-bold font-mono text-xs hover:bg-[#F5B700]/90 transition-colors shrink-0"
            >
              Tutup Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
