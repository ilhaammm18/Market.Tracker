import {
  PriceAlertItem,
  EvaluatedPriceAlert,
  StockData,
} from "@/types/stock";
import {
  resolveStockForPortfolio,
  getCurrencySymbolByCode,
} from "@/lib/portfolio";

export const PRICE_ALERTS_STORAGE_KEY = "gsi_price_alerts_v1";

/**
 * Default seed smart price alerts so users immediately see live alert evaluation in action
 */
export const DEFAULT_PRICE_ALERTS: PriceAlertItem[] = [
  {
    id: "alert-seed-bbca",
    ticker: "BBCA",
    name: "PT Bank Central Asia Tbk",
    condition: "target_buy",
    targetPrice: 9500,
    currency: "IDR",
    currencySymbol: "Rp",
    createdAt: "2026-11-23T00:00:00.000Z",
  },
  {
    id: "alert-seed-nvda",
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    condition: "target_sell",
    targetPrice: 135,
    currency: "USD",
    currencySymbol: "$",
    createdAt: "2026-11-23T00:00:00.000Z",
  },
];

/**
 * Load saved price alerts from localStorage (seeds defaults only on very first run)
 */
export function loadPriceAlerts(): PriceAlertItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_PRICE_ALERTS;
  }

  try {
    const raw = localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        PRICE_ALERTS_STORAGE_KEY,
        JSON.stringify(DEFAULT_PRICE_ALERTS)
      );
      return DEFAULT_PRICE_ALERTS;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback to seed alerts
  }

  return DEFAULT_PRICE_ALERTS;
}

/**
 * Persist price alerts to localStorage
 */
export function savePriceAlerts(alerts: PriceAlertItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Pure function that evaluates all smart price alerts against live asset prices
 */
export function evaluatePriceAlerts(
  alerts: PriceAlertItem[],
  knownStocks: Record<string, StockData>
): EvaluatedPriceAlert[] {
  if (!Array.isArray(alerts) || alerts.length === 0) return [];

  return alerts.map((alert) => {
    const matched = resolveStockForPortfolio(alert.ticker, knownStocks);
    const currentPrice =
      matched && Number.isFinite(matched.price) && matched.price > 0
        ? matched.price
        : 0;
    const currency = (alert.currency || matched?.currency || "USD").toUpperCase();
    const currencySymbol =
      alert.currencySymbol || getCurrencySymbolByCode(currency);

    let isTriggered = false;
    if (currentPrice > 0 && alert.targetPrice > 0) {
      if (alert.condition === "target_buy") {
        isTriggered = currentPrice <= alert.targetPrice;
      } else {
        isTriggered = currentPrice >= alert.targetPrice;
      }
    }

    const distancePercent =
      currentPrice > 0
        ? Number(
            (((alert.targetPrice - currentPrice) / currentPrice) * 100).toFixed(
              2
            )
          )
        : 0;

    return {
      ...alert,
      currency,
      currencySymbol,
      currentPrice,
      isTriggered,
      distancePercent,
    };
  });
}

/**
 * Counts how many evaluated alerts have currently hit their target price
 */
export function countTriggeredAlerts(
  evaluated: EvaluatedPriceAlert[]
): number {
  return evaluated.filter((a) => a.isTriggered).length;
}
