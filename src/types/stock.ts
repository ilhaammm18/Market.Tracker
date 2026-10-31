export type MarketRegion = "ALL" | "IDX" | "US" | "KRX" | "ASX" | "ETF" | "CRYPTO";

export type TimeFrame = "1D" | "1W" | "1M" | "1Y" | "ALL";

export interface StockPricePoint {
  time: string; // ISO date or time string
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  id: string;
  ticker: string;
  yahooSymbol: string;
  name: string;
  exchange: "IDX" | "NASDAQ" | "NYSE" | "KRX" | "ASX" | "CRYPTO";
  exchangeLabel: string; // e.g. "BEI : BMRI"
  country: string;
  category: string; // e.g. "BLUE-CHIP · PERBANKAN"
  sector: string;
  currency: "IDR" | "USD" | "KRW" | "AUD";
  currencySymbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  volumeDisplay: string;
  marketCap: number;
  marketCapDisplay: string;
  peRatio: number;
  dividendYield: string;
  high52w: number;
  low52w: number;
  beta?: number;
  eps?: number;
  description: string;
  insight: string;
  history: Record<TimeFrame, StockPricePoint[]>;
  sparkline: number[];
  lastUpdated: string;
  isMarketOpen: boolean;
  marketStateText: string;
  source: "yahoo_finance_live" | "cached";
}

export interface TickerTapeItem {
  ticker: string;
  exchange: string;
  price: number;
  priceFormatted: string;
  change: number;
  changePercent: number;
  currencySymbol: string;
  isMarketOpen?: boolean;
}

export interface StockApiResponse {
  success: boolean;
  source: "yahoo_finance_live" | "cached";
  stock: StockData;
  message?: string;
}
