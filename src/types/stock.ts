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

export type RSISignal = "Overbought" | "Oversold" | "Neutral";

export interface IndicatorPoint {
  time: number; // UNIX timestamp in seconds (UTCTimestamp compatible)
  timestamp: number; // Unix timestamp in milliseconds
  value: number;
}

export interface RSIResult {
  value: number;
  signal: RSISignal;
  series: IndicatorPoint[];
}

export type PortfolioCurrency = "IDR" | "USD" | "KRW" | "AUD";

export type PortfolioAssetType =
  | "IDX"
  | "US"
  | "KRX"
  | "ASX"
  | "ETF"
  | "CRYPTO"
  | string;

export interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  quantity: number;
  avgBuyPrice: number;
  currency: PortfolioCurrency | string;
  assetType: PortfolioAssetType;
}

export interface PortfolioAllocationItem {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  currencySymbol: string;
  assetType: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  marketValueOriginal: number;
  costBasisOriginal: number;
  pnlOriginal: number;
  marketValueIDR: number;
  costBasisIDR: number;
  pnlIDR: number;
  pnlPercent: number;
  weightPercent: number;
  color: string;
}

export interface PortfolioSummary {
  totalEquityIDR: number;
  totalCostIDR: number;
  totalPnLIDR: number;
  totalPnLPercent: number;
  allocation: PortfolioAllocationItem[];
}

export type RiskProfileType = "Moderate" | "Volatile" | "Aggressive";

export type AssetClassBucket = "IDX" | "GLOBAL" | "CRYPTO";

export interface RiskProfileTarget {
  id: RiskProfileType;
  label: string;
  description: string;
  targets: Record<AssetClassBucket, number>;
}

export type RebalanceStatus = "Overweight" | "Underweight" | "On Target";

export interface AssetRebalanceAnalysis {
  bucket: AssetClassBucket;
  label: string;
  actualWeightPercent: number;
  targetWeightPercent: number;
  deviationPercent: number;
  status: RebalanceStatus;
  actualEquityIDR: number;
  targetEquityIDR: number;
  suggestedActionIDR: number;
  actionLabel: "Tambah Posisi" | "Kurangi Posisi" | "Sesuai Target";
  color: string;
}

export interface PortfolioRebalanceReport {
  profile: RiskProfileTarget;
  totalEquityIDR: number;
  maxAbsDeviationPercent: number;
  healthScore: number;
  buckets: AssetRebalanceAnalysis[];
}

export type PortfolioImportMode = "replace" | "merge";

export interface PortfolioImportResult {
  success: boolean;
  items: PortfolioItem[];
  importedCount: number;
  error?: string;
}

export type PriceAlertCondition = "target_buy" | "target_sell";

export interface PriceAlertItem {
  id: string;
  ticker: string;
  name: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  currency: string;
  currencySymbol: string;
  createdAt: string;
}

export interface EvaluatedPriceAlert extends PriceAlertItem {
  currentPrice: number;
  isTriggered: boolean;
  distancePercent: number;
}
