"use client";

import React, { useState, useEffect } from "react";
import { X, Key, CheckCircle, Shield, RefreshCw, Cpu } from "lucide-react";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [finnhubKey, setFinnhubKey] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gsi_finnhub_key") || "";
      setFinnhubKey(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("gsi_finnhub_key", finnhubKey.trim());
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onRefreshData();
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A192F] border border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-[#F5B700]/20">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Koneksi & Arsitektur Data Pasar</h3>
              <p className="text-xs text-white/50">Konfigurasi feed API real-time & mesin simulasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Active Status Badge */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-emerald-400 block font-mono text-sm">
                YAHOO FINANCE v8 ENGINE: AKTIF & REAL-TIME
              </span>
              <p className="text-white/70 mt-1">
                Data harga saham, perubahan harian, rentang 52-minggu, volume, dan riwayat kurva diambil langsung dari server resmi Yahoo Finance publik (IDX .JK, US, KRX .KS, ASX .AX, Crypto). Seluruh Math.random() telah dihapus untuk memastikan kepatuhan fraksi harga resmi bursa.
              </p>
            </div>
          </div>

          {/* Optional API Key Input */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-white/70 uppercase mb-2">
                Finnhub API Key (Opsional):
              </label>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 text-white/40 absolute left-3.5" />
                <input
                  type="password"
                  value={finnhubKey}
                  onChange={(e) => setFinnhubKey(e.target.value)}
                  placeholder="Masukkan Finnhub API Key jika ada..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F5B700] font-mono"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">
                Jika diisi, aplikasi akan mengutamakan query langsung ke live order book Finnhub saat menganalisis saham bursa Amerika Serikat.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#F5B700] hover:bg-[#E5A700] text-navy-950 font-bold font-mono text-xs shadow-gold transition-all"
              >
                {savedSuccess ? "Tersimpan ✓" : "Simpan & Terapkan"}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer info */}
        <div className="p-4 bg-[#061024] border-t border-white/10 text-[11px] font-mono text-white/40 flex items-center justify-between px-6">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#06B6D4]" /> Auto Polling: 12 Detik
          </span>
          <span className="text-white/60">Next.js App Router API Route</span>
        </div>

      </div>
    </div>
  );
};

