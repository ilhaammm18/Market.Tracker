import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency: string = "USD",
  symbol: string = "$"
): string {
  if (currency === "IDR") {
    return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
  } else if (currency === "KRW") {
    return `₩ ${Math.round(value).toLocaleString("ko-KR")}`;
  } else if (currency === "AUD") {
    return `A$ ${value.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    // Default USD
    return `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatNumber(num: number): string {
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
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

