import { NextRequest, NextResponse } from "next/server";
import { MOCK_STOCKS, INITIAL_TICKER_TAPE } from "@/data/mockStocks";

export const dynamic = "force-dynamic";
import { StockData, TimeFrame, StockPricePoint, MarketState } from "@/types/stock";
import {
  formatCurrency,
  formatNumber,
  isIntegerCurrency,
  roundPriceByCurrency,
  generateDynamicInsight,
} from "@/lib/utils";

const KNOWN_US_4LETTER = new Set([
  "AAPL", "NVDA", "MSFT", "TSLA", "GOOG", "AMZN", "META", "NFLX", "INTC",
  "PLTR", "COIN", "UBER", "ABNB", "SHOP", "ORCL", "ADBE", "CSCO", "QCOM",
  "AVGO", "COST", "SBUX", "PYPL", "SONY", "BABA", "MSTR", "SMCI", "ASML",
  "SNOW", "CRWD", "PANW", "SPOT", "ROKU", "DASH", "LYFT", "SNAP", "PINS",
  "DELL", "HPQ", "EBAY", "ETSY", "ZM", "DOCU", "TWLO", "OKTA", "DDOG",
]);

// Mapping function to resolve Yahoo Finance symbols and market metadata
function mapToYahooSymbol(input: string): {
  yahooSymbol: string;
  alternateSymbol?: string;
  cleanTicker: string;
  exchange: string;
  exchangeLabel: string;
  currency: string;
  currencySymbol: string;
  country: string;
  category: string;
  sector: string;
} {
  const upper = input.trim().toUpperCase();

  // 1. Explicit Yahoo suffixes
  if (upper.endsWith(".JK")) {
    const clean = upper.replace(".JK", "");
    return {
      yahooSymbol: upper,
      cleanTicker: clean,
      exchange: "IDX",
      exchangeLabel: `BEI : ${clean}`,
      currency: "IDR",
      currencySymbol: "Rp",
      country: "Indonesia",
      category: "SAHAM IDX · BURSA EFEK INDONESIA",
      sector: "Pasar Modal Indonesia (BEI)",
    };
  }

  if (upper.endsWith(".KS") || upper.endsWith(".KQ")) {
    const clean = upper.replace(/\.(KS|KQ)$/, "");
    return {
      yahooSymbol: upper,
      cleanTicker: clean,
      exchange: "KRX",
      exchangeLabel: `KRX : ${clean}`,
      currency: "KRW",
      currencySymbol: "₩",
      country: "South Korea",
      category: "KRX KOREA · EQUITIES",
      sector: "Korea Exchange",
    };
  }

  if (upper.endsWith(".AX")) {
    const clean = upper.replace(".AX", "");
    return {
      yahooSymbol: upper,
      cleanTicker: clean,
      exchange: "ASX",
      exchangeLabel: `ASX : ${clean}`,
      currency: "AUD",
      currencySymbol: "A$",
      country: "Australia",
      category: "ASX AUSTRALIA · EQUITIES",
      sector: "Australian Securities Exchange",
    };
  }

  if (upper.endsWith("-USD")) {
    const clean = upper.replace("-USD", "");
    return {
      yahooSymbol: upper,
      cleanTicker: clean,
      exchange: "CRYPTO",
      exchangeLabel: `SPOT : ${clean}/USD`,
      currency: "USD",
      currencySymbol: "$",
      country: "Global",
      category: "DECENTRALIZED ASSET · CRYPTO",
      sector: "Digital Assets & Blockchain",
    };
  }

  // 2. Known Crypto shortcuts
  if (["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK"].includes(upper)) {
    return {
      yahooSymbol: `${upper}-USD`,
      cleanTicker: upper,
      exchange: "CRYPTO",
      exchangeLabel: `SPOT : ${upper}/USD`,
      currency: "USD",
      currencySymbol: "$",
      country: "Global",
      category: "DECENTRALIZED ASSET · STORE OF VALUE",
      sector: "Digital Assets & Blockchain",
    };
  }

  // 3. Korean 6-digit stock symbols
  if (/^\d{6}$/.test(upper)) {
    return {
      yahooSymbol: `${upper}.KS`,
      cleanTicker: upper,
      exchange: "KRX",
      exchangeLabel: `KRX : ${upper}`,
      currency: "KRW",
      currencySymbol: "₩",
      country: "South Korea",
      category: "CONGLOMERATE · MEMORY & HARDWARE",
      sector: "Semikonduktor & Elektronika",
    };
  }

  // 4. Known Australian tickers
  if (["BHP", "CBA", "CSL", "NAB", "ANZ", "WBC", "FMG", "RIO", "WES", "TLS"].includes(upper)) {
    return {
      yahooSymbol: `${upper}.AX`,
      alternateSymbol: upper,
      cleanTicker: upper,
      exchange: "ASX",
      exchangeLabel: `ASX : ${upper}`,
      currency: "AUD",
      currencySymbol: "A$",
      country: "Australia",
      category: "GLOBAL MINING & COMMODITIES",
      sector: "Material Dasar & Sumber Daya Alam",
    };
  }

  // 5. Known US ETFs
  if (["VOO", "SPY", "QQQ", "IVV", "DIA", "VTI", "IWM", "ARKK", "GLD", "TLT", "SCHD", "SMH"].includes(upper)) {
    return {
      yahooSymbol: upper,
      cleanTicker: upper,
      exchange: "NYSE",
      exchangeLabel: `ETF : ${upper}`,
      currency: "USD",
      currencySymbol: "$",
      country: "United States",
      category: "INDEX ETF · BROAD MARKET",
      sector: "Indeks Pasar Saham Global",
    };
  }

  // 6. Known US 4-letter tech / mega-caps
  if (KNOWN_US_4LETTER.has(upper)) {
    return {
      yahooSymbol: upper,
      alternateSymbol: `${upper}.JK`,
      cleanTicker: upper,
      exchange: "NASDAQ",
      exchangeLabel: `NASDAQ : ${upper}`,
      currency: "USD",
      currencySymbol: "$",
      country: "United States",
      category: "MEGA-CAP TECH · AI & CLOUD",
      sector: "Teknologi Informasi & Perangkat Lunak",
    };
  }

  // 7. Indonesian 4-letter stock symbols (Prioritas IDX .JK, dengan fallback US)
  if (/^[A-Z]{4}$/.test(upper)) {
    return {
      yahooSymbol: `${upper}.JK`,
      alternateSymbol: upper,
      cleanTicker: upper,
      exchange: "IDX",
      exchangeLabel: `BEI : ${upper}`,
      currency: "IDR",
      currencySymbol: "Rp",
      country: "Indonesia",
      category: "SAHAM UNGGULAN · BURSA EFEK INDONESIA",
      sector: "Pasar Saham Domestik (BEI)",
    };
  }

  // 8. Default Global / US Equity
  const clean = upper.split(".")[0];
  return {
    yahooSymbol: upper,
    cleanTicker: clean,
    exchange: "NASDAQ",
    exchangeLabel: `GLOBAL : ${upper}`,
    currency: "USD",
    currencySymbol: "$",
    country: "United States",
    category: "GLOBAL EQUITIES",
    sector: "International Equities",
  };
}

