"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  PieChart,
  Edit3,
  RotateCcw,
  ArrowUpRight,
  Coins,
  Check,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import {
  PortfolioItem,
  PortfolioCurrency,
  PortfolioImportMode,
  StockData,
} from "@/types/stock";
import {
  calculatePortfolioSummary,
  FX_RATES_TO_IDR,
  resolveStockForPortfolio,
  DEFAULT_PORTFOLIO_ITEMS,
  PortfolioFilterCategory,
  filterAndSummarizeByCategory,
  matchesPortfolioCategory,
  triggerPortfolioDownload,
  parsePortfolioImportJSON,
  applyPortfolioImport,
} from "@/lib/portfolio";
import { PortfolioAllocationPanel } from "@/components/PortfolioAllocationPanel";
import { formatCurrency } from "@/lib/utils";

interface PortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioItem[];
  knownStocks: Record<string, StockData>;
  onUpdatePortfolio: (nextItems: PortfolioItem[]) => void;
  onSelectStock?: (ticker: string) => void;
}

export const PortfolioDrawer: React.FC<PortfolioDrawerProps> = ({
  isOpen,
  onClose,
  portfolio,
  knownStocks,
  onUpdatePortfolio,
  onSelectStock,
}) => {
  const [tickerInput, setTickerInput] = useState<string>("");
  const [quantityInput, setQuantityInput] = useState<string>("");
  const [avgPriceInput, setAvgPriceInput] = useState<string>("");
  const [currencyInput, setCurrencyInput] =
    useState<PortfolioCurrency>("IDR");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<PortfolioFilterCategory>("ALL");
  const [importMode, setImportMode] = useState<PortfolioImportMode>("merge");
  const [ioFeedback, setIoFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const summary = useMemo(
    () => calculatePortfolioSummary(portfolio, knownStocks),
    [portfolio, knownStocks]
  );

  const categorySubtotal = useMemo(
    () => filterAndSummarizeByCategory(summary.allocation, activeCategory),
    [summary.allocation, activeCategory]
  );

  const categoryTabs: { id: PortfolioFilterCategory; label: string }[] = [
    { id: "ALL", label: "ALL" },
    { id: "IDX", label: "IDX" },
    { id: "GLOBAL", label: "US / Global" },
    { id: "CRYPTO", label: "CRYPTO" },
  ];

  const isTotalPositive = summary.totalPnLIDR >= 0;

  // Auto-fill currency and suggested buy price when user types a known ticker
  const handleTickerChange = (val: string) => {
    const upper = val.toUpperCase();
    setTickerInput(upper);

    if (!editingId && upper.trim().length >= 2) {
      const matched = resolveStockForPortfolio(upper, knownStocks);
      if (matched) {
        const curr = matched.currency.toUpperCase();
        if (
          curr === "IDR" ||
          curr === "USD" ||
          curr === "KRW" ||
          curr === "AUD"
        ) {
          setCurrencyInput(curr as PortfolioCurrency);
        }
        if (!avgPriceInput) {
          setAvgPriceInput(String(matched.price));
        }
      } else if (upper.endsWith(".JK")) {
        setCurrencyInput("IDR");
      }
    }
  };

  const resetForm = () => {
    setTickerInput("");
    setQuantityInput("");
    setAvgPriceInput("");
    setCurrencyInput("IDR");
    setEditingId(null);
  };

  const handleSubmitPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTicker = tickerInput.trim().toUpperCase();
    const qty = parseFloat(quantityInput);
    const avgPrice = parseFloat(avgPriceInput);

    if (!rawTicker || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(avgPrice) || avgPrice <= 0) {
      return;
    }

    const matched = resolveStockForPortfolio(rawTicker, knownStocks);
    const inferredExchange =
      matched?.exchange ||
      (rawTicker.endsWith(".JK") || currencyInput === "IDR"
        ? "IDX"
        : rawTicker.endsWith("-USD")
        ? "CRYPTO"
        : currencyInput === "KRW"
        ? "KRX"
        : currencyInput === "AUD"
        ? "ASX"
        : "NASDAQ");

    const inferredName = matched?.name || `${rawTicker} (${inferredExchange})`;

    if (editingId) {
      // Update existing position by ID
      const next = portfolio.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ticker: rawTicker,
              name: inferredName,
              exchange: inferredExchange,
              quantity: qty,
              avgBuyPrice: avgPrice,
              currency: currencyInput,
              assetType: inferredExchange,
            }
          : item
      );
      onUpdatePortfolio(next);
      resetForm();
      return;
    }

    // Check if ticker already exists in portfolio — if so, compute weighted average buy price
    const existingIndex = portfolio.findIndex(
      (item) => item.ticker.toUpperCase() === rawTicker
    );

    if (existingIndex >= 0) {
      const existing = portfolio[existingIndex];
      const totalQty = existing.quantity + qty;
      const weightedAvg =
        (existing.quantity * existing.avgBuyPrice + qty * avgPrice) / totalQty;

      const next = [...portfolio];
      next[existingIndex] = {
        ...existing,
        quantity: Number(totalQty.toFixed(6)),
        avgBuyPrice: Number(weightedAvg.toFixed(4)),
        currency: currencyInput,
      };
      onUpdatePortfolio(next);
    } else {
      const newItem: PortfolioItem = {
        id: `pos-${Date.now()}`,
        ticker: rawTicker,
        name: inferredName,
        exchange: inferredExchange,
        quantity: qty,
        avgBuyPrice: avgPrice,
        currency: currencyInput,
        assetType: inferredExchange,
      };
      onUpdatePortfolio([newItem, ...portfolio]);
    }

    resetForm();
  };

  const handleStartEdit = (itemId: string) => {
    const target = portfolio.find((p) => p.id === itemId);
    if (!target) return;
    setEditingId(target.id);
    setTickerInput(target.ticker);
    setQuantityInput(String(target.quantity));
    setAvgPriceInput(String(target.avgBuyPrice));
    setCurrencyInput(
      (target.currency as PortfolioCurrency) || "IDR"
    );
  };

  const handleRemovePosition = (id: string) => {
    const next = portfolio.filter((item) => item.id !== id);
    onUpdatePortfolio(next);
    if (editingId === id) {
      resetForm();
    }
  };

  const handleResetDemo = () => {
    onUpdatePortfolio(DEFAULT_PORTFOLIO_ITEMS);
    resetForm();
  };

  const showTemporaryFeedback = (
    type: "success" | "error",
    message: string
  ) => {
    setIoFeedback({ type, message });
    setTimeout(() => {
      setIoFeedback(null);
    }, 3800);
  };

  const handleExport = (format: "json" | "csv") => {
    const ok = triggerPortfolioDownload(format, summary, portfolio);
    if (ok) {
      showTemporaryFeedback(
        "success",
        format === "json"
          ? "✓ File JSON berhasil diunduh"
          : "✓ File CSV berhasil diunduh"
      );
    } else {
      showTemporaryFeedback("error", "✗ Gagal mengunduh file portofolio.");
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so selecting the same file again still triggers onChange
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      showTemporaryFeedback(
        "error",
        "✗ File harus berformat .json (backup portofolio)."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const parsed = parsePortfolioImportJSON(content);

      if (!parsed.success) {
        showTemporaryFeedback(
          "error",
          `✗ ${parsed.error || "Format file JSON tidak valid."}`
        );
        return;
      }

      const nextPortfolio = applyPortfolioImport(
        portfolio,
        parsed.items,
        importMode
      );
      onUpdatePortfolio(nextPortfolio);
      resetForm();
      showTemporaryFeedback(
        "success",
        `✓ Berhasil mengimpor ${parsed.importedCount} aset (Mode ${
          importMode === "replace" ? "Replace" : "Merge"
        })`
      );
    };
    reader.onerror = () => {
      showTemporaryFeedback("error", "✗ Gagal membaca file yang dipilih.");
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel (Full-width on mobile, max-w-lg on tablet/desktop) */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-lg bg-[#071326]/95 border-l border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* 1. Drawer Header */}
            <div className="px-4 py-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#040914]/60">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/30 shadow-gold shrink-0">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                      Multi-Asset Portfolio & PnL
                    </h3>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      AUTO-IDR FX
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-white/50 font-mono truncate">
                    {portfolio.length} posisi aktif · Valuasi Real-Time Lintas
                    Mata Uang
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="min-h-[38px] min-w-[38px] p-2 rounded-xl text-white/40 hover:text-[#F5B700] hover:bg-white/10 flex items-center justify-center transition-colors"
                  title="Reset ke 3 Aset Seed Default (BBCA.JK, NVDA, BTC-USD)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[38px] min-w-[38px] p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              {/* A. Portfolio Valuation & Floating PnL Summary Card (IDR) */}
              <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#0A192F] via-[#0F264A]/90 to-[#0A192F] border border-[#F5B700]/30 shadow-glass relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-1">
                  <span className="uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#F5B700]" />
                    TOTAL PORTFOLIO EQUITY (IDR)
                  </span>
                  <span className="text-[10px] text-cyan-300">
                    1 USD ≈ Rp {FX_RATES_TO_IDR.USD.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight my-1">
                  {formatCurrency(summary.totalEquityIDR, "IDR", "Rp")}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-white/10">
                  <div>
                    <span className="text-[10px] font-mono text-white/45 block">
                      Modal Beli Gabungan (Cost Basis)
                    </span>
                    <span className="text-xs font-mono font-bold text-white/80">
                      {formatCurrency(summary.totalCostIDR, "IDR", "Rp")}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-white/45 block">
                      Total Floating PnL
                    </span>
                    <div
                      className={`inline-flex items-center gap-1.5 font-mono text-xs font-extrabold ${
                        isTotalPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isTotalPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isTotalPositive ? "+" : ""}
                        {formatCurrency(summary.totalPnLIDR, "IDR", "Rp")} (
                        {isTotalPositive ? "+" : ""}
                        {summary.totalPnLPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multi-Asset Allocation Progress Bar */}
                {summary.allocation.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/60">
                      <span className="flex items-center gap-1">
                        <PieChart className="w-3 h-3 text-[#F5B700]" />
                        ALOKASI ASET PORTOFOLIO
                      </span>
                      <span>100% EQUIVALENT IDR</span>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-navy-950 overflow-hidden flex gap-[2px] p-[1px] border border-white/10">
                      {summary.allocation.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            width: `${Math.max(item.weightPercent, 3)}%`,
                            backgroundColor: item.color,
                          }}
                          className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                          title={`${item.ticker}: ${item.weightPercent.toFixed(
                            1
                          )}%`}
                        />
                      ))}
                    </div>

                    {/* Allocation Legend Chips */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                      {summary.allocation.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-1.5 text-[10px] font-mono text-white/75"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-bold text-white">
                            {item.ticker}
                          </span>
                          <span className="text-white/50">
                            {item.weightPercent.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* A2. Risk Allocation & Rebalancing Analytics Panel */}
              <PortfolioAllocationPanel summary={summary} />

              {/* B. Form Tambah / Edit Posisi Aset */}
              <form
                onSubmit={handleSubmitPosition}
                className="rounded-2xl p-4 bg-[#0A192F]/80 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F5B700] uppercase tracking-wider flex items-center gap-1.5">
                    {editingId ? (
                      <>
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Posisi Aset</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah / Average Posisi Aset</span>
                      </>
                    )}
                  </span>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] font-mono text-white/50 hover:text-white underline"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-2.5">
                  {/* Ticker Symbol Input */}
                  <div className="col-span-12 sm:col-span-7">
                    <label className="text-[10px] font-mono text-white/50 block mb-1">
                      Kode Ticker (mis. BBCA.JK, NVDA, BTC-USD)
                    </label>
                    <input
                      type="text"
                      required
                      value={tickerInput}
                      onChange={(e) => handleTickerChange(e.target.value)}
                      placeholder="BBCA.JK / AAPL / BTC-USD"
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#040914]/90 border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white placeholder-white/30 focus:outline-none"
                    />
                  </div>

                  {/* Currency Select */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[10px] font-mono text-white/50 block mb-1">
                      Mata Uang
                    </label>
                    <select
                      value={currencyInput}
                      onChange={(e) =>
                        setCurrencyInput(e.target.value as PortfolioCurrency)
                      }
                      className="w-full min-h-[40px] px-2.5 py-2 rounded-xl bg-[#040914]/90 border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white focus:outline-none"
                    >
                      <option value="IDR">IDR (Rp)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="KRW">KRW (₩)</option>
                    </select>
                  </div>

                  {/* Quantity (Lembar / Unit) */}
                  <div className="col-span-6">
                    <label className="text-[10px] font-mono text-white/50 block mb-1">
                      Jumlah Lembar / Unit
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.000001"
                      required
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      placeholder={
                        currencyInput === "IDR" ? "1000 (10 Lot)" : "10"
                      }
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#040914]/90 border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white placeholder-white/30 focus:outline-none"
                    />
                  </div>

                  {/* Average Buy Price */}
                  <div className="col-span-6">
                    <label className="text-[10px] font-mono text-white/50 block mb-1">
                      Harga Beli Rata-Rata ({currencyInput})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.000001"
                      required
                      value={avgPriceInput}
                      onChange={(e) => setAvgPriceInput(e.target.value)}
                      placeholder={
                        currencyInput === "IDR" ? "9750" : "135.50"
                      }
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#040914]/90 border border-white/10 focus:border-[#F5B700] text-xs font-mono text-white placeholder-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[42px] py-2.5 rounded-xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-mono font-extrabold text-xs tracking-wide shadow-gold flex items-center justify-center gap-1.5 transition-all"
                >
                  {editingId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan Posisi</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Tambah ke Portofolio</span>
                    </>
                  )}
                </button>
              </form>

              {/* C. Daftar Aset yang Dimiliki + Filter Kategori Aset */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider">
                    Daftar Kepemilikan Aset ({categorySubtotal.count})
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    Klik ticker untuk analisis grafik
                  </span>
                </div>

                {/* Asset Category Filter Tabs (ALL, IDX, US / Global, CRYPTO) */}
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#040914]/90 border border-white/10">
                  {categoryTabs.map((tab) => {
                    const countInTab =
                      tab.id === "ALL"
                        ? summary.allocation.length
                        : summary.allocation.filter((item) =>
                            matchesPortfolioCategory(item, tab.id)
                          ).length;
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategory(tab.id)}
                        className={`px-2 py-1.5 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          isActive
                            ? "bg-[#F5B700] text-navy-950 shadow-gold"
                            : "text-white/55 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        <span
                          className={`px-1 rounded text-[9px] ${
                            isActive
                              ? "bg-navy-950/20 text-navy-950"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {countInTab}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Category Subtotal Banner (When filtered to IDX, US / Global, or CRYPTO) */}
                {activeCategory !== "ALL" && categorySubtotal.count > 0 && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-white/45 block">
                        Subtotal Kategori ({activeCategory})
                      </span>
                      <span className="font-bold text-white">
                        {formatCurrency(
                          categorySubtotal.subtotalEquityIDR,
                          "IDR",
                          "Rp"
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/45 block">
                        Subtotal PnL
                      </span>
                      <span
                        className={`font-bold ${
                          categorySubtotal.subtotalPnLIDR >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {categorySubtotal.subtotalPnLIDR >= 0 ? "+" : ""}
                        {formatCurrency(
                          categorySubtotal.subtotalPnLIDR,
                          "IDR",
                          "Rp"
                        )}{" "}
                        ({categorySubtotal.subtotalPnLIDR >= 0 ? "+" : ""}
                        {categorySubtotal.subtotalPnLPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}

                {categorySubtotal.items.length === 0 ? (
                  <div className="rounded-2xl p-8 bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
                    <Briefcase className="w-8 h-8 text-white/20 mx-auto" />
                    <p className="text-sm font-semibold text-white/60">
                      {activeCategory === "ALL"
                        ? "Portofolio Masih Kosong"
                        : `Tidak Ada Aset di Kategori ${activeCategory}`}
                    </p>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">
                      {activeCategory === "ALL"
                        ? "Tambahkan aset di form atas atau klik tombol reset untuk memuat 3 aset contoh (BBCA.JK, NVDA, BTC-USD)."
                        : "Pilih tab kategori lain atau tambahkan posisi aset baru melalui form di atas."}
                    </p>
                  </div>
                ) : (
                  categorySubtotal.items.map((item) => {
                    const isProfit = item.pnlIDR >= 0;
                    const isIdxLot =
                      item.currency === "IDR" ||
                      item.ticker.endsWith(".JK") ||
                      item.exchange === "IDX";
                    const lotText = isIdxLot
                      ? ` (${(item.quantity / 100).toLocaleString("id-ID", {
                          maximumFractionDigits: 2,
                        })} Lot)`
                      : "";

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-[#0A192F]/85 border border-white/[0.08] hover:border-[#F5B700]/35 transition-all group space-y-2.5"
                      >
                        {/* Top Row: Asset Identity & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSelectStock) {
                                      onSelectStock(item.ticker);
                                      onClose();
                                    }
                                  }}
                                  className="font-mono font-black text-sm text-white hover:text-[#F5B700] flex items-center gap-1 transition-colors"
                                >
                                  <span>{item.ticker}</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-[#F5B700]" />
                                </button>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/10">
                                  {item.exchange}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5B700]/15 text-[#F5B700]">
                                  {item.weightPercent.toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-xs text-white/50 truncate">
                                {item.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item.id)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                              title="Edit posisi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePosition(item.id)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Hapus aset dari portofolio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Middle Grid: Quantity, Avg Buy, Current Market Price */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
                          <div>
                            <span className="text-[10px] text-white/40 block">
                              Jumlah Unit
                            </span>
                            <span className="text-white/90 font-semibold">
                              {item.quantity.toLocaleString("id-ID")}
                              <span className="text-[#F5B700] text-[10px]">
                                {lotText}
                              </span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-white/40 block">
                              Avg Buy Price
                            </span>
                            <span className="text-white/80 font-semibold">
                              {formatCurrency(
                                item.avgBuyPrice,
                                item.currency,
                                item.currencySymbol
                              )}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-white/40 block">
                              Harga Terkini
                            </span>
                            <span className="text-cyan-300 font-bold">
                              {formatCurrency(
                                item.currentPrice,
                                item.currency,
                                item.currencySymbol
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Row: Market Value (IDR) & Floating PnL Badge */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-white/40 block">
                              Nilai Aset (Equiv. IDR)
                            </span>
                            <span className="font-bold text-white">
                              {formatCurrency(
                                item.marketValueIDR,
                                "IDR",
                                "Rp"
                              )}
                            </span>
                            {item.currency !== "IDR" && (
                              <span className="text-[10px] text-white/45 ml-1.5">
                                (
                                {formatCurrency(
                                  item.marketValueOriginal,
                                  item.currency,
                                  item.currencySymbol
                                )}
                                )
                              </span>
                            )}
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-xl border text-right ${
                              isProfit
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            <div className="font-bold flex items-center justify-end gap-1">
                              {isProfit ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>
                                {isProfit ? "+" : ""}
                                {item.pnlPercent.toFixed(2)}%
                              </span>
                            </div>
                            <div className="text-[10px] opacity-90">
                              {isProfit ? "+" : ""}
                              {formatCurrency(item.pnlIDR, "IDR", "Rp")}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Drawer Footer with Backup Export (JSON/CSV) & Restore Import (JSON Replace/Merge) */}
            <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#040914]/95 space-y-2.5">
              {/* Row 1: Export Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-white/55 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-[#F5B700]" />
                  <span>Ekspor:</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={portfolio.length === 0}
                    onClick={() => handleExport("json")}
                    className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#F5B700]/20 disabled:opacity-40 border border-white/10 hover:border-[#F5B700]/40 text-[11px] font-mono font-bold text-white hover:text-[#F5B700] flex items-center gap-1.5 transition-all"
                    title="Unduh backup portofolio dalam format JSON"
                  >
                    <FileJson className="w-3.5 h-3.5 text-[#F5B700]" />
                    <span>Export JSON</span>
                  </button>

                  <button
                    type="button"
                    disabled={portfolio.length === 0}
                    onClick={() => handleExport("csv")}
                    className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/20 disabled:opacity-40 border border-white/10 hover:border-cyan-500/40 text-[11px] font-mono font-bold text-white hover:text-cyan-300 flex items-center gap-1.5 transition-all"
                    title="Unduh laporan portofolio dalam format CSV (Excel/Sheets)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Import / Restore JSON with Replace or Merge Mode */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-white/55 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restore:</span>
                  </span>
                  <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/10">
                    <button
                      type="button"
                      onClick={() => setImportMode("merge")}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        importMode === "merge"
                          ? "bg-emerald-500 text-navy-950"
                          : "text-white/55 hover:text-white"
                      }`}
                      title="Gabungkan data impor dengan posisi yang sudah ada"
                    >
                      Merge
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode("replace")}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        importMode === "replace"
                          ? "bg-rose-500 text-white"
                          : "text-white/55 hover:text-white"
                      }`}
                      title="Timpa seluruh portofolio saat ini dengan isi file backup"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[34px] px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 transition-all"
                    title="Unggah file backup portofolio (.json)"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Feedback Status / Version Info */}
              <div className="text-[11px] font-mono text-white/40 flex items-center justify-between gap-2">
                {ioFeedback ? (
                  <span
                    className={`font-bold flex items-center gap-1 truncate ${
                      ioFeedback.type === "success"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {ioFeedback.type === "error" && (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{ioFeedback.message}</span>
                  </span>
                ) : (
                  <span className="truncate">
                    Disimpan otomatis di LocalStorage browser
                  </span>
                )}
                <span className="text-[#F5B700] shrink-0">
                  Portfolio Suite v1.5
                </span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
