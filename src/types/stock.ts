export type MarketRegion = "ALL" | "IDX" | "US" | "KRX" | "ASX" | "ETF" | "CRYPTO";

export type TimeFrame = "1D" | "1W" | "1M" | "1Y" | "ALL";

export type ChartMode = "area" | "candlestick";

export type MarketState = "REGULAR" | "CLOSED" | "PRE" | "POST";

export type NavSectionId = "overview" | "fundamentals" | "compare" | "news";

export interface StockPricePoint {
  time: string; // Formatted date/time label for UI
  timestamp: number; // Unix timestamp in milliseconds
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
  exchange: "IDX" | "NASDAQ" | "NYSE" | "KRX" | "ASX" | "CRYPTO" | string;
  exchangeLabel: string;
  country: string;
  category: string;
  sector: string;
  currency: "IDR" | "USD" | "KRW" | "AUD" | string;
  currencySymbol: string;
  price: number;
  openPrice: number;
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
  marketState: MarketState;
  marketStateText: string;
  source: "yahoo_finance_live" | "cached";
}

export interface TickerTapeItem {
  ticker: string;
  yahooSymbol?: string;
  exchange: string;
  price: number;
  priceFormatted: string;
  change: number;
  changePercent: number;
  currencySymbol: string;
  isMarketOpen?: boolean;
  marketState?: MarketState;
}

export interface StockApiResponse {
  success: boolean;
  source: "yahoo_finance_live" | "cached";
  stock: StockData;
  message?: string;
}

export interface SearchQuoteItem {
  symbol: string;
  cleanTicker: string;
  shortName: string;
  longName: string;
  exchange: string;
  exchangeDisplay: string;
  quoteType: string;
  sector?: string;
  industry?: string;
  isIdx: boolean;
}

export interface StockNewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  publishedAtText: string;
  type: string;
  thumbnailUrl?: string;
  relatedTickers: string[];
}

export interface SearchApiResponse {
  success: boolean;
  query: string;
  quotes: SearchQuoteItem[];
  news: StockNewsItem[];
}