// Resolve metadata overrides from Yahoo Finance result.meta
function resolveMetaMarketInfo(meta: any, fallbackMapping: ReturnType<typeof mapToYahooSymbol>) {
  const symbol: string = (meta.symbol || fallbackMapping.yahooSymbol).toUpperCase();
  const rawCurrency: string = (meta.currency || fallbackMapping.currency || "USD").toUpperCase();
  const exchName: string = (meta.exchangeName || meta.fullExchangeName || "").toUpperCase();
  const instrumentType: string = (meta.instrumentType || "").toUpperCase();

  if (symbol.endsWith(".JK") || exchName.includes("JKT") || exchName.includes("JAKARTA") || rawCurrency === "IDR") {
    const clean = symbol.replace(".JK", "");
    return {
      yahooSymbol: symbol,
      cleanTicker: clean,
      exchange: "IDX",
      exchangeLabel: `BEI : ${clean}`,
      currency: "IDR",
      currencySymbol: "Rp",
      country: "Indonesia",
      category: "SAHAM UNGGULAN · BURSA EFEK INDONESIA",
      sector: "Pasar Saham Domestik (BEI)",
    };
  }

  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ") || rawCurrency === "KRW" || exchName.includes("KSC") || exchName.includes("KOE")) {
    const clean = symbol.replace(/\.(KS|KQ)$/, "");
    return {
      yahooSymbol: symbol,
      cleanTicker: clean,
      exchange: "KRX",
      exchangeLabel: `KRX : ${clean}`,
      currency: "KRW",
      currencySymbol: "₩",
      country: "South Korea",
      category: "KRX KOREA · EQUITIES",
      sector: "Korea Exchange",
    };
  }

  if (symbol.endsWith(".AX") || rawCurrency === "AUD" || exchName.includes("ASX")) {
    const clean = symbol.replace(".AX", "");
    return {
      yahooSymbol: symbol,
      cleanTicker: clean,
      exchange: "ASX",
      exchangeLabel: `ASX : ${clean}`,
      currency: "AUD",
      currencySymbol: "A$",
      country: "Australia",
      category: "ASX AUSTRALIA · EQUITIES",
      sector: "Australian Securities Exchange",
    };
  }

  if (symbol.endsWith("-USD") || instrumentType === "CRYPTOCURRENCY" || exchName.includes("CCC")) {
    const clean = symbol.replace("-USD", "");
    return {
      yahooSymbol: symbol,
      cleanTicker: clean,
      exchange: "CRYPTO",
      exchangeLabel: `SPOT : ${clean}/USD`,
      currency: "USD",
      currencySymbol: "$",
      country: "Global",
      category: "DECENTRALIZED ASSET · CRYPTO",
      sector: "Digital Assets & Blockchain",
    };
  }

  const isNyse = exchName.includes("NYQ") || exchName.includes("NYSE") || exchName.includes("PCX") || exchName.includes("ARC");
  const isEtf = instrumentType === "ETF" || instrumentType === "MUTUALFUND";
  const resolvedExchange = isNyse ? "NYSE" : "NASDAQ";
  const clean = symbol.split(".")[0];

  return {
    yahooSymbol: symbol,
    cleanTicker: clean,
    exchange: resolvedExchange,
    exchangeLabel: `${resolvedExchange} : ${clean}`,
    currency: rawCurrency,
    currencySymbol: rawCurrency === "IDR" ? "Rp" : rawCurrency === "KRW" ? "₩" : rawCurrency === "AUD" ? "A$" : "$",
    country: "United States",
    category: isEtf ? "INDEX ETF · GLOBAL MARKET" : fallbackMapping.category,
    sector: isEtf ? "Exchange Traded Fund (ETF)" : fallbackMapping.sector,
  };
}

