import {
  PortfolioItem,
  PortfolioSummary,
  PortfolioAllocationItem,
  StockData,
} from "@/types/stock";
import { MOCK_STOCKS } from "@/data/mockStocks";

export const PORTFOLIO_STORAGE_KEY = "gsi_portfolio_v1";

/**
 * Reference foreign exchange rates to Indonesian Rupiah (IDR)
 */
export const FX_RATES_TO_IDR: Record<string, number> = {
  IDR: 1,
  USD: 15850,
  AUD: 10300,
  KRW: 11.4,
};

export const ALLOCATION_COLORS = [
  "#F5B700", // Gold
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#F43F5E", // Rose
  "#EC4899", // Pink
];

/**
 * Default seed portfolio containing 3 popular multi-currency assets
 * (BBCA.JK, NVDA, BTC-USD) so the portfolio tracker is immediately alive on first open.
 */
export const DEFAULT_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "seed-bbca",
    ticker: "BBCA.JK",
    name: "PT Bank Central Asia Tbk",
    exchange: "IDX",
    quantity: 5000, // 50 Lot BEI
    avgBuyPrice: 9750,
    currency: "IDR",
    assetType: "IDX",
  },
  {
    id: "seed-nvda",
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    quantity: 15,
    avgBuyPrice: 124.5,
    currency: "USD",
    assetType: "US",
  },
  {
    id: "seed-btc",
    ticker: "BTC-USD",
    name: "Bitcoin / US Dollar",
    exchange: "CRYPTO",
    quantity: 0.035,
    avgBuyPrice: 82500,
    currency: "USD",
    assetType: "CRYPTO",
  },
];

export function getCurrencySymbolByCode(currency: string = "IDR"): string {
  const upper = currency.toUpperCase();
  if (upper === "IDR") return "Rp";
  if (upper === "KRW") return "₩";
  if (upper === "AUD") return "A$";
  return "$";
}

export function convertToIDR(amount: number, currency: string = "IDR"): number {
  if (!Number.isFinite(amount)) return 0;
  const upper = currency.toUpperCase();
  const rate = FX_RATES_TO_IDR[upper] ?? 1;
  return amount * rate;
}

export function cleanTickerKey(symbol: string): string {
  return symbol
    .trim()
    .replace(/\.(JK|KS|KQ|AX)$/i, "")
    .replace(/-USD$/i, "")
    .toUpperCase();
}

export function resolveStockForPortfolio(
  ticker: string,
  knownStocks: Record<string, StockData>
): StockData | undefined {
  const rawUpper = ticker.trim().toUpperCase();
  const clean = cleanTickerKey(rawUpper);

  if (knownStocks[rawUpper]) return knownStocks[rawUpper];
  if (knownStocks[clean]) return knownStocks[clean];

  const foundInKnown = Object.values(knownStocks).find(
    (s) =>
      s.ticker.toUpperCase() === clean ||
      s.yahooSymbol.toUpperCase() === rawUpper
  );
  if (foundInKnown) return foundInKnown;

  if (MOCK_STOCKS[clean]) return MOCK_STOCKS[clean];
  return Object.values(MOCK_STOCKS).find(
    (s) =>
      s.ticker.toUpperCase() === clean ||
      s.yahooSymbol.toUpperCase() === rawUpper
  );
}

/**
 * Pure function to calculate multi-asset, multi-currency portfolio valuation & PnL in IDR
 */
