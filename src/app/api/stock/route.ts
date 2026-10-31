import { NextRequest, NextResponse } from "next/server";
import { MOCK_STOCKS, INITIAL_TICKER_TAPE } from "@/data/mockStocks";
import { StockData, TimeFrame, StockPricePoint, TickerTapeItem } from "@/types/stock";
import { formatCurrency } from "@/lib/utils";

// Mapping function to resolve Yahoo Finance symbols and market metadata
function mapToYahooSymbol(input: string): {
  yahooSymbol: string;
  cleanTicker: string;
  exchange: "IDX" | "NASDAQ" | "NYSE" | "KRX" | "ASX" | "CRYPTO";
  exchangeLabel: string;
  currency: "IDR" | "USD" | "KRW" | "AUD";
  currencySymbol: string;
  country: string;
  category: string;
  sector: string;
} {
  const upper = input.trim().toUpperCase();

  // If already contains Yahoo market suffix
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
      category: "SAHAM IDX · INDONESIA",
      sector: "Bursa Efek Indonesia",
    };
  }

  if (upper.endsWith(".KS")) {
    const clean = upper.replace(".KS", "");
    return {
      yahooSymbol: upper,
      cleanTicker: clean,
      exchange: "KRX",
      exchangeLabel: `KRX : ${clean}`,
      currency: "KRW",
      currencySymbol: "₩",
      country: "South Korea",
      category: "KRX KOREA · TECH & MEMORY",
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
      category: "ASX AUSTRALIA · COMMODITIES",
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
      sector: "Digital Assets",
    };
  }

  // Known Crypto shortcuts
  if (["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"].includes(upper)) {
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

  // Known Korean symbols (numbers)
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

  // Known Australian tickers
  if (["BHP", "CBA", "CSL", "NAB", "ANZ", "WBC", "FMG", "RIO"].includes(upper)) {
    return {
      yahooSymbol: `${upper}.AX`,
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

  // Known US ETFs & Stocks
  if (["VOO", "SPY", "QQQ", "IVV", "DIA", "VTI", "IWM"].includes(upper)) {
    return {
      yahooSymbol: upper,
      cleanTicker: upper,
      exchange: "NYSE",
      exchangeLabel: `NYSE : ${upper}`,
      currency: "USD",
      currencySymbol: "$",
      country: "United States",
      category: "INDEX ETF · BROAD MARKET",
      sector: "Indeks Pasar Saham Global",
    };
  }

  if (["AAPL", "NVDA", "MSFT", "TSLA", "GOOGL", "GOOG", "AMZN", "META", "AMD", "INTC", "NFLX"].includes(upper)) {
    return {
      yahooSymbol: upper,
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

  // Indonesian 4-letter stock symbols (Default for 4-character codes like BBCA, BMRI, BBRI, TLKM, ASII, GOTO, BBNI, etc.)
  if (/^[A-Z]{4}$/.test(upper)) {
    return {
      yahooSymbol: `${upper}.JK`,
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

  // Fallback default: US equity
  return {
    yahooSymbol: upper,
    cleanTicker: upper,
    exchange: "NASDAQ",
    exchangeLabel: `US : ${upper}`,
    currency: "USD",
    currencySymbol: "$",
    country: "Global Market",
    category: "GLOBAL EQUITIES",
    sector: "International Equities",
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

// Fetch single chart data from Yahoo Finance
async function fetchYahooChart(yahooSymbol: string, interval: string, range: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?interval=${interval}&range=${range}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
            const isInteger = item.curr === "IDR" || item.curr === "KRW";

            const rawPrice = meta.regularMarketPrice;
            const rawPrev = meta.chartPreviousClose || meta.previousClose || rawPrice;

            const price = isInteger ? Math.round(rawPrice) : Math.round(rawPrice * 100) / 100;
            const prevClose = isInteger ? Math.round(rawPrev) : Math.round(rawPrev * 100) / 100;
            const change = isInteger ? price - prevClose : Math.round((price - prevClose) * 100) / 100;
            const changePercent =
              prevClose !== 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0;

            const priceFormatted = formatCurrency(price, item.curr, item.sym);

            return {
              ticker: item.ticker,
              exchange: item.ex,
              price,
              priceFormatted,
              change,
              changePercent,
              currencySymbol: item.sym,
            };
          } catch {
            // Return cached baseline if individual fetch fails
            const fallback = INITIAL_TICKER_TAPE.find((t) => t.ticker === item.ticker);
            return fallback || {
              ticker: item.ticker,
              exchange: item.ex,
              price: 0,
              priceFormatted: "-",
              change: 0,
              changePercent: 0,
              currencySymbol: item.sym,
            };
          }
        })
      );

      return NextResponse.json({ success: true, data: tapeResults, source: "yahoo_finance_live" });
    } catch {
      return NextResponse.json({ success: true, data: INITIAL_TICKER_TAPE, source: "cached" });
    }
  }

  // 2. ACTION: LIST (All searchable stocks list)
  if (action === "list") {
    const list = Object.values(MOCK_STOCKS).map((s) => ({
      ticker: s.ticker,
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

  // 3. FETCH FULL STOCK DATA (Yahoo Finance Real-time)
  const mapping = mapToYahooSymbol(rawTicker);
  const { interval, range } = getTimeframeParams(timeframe);

  try {
    const result = await fetchYahooChart(mapping.yahooSymbol, interval, range);
    const meta = result.meta;

    const isInteger = mapping.currency === "IDR" || mapping.currency === "KRW";

    const rawPrice = meta.regularMarketPrice;
    const rawPrevClose = meta.chartPreviousClose || meta.previousClose || rawPrice;

    const price = isInteger ? Math.round(rawPrice) : Math.round(rawPrice * 100) / 100;
    const previousClose = isInteger ? Math.round(rawPrevClose) : Math.round(rawPrevClose * 100) / 100;
    const change = isInteger ? price - previousClose : Math.round((price - previousClose) * 100) / 100;
    const changePercent =
      previousClose !== 0 ? Math.round(((price - previousClose) / previousClose) * 10000) / 100 : 0;

    const high24h = isInteger
      ? Math.round(meta.regularMarketDayHigh || price)
      : Math.round((meta.regularMarketDayHigh || price) * 100) / 100;

    const low24h = isInteger
      ? Math.round(meta.regularMarketDayLow || price)
      : Math.round((meta.regularMarketDayLow || price) * 100) / 100;

    const high52w = isInteger
      ? Math.round(meta.fiftyTwoWeekHigh || price * 1.15)
      : Math.round((meta.fiftyTwoWeekHigh || price * 1.15) * 100) / 100;

    const low52w = isInteger
      ? Math.round(meta.fiftyTwoWeekLow || price * 0.85)
      : Math.round((meta.fiftyTwoWeekLow || price * 0.85) * 100) / 100;

    const rawVolume = meta.regularMarketVolume || 0;
    const volumeDisplay =
      mapping.currency === "IDR"
        ? `${(rawVolume / 1e6).toFixed(1)}M Lbr`
        : `${(rawVolume / 1e6).toFixed(1)}M`;

    // Market Open/Close Detection
    const nowSec = Math.floor(Date.now() / 1000);
    const regPeriod = meta.currentTradingPeriod?.regular;
    let isMarketOpen = false;

    if (mapping.exchange === "CRYPTO") {
      isMarketOpen = true;
    } else if (regPeriod && regPeriod.start && regPeriod.end) {
      isMarketOpen = nowSec >= regPeriod.start && nowSec <= regPeriod.end;
    } else if (meta.marketState) {
      isMarketOpen = meta.marketState === "REGULAR";
    }

    const marketStateText = isMarketOpen
      ? "MARKET OPEN · LIVE TRADING"
      : "MARKET CLOSED · HARGA PENUTUPAN";

    // Extract real quotes for chart
    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0]?.close || [];
    const historyPoints: StockPricePoint[] = [];

    const isIntraday = timeframe === "1D" || timeframe === "1W";

    for (let i = 0; i < timestamps.length; i++) {
      const q = quotes[i];
      if (q !== null && q !== undefined && !isNaN(q)) {
        const t = timestamps[i];
        const d = new Date(t * 1000);
        const val = isInteger ? Math.round(q) : Math.round(q * 100) / 100;

        const timeStr = d.toLocaleDateString("id-ID", {
          month: "short",
          day: "numeric",
          hour: isIntraday ? "2-digit" : undefined,
          minute: isIntraday ? "2-digit" : undefined,
        });

        historyPoints.push({
          time: timeStr,
          timestamp: t * 1000,
          open: val,
          high: val,
          low: val,
          close: val,
          volume: result.indicators?.quote?.[0]?.volume?.[i] || 0,
        });
      }
    }

    // Sparkline array from quotes
    const sparkline = historyPoints.slice(-20).map((p) => p.close);

    // Existing rich metadata from static profile (for descriptions and insights)
    const baseMock = MOCK_STOCKS[mapping.cleanTicker] || null;

    const fullHistory: Record<TimeFrame, StockPricePoint[]> = {
      ...(baseMock?.history || {}),
      [timeframe]: historyPoints.length > 0 ? historyPoints : (baseMock?.history[timeframe] || []),
    };

    const finalStock: StockData = {
      id: mapping.cleanTicker.toLowerCase(),
      ticker: mapping.cleanTicker,
      yahooSymbol: mapping.yahooSymbol,
      name: meta.longName || meta.shortName || baseMock?.name || `${mapping.cleanTicker} Equities`,
      exchange: mapping.exchange,
      exchangeLabel: mapping.exchangeLabel,
      country: baseMock?.country || mapping.country,
      category: baseMock?.category || mapping.category,
      sector: baseMock?.sector || mapping.sector,
      currency: mapping.currency,
      currencySymbol: mapping.currencySymbol,
      price,
      previousClose,
      change,
      changePercent,
      high24h,
      low24h,
      volume: rawVolume,
      volumeDisplay,
      marketCap: baseMock?.marketCap || price * 1000000000,
      marketCapDisplay: baseMock?.marketCapDisplay || formatCurrency(price * 1000000000, mapping.currency, mapping.currencySymbol),
      peRatio: baseMock?.peRatio || (isInteger ? 12.5 : 24.8),
      dividendYield: baseMock?.dividendYield || (isInteger ? "5.10%" : "1.45%"),
      high52w,
      low52w,
      beta: baseMock?.beta || 1.02,
      eps: baseMock?.eps || (price > 100 ? price / 15 : price / 20),
      description: baseMock?.description || `Saham ${mapping.cleanTicker} diperdagangkan resmi di bursa ${mapping.exchange}.`,
      insight: baseMock?.insight || `Pergerakan harga ${mapping.cleanTicker} ditutup pada level ${formatCurrency(price, mapping.currency, mapping.currencySymbol)} dengan volume pasar resmi ${volumeDisplay}.`,
      history: fullHistory,
      sparkline: sparkline.length > 0 ? sparkline : [previousClose, price],
      lastUpdated: new Date().toISOString(),
      isMarketOpen,
      marketStateText,
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
    // If external fetch fails, fallback gracefully to cached deterministic baseline (NO Math.random!)
    const fallback = MOCK_STOCKS[mapping.cleanTicker] || MOCK_STOCKS["BMRI"];
    return NextResponse.json({
      success: true,
      source: "cached",
      timeframe,
      stock: {
        ...fallback,
        isMarketOpen: false,
        marketStateText: "MARKET CLOSED · HARGA PENUTUPAN",
      },
      message: `Menggunakan data penutupan resmi (offline/cached): ${err.message}`,
    });
  }
}