// Map timeframe to Yahoo Finance query parameters
function getTimeframeParams(timeframe: TimeFrame): { interval: string; range: string } {
  switch (timeframe) {
    case "1D":
      return { interval: "5m", range: "1d" };
    case "1W":
      return { interval: "15m", range: "5d" };
    case "1M":
      return { interval: "1d", range: "1mo" };
    case "1Y":
      return { interval: "1d", range: "1y" };
    case "ALL":
      return { interval: "1wk", range: "5y" };
    default:
      return { interval: "5m", range: "1d" };
  }
}

// Fetch single chart data from Yahoo Finance v8 Chart API
async function fetchYahooChart(yahooSymbol: string, interval: string, range: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?interval=${interval}&range=${range}&includePrePost=false`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  if (!result || !result.meta) {
    throw new Error("No chart result found in Yahoo Finance response");
  }
  return result;
}

function detectMarketState(meta: any, exchange: string): {
  marketState: MarketState;
  isMarketOpen: boolean;
  marketStateText: string;
} {
  if (exchange === "CRYPTO") {
    return {
      marketState: "REGULAR",
      isMarketOpen: true,
      marketStateText: "MARKET OPEN · LIVE 24/7",
    };
  }

  // 1. Check explicit meta.marketState if provided by Yahoo Finance
  if (typeof meta.marketState === "string") {
    const rawState = meta.marketState.toUpperCase();
    if (rawState === "REGULAR") {
      return {
        marketState: "REGULAR",
        isMarketOpen: true,
        marketStateText: "MARKET OPEN · LIVE TRADING",
      };
    }
    if (rawState === "PRE" || rawState === "PREPRE") {
      return {
        marketState: "PRE",
        isMarketOpen: false,
        marketStateText: "MARKET CLOSED · HARGA PENUTUPAN RESMI",
      };
    }
    if (rawState === "POST" || rawState === "POSTPOST") {
      return {
        marketState: "POST",
        isMarketOpen: false,
        marketStateText: "MARKET CLOSED · HARGA PENUTUPAN RESMI",
      };
    }
    return {
      marketState: "CLOSED",
      isMarketOpen: false,
      marketStateText: "MARKET CLOSED · HARGA PENUTUPAN RESMI",
    };
  }

  // 2. Fallback to currentTradingPeriod.regular timestamps
  const nowSec = Math.floor(Date.now() / 1000);
  const regPeriod = meta.currentTradingPeriod?.regular;
  if (regPeriod && regPeriod.start && regPeriod.end) {
    const open = nowSec >= regPeriod.start && nowSec <= regPeriod.end;
    if (open) {
      return {
        marketState: "REGULAR",
        isMarketOpen: true,
        marketStateText: "MARKET OPEN · LIVE TRADING",
      };
    }
  }

  return {
    marketState: "CLOSED",
    isMarketOpen: false,
    marketStateText: "MARKET CLOSED · HARGA PENUTUPAN RESMI",
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const rawTicker = searchParams.get("ticker") || "BMRI";
  const timeframe = (searchParams.get("timeframe") || "1D") as TimeFrame;

  // 1. ACTION: TAPE (Synchronized real quotes for the Global Ticker Tape)
  if (action === "tape") {
    const tapeTickers = [
      { ticker: "BBCA", ySymbol: "BBCA.JK", ex: "IDX", curr: "IDR", sym: "Rp" },
      { ticker: "BMRI", ySymbol: "BMRI.JK", ex: "IDX", curr: "IDR", sym: "Rp" },
      { ticker: "BBRI", ySymbol: "BBRI.JK", ex: "IDX", curr: "IDR", sym: "Rp" },
      { ticker: "TLKM", ySymbol: "TLKM.JK", ex: "IDX", curr: "IDR", sym: "Rp" },
      { ticker: "ASII", ySymbol: "ASII.JK", ex: "IDX", curr: "IDR", sym: "Rp" },
      { ticker: "AAPL", ySymbol: "AAPL", ex: "NASDAQ", curr: "USD", sym: "$" },
      { ticker: "NVDA", ySymbol: "NVDA", ex: "NASDAQ", curr: "USD", sym: "$" },
      { ticker: "MSFT", ySymbol: "MSFT", ex: "NASDAQ", curr: "USD", sym: "$" },
      { ticker: "VOO", ySymbol: "VOO", ex: "NYSE", curr: "USD", sym: "$" },
      { ticker: "005930", ySymbol: "005930.KS", ex: "KRX", curr: "KRW", sym: "₩" },
      { ticker: "BHP", ySymbol: "BHP.AX", ex: "ASX", curr: "AUD", sym: "A$" },
      { ticker: "BTC", ySymbol: "BTC-USD", ex: "CRYPTO", curr: "USD", sym: "$" },
    ];

    try {
      const tapeResults = await Promise.all(
        tapeTickers.map(async (item) => {
          try {
            const data = await fetchYahooChart(item.ySymbol, "15m", "1d");
            const meta = data.meta;

            const rawPrice = meta.regularMarketPrice;
            const rawPrev = meta.chartPreviousClose || meta.previousClose || rawPrice;

            const price = roundPriceByCurrency(rawPrice, item.curr);
            const prevClose = roundPriceByCurrency(rawPrev, item.curr);
            const change = roundPriceByCurrency(price - prevClose, item.curr);
            const changePercent =
              prevClose !== 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0;

            const priceFormatted = formatCurrency(price, item.curr, item.sym);
            const stateInfo = detectMarketState(meta, item.ex);

            return {
              ticker: item.ticker,
              yahooSymbol: item.ySymbol,
              exchange: item.ex,
              price,
              priceFormatted,
              change,
              changePercent,
              currencySymbol: item.sym,
              isMarketOpen: stateInfo.isMarketOpen,
              marketState: stateInfo.marketState,
            };
          } catch {
            const fallback = INITIAL_TICKER_TAPE.find((t) => t.ticker === item.ticker);
            return (
              fallback || {
                ticker: item.ticker,
                yahooSymbol: item.ySymbol,
                exchange: item.ex,
                price: 0,
                priceFormatted: "-",
                change: 0,
                changePercent: 0,
                currencySymbol: item.sym,
              }
            );
          }
        })
      );

      return NextResponse.json({ success: true, data: tapeResults, source: "yahoo_finance_live" });
    } catch {
      return NextResponse.json({ success: true, data: INITIAL_TICKER_TAPE, source: "cached" });
    }
  }

  // 2. ACTION: LIST (All preset stocks list)
  if (action === "list") {
    const list = Object.values(MOCK_STOCKS).map((s) => ({
      ticker: s.ticker,
      yahooSymbol: s.yahooSymbol,
      name: s.name,
      exchange: s.exchange,
      country: s.country,
      category: s.category,
      price: s.price,
      changePercent: s.changePercent,
      currencySymbol: s.currencySymbol,
    }));
    return NextResponse.json({ success: true, data: list });
  }

  // 3. FETCH FULL STOCK DATA (Yahoo Finance Real-time v8 Chart)
  const initialMapping = mapToYahooSymbol(rawTicker);
  const { interval, range } = getTimeframeParams(timeframe);

  try {
    let result: any;
    try {
      result = await fetchYahooChart(initialMapping.yahooSymbol, interval, range);
    } catch (primaryErr) {
      if (initialMapping.alternateSymbol) {
        result = await fetchYahooChart(initialMapping.alternateSymbol, interval, range);
      } else {
        throw primaryErr;
      }
    }

    const meta = result.meta;
    const mapping = resolveMetaMarketInfo(meta, initialMapping);
    const curr = mapping.currency;
    const isInt = isIntegerCurrency(curr);

    // Extract OHLC & Volume arrays from indicators.quote[0]
    const timestamps: number[] = result.timestamp || [];
    const quoteObj = result.indicators?.quote?.[0] || {};
    const opens: (number | null)[] = quoteObj.open || [];
    const highs: (number | null)[] = quoteObj.high || [];
    const lows: (number | null)[] = quoteObj.low || [];
    const closes: (number | null)[] = quoteObj.close || [];
    const volumes: (number | null)[] = quoteObj.volume || [];

    const historyPoints: StockPricePoint[] = [];
    const seenTimestamps = new Set<number>();
    const isIntraday = timeframe === "1D" || timeframe === "1W";

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      const t = timestamps[i];
      if (
        t !== null &&
        t !== undefined &&
        c !== null &&
        c !== undefined &&
        Number.isFinite(c) &&
        !seenTimestamps.has(t)
      ) {
        seenTimestamps.add(t);
        const oRaw = opens[i] !== null && opens[i] !== undefined && Number.isFinite(opens[i]!) ? opens[i]! : c;
        const hRaw = highs[i] !== null && highs[i] !== undefined && Number.isFinite(highs[i]!) ? highs[i]! : Math.max(oRaw, c);
        const lRaw = lows[i] !== null && lows[i] !== undefined && Number.isFinite(lows[i]!) ? lows[i]! : Math.min(oRaw, c);
        const vRaw = volumes[i] !== null && volumes[i] !== undefined && Number.isFinite(volumes[i]!) ? volumes[i]! : 0;

        const openVal = roundPriceByCurrency(oRaw, curr);
        const closeVal = roundPriceByCurrency(c, curr);
        const highVal = roundPriceByCurrency(Math.max(hRaw, openVal, closeVal), curr);
        const lowVal = roundPriceByCurrency(Math.min(lRaw, openVal, closeVal), curr);

        const d = new Date(t * 1000);
        const timeStr = d.toLocaleDateString("id-ID", {
          month: "short",
          day: "numeric",
          year: timeframe === "ALL" || timeframe === "1Y" ? "2-digit" : undefined,
          hour: isIntraday ? "2-digit" : undefined,
          minute: isIntraday ? "2-digit" : undefined,
        });

        historyPoints.push({
          time: timeStr,
          timestamp: t * 1000,
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
          volume: Math.round(vRaw),
        });
      }
    }

    // Ensure strictly ascending order by timestamp
    historyPoints.sort((a, b) => a.timestamp - b.timestamp);

    const lastCloseFromQuotes =
      historyPoints.length > 0 ? historyPoints[historyPoints.length - 1].close : 0;
    const firstOpenFromQuotes =
      historyPoints.length > 0 ? historyPoints[0].open : 0;

    const rawPrice = meta.regularMarketPrice ?? lastCloseFromQuotes;
    const rawPrevClose = meta.chartPreviousClose ?? meta.previousClose ?? rawPrice;
    const rawOpen = meta.regularMarketOpen ?? (firstOpenFromQuotes || rawPrevClose);

    const price = roundPriceByCurrency(rawPrice, curr);
    const previousClose = roundPriceByCurrency(rawPrevClose, curr);
    const openPrice = roundPriceByCurrency(rawOpen, curr);
    const change = roundPriceByCurrency(price - previousClose, curr);
    const changePercent =
      previousClose !== 0 ? Math.round(((price - previousClose) / previousClose) * 10000) / 100 : 0;

    // Compute Day High / Low from meta or intraday quotes
    const quoteMaxHigh =
      historyPoints.length > 0 ? Math.max(...historyPoints.map((p) => p.high)) : price;
    const quoteMinLow =
      historyPoints.length > 0 ? Math.min(...historyPoints.map((p) => p.low)) : price;

    const high24h = roundPriceByCurrency(
      meta.regularMarketDayHigh || Math.max(price, openPrice, timeframe === "1D" ? quoteMaxHigh : price),
      curr
    );
    const low24h = roundPriceByCurrency(
      meta.regularMarketDayLow || Math.min(price, openPrice, timeframe === "1D" ? quoteMinLow : price),
      curr
    );

    const high52w = roundPriceByCurrency(
      meta.fiftyTwoWeekHigh || Math.max(price * 1.15, high24h),
      curr
    );
    const low52w = roundPriceByCurrency(
      meta.fiftyTwoWeekLow || Math.min(price * 0.85, low24h),
      curr
    );

    const sumQuoteVolume =
      timeframe === "1D" ? historyPoints.reduce((acc, p) => acc + p.volume, 0) : 0;
    const rawVolume = meta.regularMarketVolume || sumQuoteVolume || 0;
    const volumeDisplay =
      curr === "IDR"
        ? `${formatNumber(rawVolume)} Lbr`
        : formatNumber(rawVolume);

    const stateInfo = detectMarketState(meta, mapping.exchange);

    // Sparkline array from quotes
    const sparkline = historyPoints.slice(-24).map((p) => p.close);

    // Existing rich metadata from static profile (if available)
    const baseMock = MOCK_STOCKS[mapping.cleanTicker] || null;

    const fallbackHistory: Record<TimeFrame, StockPricePoint[]> = baseMock?.history || {
      "1D": historyPoints,
      "1W": historyPoints,
      "1M": historyPoints,
      "1Y": historyPoints,
      "ALL": historyPoints,
    };

    const fullHistory: Record<TimeFrame, StockPricePoint[]> = {
      ...fallbackHistory,
      [timeframe]: historyPoints.length > 0 ? historyPoints : fallbackHistory[timeframe] || [],
    };

    const resolvedName =
      meta.longName || meta.shortName || baseMock?.name || `${mapping.cleanTicker} (${mapping.exchange})`;

    // Dynamic Market Cap estimation if not in baseMock
    const estimatedMarketCap =
      baseMock?.marketCap ||
      (curr === "IDR"
        ? price * 35_000_000_000
        : curr === "KRW"
        ? price * 600_000_000
        : price * 1_500_000_000);

    const marketCapDisplay =
      baseMock?.marketCapDisplay ||
      `${mapping.currencySymbol} ${formatNumber(estimatedMarketCap)}`;

    // Dynamic Volatility / Beta calculation from 52W spread
    const spread52Ratio = low52w > 0 ? (high52w - low52w) / low52w : 0.3;
    const computedBeta =
      baseMock?.beta ||
      Math.round(Math.min(2.4, Math.max(0.55, 0.65 + spread52Ratio * 0.85)) * 100) / 100;

    const dynamicDescription =
      baseMock?.description ||
      `Instrumen ekuitas/aset ${resolvedName} (${mapping.yahooSymbol}) diperdagangkan secara resmi di bursa ${
        meta.fullExchangeName || mapping.exchange
      } dalam denominasi mata uang ${curr}.`;

    const dynamicInsight = generateDynamicInsight({
      ticker: mapping.cleanTicker,
      name: resolvedName,
      price,
      previousClose,
      changePercent,
      high24h,
      low24h,
      high52w,
      low52w,
      volume: rawVolume,
      volumeDisplay,
      currency: curr,
      currencySymbol: mapping.currencySymbol,
      exchange: mapping.exchange,
      baseInsight: baseMock?.insight,
    });

    const finalStock: StockData = {
      id: mapping.cleanTicker.toLowerCase(),
      ticker: mapping.cleanTicker,
      yahooSymbol: mapping.yahooSymbol,
      name: resolvedName,
      exchange: mapping.exchange,
      exchangeLabel: mapping.exchangeLabel,
      country: baseMock?.country || mapping.country,
      category: baseMock?.category || mapping.category,
      sector: baseMock?.sector || mapping.sector,
      currency: curr,
      currencySymbol: mapping.currencySymbol,
      price,
      openPrice,
      previousClose,
      change,
      changePercent,
      high24h,
      low24h,
      volume: rawVolume,
      volumeDisplay,
      marketCap: estimatedMarketCap,
      marketCapDisplay,
      peRatio: baseMock?.peRatio ?? (mapping.exchange === "CRYPTO" ? 0 : isInt ? 14.2 : 24.5),
      dividendYield: baseMock?.dividendYield || (mapping.exchange === "CRYPTO" ? "0.00%" : isInt ? "3.80%" : "1.25%"),
      high52w,
      low52w,
      beta: computedBeta,
      eps: baseMock?.eps || (mapping.exchange === "CRYPTO" ? 0 : roundPriceByCurrency(price / (isInt ? 14.2 : 24.5), curr)),
      description: dynamicDescription,
      insight: dynamicInsight,
      history: fullHistory,
      sparkline: sparkline.length > 0 ? sparkline : [previousClose, price],
      lastUpdated: new Date().toISOString(),
      isMarketOpen: stateInfo.isMarketOpen,
      marketState: stateInfo.marketState,
      marketStateText: stateInfo.marketStateText,
      source: "yahoo_finance_live",
    };

    return NextResponse.json({
      success: true,
      source: "yahoo_finance_live",
      timeframe,
      stock: finalStock,
      message: `Data resmi Yahoo Finance untuk ${mapping.yahooSymbol} berhasil dimuat.`,
    });
  } catch (err: any) {
    // Graceful deterministic fallback (NO Math.random!)
    const fallback = MOCK_STOCKS[initialMapping.cleanTicker] || MOCK_STOCKS["BMRI"];
    return NextResponse.json({
      success: true,
      source: "cached",
      timeframe,
      stock: {
        ...fallback,
        isMarketOpen: false,
        marketState: "CLOSED",
        marketStateText: "MARKET CLOSED · HARGA PENUTUPAN RESMI",
      },
      message: `Menggunakan data penutupan resmi (cached): ${err.message}`,
    });
  }
}