export function calculatePortfolioSummary(
  items: PortfolioItem[],
  knownStocks: Record<string, StockData>
): PortfolioSummary {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalEquityIDR: 0,
      totalCostIDR: 0,
      totalPnLIDR: 0,
      totalPnLPercent: 0,
      allocation: [],
    };
  }

  let totalEquityIDR = 0;
  let totalCostIDR = 0;

  const rawAllocations: Omit<PortfolioAllocationItem, "weightPercent">[] =
    items.map((item, idx) => {
      const matched = resolveStockForPortfolio(item.ticker, knownStocks);
      const currency = (
        item.currency ||
        matched?.currency ||
        "IDR"
      ).toUpperCase();
      const currencySymbol = getCurrencySymbolByCode(currency);

      const safeQty =
        Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
      const safeAvgBuy =
        Number.isFinite(item.avgBuyPrice) && item.avgBuyPrice > 0
          ? item.avgBuyPrice
          : 0;

      // Use live market price if matched stock shares the same currency, else fallback to avgBuyPrice
      const currentPrice =
        matched &&
        matched.currency.toUpperCase() === currency &&
        Number.isFinite(matched.price) &&
        matched.price > 0
          ? matched.price
          : safeAvgBuy;

      const costBasisOriginal = safeQty * safeAvgBuy;
      const marketValueOriginal = safeQty * currentPrice;
      const pnlOriginal = marketValueOriginal - costBasisOriginal;

      const costBasisIDR = convertToIDR(costBasisOriginal, currency);
      const marketValueIDR = convertToIDR(marketValueOriginal, currency);
      const pnlIDR = marketValueIDR - costBasisIDR;
      const pnlPercent =
        costBasisOriginal > 0 ? (pnlOriginal / costBasisOriginal) * 100 : 0;

      totalEquityIDR += marketValueIDR;
      totalCostIDR += costBasisIDR;

      return {
        id: item.id,
        ticker: item.ticker.toUpperCase(),
        name: item.name || matched?.name || item.ticker.toUpperCase(),
        exchange: item.exchange || matched?.exchange || "GLOBAL",
        currency,
        currencySymbol,
        assetType: item.assetType || matched?.exchange || "EQUITY",
        quantity: safeQty,
        avgBuyPrice: safeAvgBuy,
        currentPrice,
        marketValueOriginal,
        costBasisOriginal,
        pnlOriginal,
        marketValueIDR,
        costBasisIDR,
        pnlIDR,
        pnlPercent,
        color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
      };
    });

  const totalPnLIDR = totalEquityIDR - totalCostIDR;
  const totalPnLPercent =
    totalCostIDR > 0 ? (totalPnLIDR / totalCostIDR) * 100 : 0;

  const allocation: PortfolioAllocationItem[] = rawAllocations.map((entry) => ({
    ...entry,
    weightPercent:
      totalEquityIDR > 0 ? (entry.marketValueIDR / totalEquityIDR) * 100 : 0,
  }));

  return {
    totalEquityIDR: Math.round(totalEquityIDR),
    totalCostIDR: Math.round(totalCostIDR),
    totalPnLIDR: Math.round(totalPnLIDR),
    totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
    allocation,
  };
}

/**
 * Load portfolio from LocalStorage, falling back to DEFAULT_PORTFOLIO_ITEMS on first run
 */
export function loadPortfolio(): PortfolioItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_PORTFOLIO_ITEMS;
  }

  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        PORTFOLIO_STORAGE_KEY,
        JSON.stringify(DEFAULT_PORTFOLIO_ITEMS)
      );
      return DEFAULT_PORTFOLIO_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback to seed data
  }

  return DEFAULT_PORTFOLIO_ITEMS;
}

/**
 * Save portfolio array to LocalStorage
 */
export function savePortfolio(items: PortfolioItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export type PortfolioFilterCategory = "ALL" | "IDX" | "GLOBAL" | "CRYPTO";

export interface PortfolioCategorySubtotal {
  category: PortfolioFilterCategory;
  count: number;
  subtotalEquityIDR: number;
  subtotalCostIDR: number;
  subtotalPnLIDR: number;
  subtotalPnLPercent: number;
  items: PortfolioAllocationItem[];
}

/**
 * Determines whether a portfolio allocation entry belongs to a given filter category
 */
export function matchesPortfolioCategory(
  item: PortfolioAllocationItem,
  category: PortfolioFilterCategory
): boolean {
  if (category === "ALL") return true;

  const exch = item.exchange.toUpperCase();
  const asset = item.assetType.toUpperCase();
  const ticker = item.ticker.toUpperCase();
  const isCrypto =
    exch === "CRYPTO" || asset === "CRYPTO" || ticker.endsWith("-USD");
  const isIdx =
    !isCrypto &&
    (exch === "IDX" ||
      asset === "IDX" ||
      ticker.endsWith(".JK") ||
      item.currency.toUpperCase() === "IDR");

  if (category === "CRYPTO") return isCrypto;
  if (category === "IDX") return isIdx;
  if (category === "GLOBAL") return !isCrypto && !isIdx;

  return true;
}

/**
 * Filters portfolio allocation items by category and computes category subtotals in IDR
 */
export function filterAndSummarizeByCategory(
  allocation: PortfolioAllocationItem[],
  category: PortfolioFilterCategory
): PortfolioCategorySubtotal {
  const filtered = allocation.filter((item) =>
    matchesPortfolioCategory(item, category)
  );

  let subtotalEquityIDR = 0;
  let subtotalCostIDR = 0;

  for (const item of filtered) {
    subtotalEquityIDR += item.marketValueIDR;
    subtotalCostIDR += item.costBasisIDR;
  }

  const subtotalPnLIDR = subtotalEquityIDR - subtotalCostIDR;
  const subtotalPnLPercent =
    subtotalCostIDR > 0 ? (subtotalPnLIDR / subtotalCostIDR) * 100 : 0;

  return {
    category,
    count: filtered.length,
    subtotalEquityIDR: Math.round(subtotalEquityIDR),
    subtotalCostIDR: Math.round(subtotalCostIDR),
    subtotalPnLIDR: Math.round(subtotalPnLIDR),
    subtotalPnLPercent: Number(subtotalPnLPercent.toFixed(2)),
    items: filtered,
  };
}
