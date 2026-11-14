import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isIntegerCurrency(currency: string = "USD"): boolean {
  const upper = currency.toUpperCase();
  return upper === "IDR" || upper === "KRW" || upper === "JPY";
}

export function roundPriceByCurrency(value: number, currency: string = "USD"): number {
  if (!Number.isFinite(value)) return 0;
  if (isIntegerCurrency(currency)) {
    return Math.round(value);
  }
  return Math.round(value * 100) / 100;
}

export function formatCurrency(
  value: number,
  currency: string = "USD",
  symbol: string = "$"
): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  const curr = currency.toUpperCase();

  if (curr === "IDR") {
    return `Rp ${Math.round(safeVal).toLocaleString("id-ID")}`;
  } else if (curr === "KRW") {
    return `₩ ${Math.round(safeVal).toLocaleString("ko-KR")}`;
  } else if (curr === "AUD") {
    return `A$ ${safeVal.toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    return `${symbol}${safeVal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return "0";
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + " T";
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + " B";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + " M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + " K";
  }
  return num.toLocaleString();
}

export function formatPercent(value: number): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  const prefix = safeVal > 0 ? "+" : "";
  return `${prefix}${safeVal.toFixed(2)}%`;
}

export function generateDynamicInsight(params: {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  high52w: number;
  low52w: number;
  volume: number;
  volumeDisplay: string;
  currency: string;
  currencySymbol: string;
  exchange: string;
  baseInsight?: string;
}): string {
  const {
    ticker,
    price,
    changePercent,
    high24h,
    low24h,
    high52w,
    low52w,
    volume,
    volumeDisplay,
    currency,
    currencySymbol,
    exchange,
    baseInsight,
  } = params;

  const range52 = Math.max(high52w - low52w, 0.0001);
  const pos52 = Math.min(100, Math.max(0, ((price - low52w) / range52) * 100));

  const priceStr = formatCurrency(price, currency, currencySymbol);
  const high52Str = formatCurrency(high52w, currency, currencySymbol);
  const low52Str = formatCurrency(low52w, currency, currencySymbol);

  // 1. 52-Week position analysis
  let positionAnalysis = "";
  if (pos52 >= 80) {
    positionAnalysis = `Harga ${ticker} (${priceStr}) saat ini menguji area Resistance 52-Minggu Tertinggi (${high52Str}) pada level ${pos52.toFixed(0)}% dari rentang tahunan, mengindikasikan momentum tren naik (bullish) yang kuat.`;
  } else if (pos52 <= 25) {
    positionAnalysis = `Harga ${ticker} (${priceStr}) bergerak di dekat area Support 52-Minggu Terendah (${low52Str}) pada posisi ${pos52.toFixed(0)}% rentang tahunan, menjadi zona pantauan valuasi & potensi teknikal rebound.`;
  } else if (pos52 >= 55) {
    positionAnalysis = `Harga ${ticker} (${priceStr}) berada di paruh atas rentang 52-Minggu (${pos52.toFixed(0)}% menuju resistance ${high52Str}) dengan struktur harga menengah yang konstruktif.`;
  } else {
    positionAnalysis = `Harga ${ticker} (${priceStr}) bergerak dalam fase konsolidasi tengah (${pos52.toFixed(0)}% dari rentang 52-Minggu ${low52Str} – ${high52Str}).`;
  }

  // 2. Daily change & volume activity analysis
  const absChange = Math.abs(changePercent).toFixed(2);
  let changeAnalysis = "";
  if (changePercent > 1.5) {
    changeAnalysis = `Tercatat reli harian signifikan +${absChange}% dengan rentang intraday ${formatCurrency(low24h, currency, currencySymbol)} – ${formatCurrency(high24h, currency, currencySymbol)}`;
  } else if (changePercent > 0) {
    changeAnalysis = `Menguat moderat +${absChange}% hari ini dalam rentang ${formatCurrency(low24h, currency, currencySymbol)} – ${formatCurrency(high24h, currency, currencySymbol)}`;
  } else if (changePercent < -1.5) {
    changeAnalysis = `Mengalami tekanan jual harian -${absChange}% dengan titik terendah sesi di ${formatCurrency(low24h, currency, currencySymbol)}`;
  } else if (changePercent < 0) {
    changeAnalysis = `Terkoreksi tipis -${absChange}% dengan batas bawah intraday di ${formatCurrency(low24h, currency, currencySymbol)}`;
  } else {
    changeAnalysis = `Bergerak stagnan (0.00%) sejajar harga penutupan sebelumnya`;
  }

  const lotInfo =
    exchange === "IDX" && volume > 0
      ? ` (${(volume / 100 / 1e6).toFixed(2)} Juta Lot)`
      : "";

  const volumeAnalysis =
    volume > 0
      ? ` disertai aktivitas volume transaksi ${volumeDisplay}${lotInfo}.`
      : `.`;

  if (baseInsight) {
    return `${positionAnalysis} ${changeAnalysis}${volumeAnalysis} ${baseInsight}`;
  }

  return `${positionAnalysis} ${changeAnalysis}${volumeAnalysis}`;
}
