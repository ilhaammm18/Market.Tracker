import { NextRequest, NextResponse } from "next/server";
import { SearchQuoteItem, StockNewsItem } from "@/types/stock";
import { MOCK_STOCKS } from "@/data/mockStocks";

export const dynamic = "force-dynamic";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchYahooSearch(query: string, quotesCount = 12, newsCount = 5) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=${quotesCount}&newsCount=${newsCount}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Search HTTP ${res.status}`);
  }

  return res.json();
}

function formatPublishTime(unixSeconds?: number): string {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) {
    return "Baru saja";
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = Math.max(0, nowSec - unixSeconds);

  const dateObj = new Date(unixSeconds * 1000);
  const dateFormatted = dateObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `${mins} menit lalu · ${dateFormatted}`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} jam lalu · ${dateFormatted}`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days <= 7) {
    return `${days} hari lalu · ${dateFormatted}`;
  }
  return dateFormatted;
}

function mapRawQuote(q: any): SearchQuoteItem | null {
  if (!q || !q.symbol) return null;
  const symbol = String(q.symbol).toUpperCase();
  const exchange = String(q.exchange || "").toUpperCase();
  const exchDisp = String(q.exchDisp || q.exchange || "GLOBAL");
  const quoteType = String(q.quoteType || "EQUITY").toUpperCase();

  // Filter out options or futures noise if needed, keep EQUITY, ETF, CRYPTOCURRENCY, INDEX, MUTUALFUND
  if (["OPTION", "FUTURE", "CURRENCY"].includes(quoteType) && !symbol.endsWith("-USD")) {
    return null;
  }

  const isIdx = symbol.endsWith(".JK") || exchange === "JKT" || exchDisp.toUpperCase().includes("JAKARTA");
  const cleanTicker = symbol.replace(/\.(JK|KS|KQ|AX)$/, "").replace(/-USD$/, "");

  const resolvedExchange = isIdx
    ? "IDX"
    : symbol.endsWith(".KS") || symbol.endsWith(".KQ") || exchange === "KSC" || exchange === "KOE"
    ? "KRX"
    : symbol.endsWith(".AX") || exchange === "ASX"
    ? "ASX"
    : quoteType === "CRYPTOCURRENCY" || symbol.endsWith("-USD")
    ? "CRYPTO"
    : exchange === "NMS" || exchange === "NGM" || exchange === "NCM"
    ? "NASDAQ"
    : exchange === "NYQ" || exchange === "PCX" || exchange === "ASE"
    ? "NYSE"
    : exchDisp;

  return {
    symbol,
    cleanTicker,
    shortName: q.shortname || q.longname || symbol,
    longName: q.longname || q.shortname || symbol,
    exchange: resolvedExchange,
    exchangeDisplay: isIdx ? "BEI / IDX (Indonesia)" : exchDisp,
    quoteType,
    sector: q.sectorDisp || q.sector || undefined,
    industry: q.industryDisp || q.industry || undefined,
    isIdx,
  };
}

function mapRawNews(n: any): StockNewsItem | null {
  if (!n || !n.title || !n.link) return null;
  const resolutions = n.thumbnail?.resolutions || [];
  const bestThumb =
    resolutions.find((r: any) => r.width >= 300)?.url ||
    resolutions[0]?.url ||
    undefined;

  const pubTime = Number(n.providerPublishTime) || Math.floor(Date.now() / 1000);

  return {
    uuid: String(n.uuid || n.link),
    title: String(n.title),
    publisher: String(n.publisher || "Yahoo Finance"),
    link: String(n.link),
    providerPublishTime: pubTime,
    publishedAtText: formatPublishTime(pubTime),
    type: String(n.type || "STORY"),
    thumbnailUrl: bestThumb,
    relatedTickers: Array.isArray(n.relatedTickers) ? n.relatedTickers : [],
  };
}

export async function GET(request: NextRequest) {
  const rawQuery = (request.nextUrl.searchParams.get("q") || "").trim();

  if (!rawQuery) {
    // Return default presets when query is empty
    const defaultQuotes: SearchQuoteItem[] = Object.values(MOCK_STOCKS).map((s) => ({
      symbol: s.yahooSymbol,
      cleanTicker: s.ticker,
      shortName: s.name,
      longName: s.name,
      exchange: s.exchange,
      exchangeDisplay: s.exchangeLabel,
      quoteType: s.exchange === "CRYPTO" ? "CRYPTOCURRENCY" : s.category.includes("ETF") ? "ETF" : "EQUITY",
      sector: s.sector,
      isIdx: s.exchange === "IDX",
    }));

    return NextResponse.json({
      success: true,
      query: "",
      quotes: defaultQuotes,
      news: [],
    });
  }

  const isFourLetterCode = /^[a-zA-Z]{4}$/.test(rawQuery);
  const isIdxSymbolQuery = rawQuery.toUpperCase().endsWith(".JK");
  const cleanIdxBase = isIdxSymbolQuery ? rawQuery.slice(0, -3) : rawQuery;

  try {
    // Build parallel queries:
    // - If 4-letter code (e.g., BBRI, BMRI, ANTM, BREN, TLKM, ADRO, GOTO, ASII), search both "${Q}.JK" and "${Q}" in parallel!
    // - If already ends with ".JK" (e.g., fetching news for BBCA.JK), also search "${cleanBase} Indonesia stock" in parallel for richer news!
    const queriesToRun: string[] = [];
    if (isFourLetterCode) {
      queriesToRun.push(`${rawQuery.toUpperCase()}.JK`);
      queriesToRun.push(rawQuery);
    } else if (isIdxSymbolQuery) {
      queriesToRun.push(rawQuery.toUpperCase());
      const knownMock = MOCK_STOCKS[cleanIdxBase.toUpperCase()];
      queriesToRun.push(knownMock ? knownMock.name : `${cleanIdxBase} Indonesia`);
    } else {
      queriesToRun.push(rawQuery);
    }

    const responses = await Promise.allSettled(
      queriesToRun.map((qStr) => fetchYahooSearch(qStr, 12, 5))
    );

    const mergedQuotes: SearchQuoteItem[] = [];
    const seenSymbols = new Set<string>();

    const mergedNews: StockNewsItem[] = [];
    const seenNewsIds = new Set<string>();

    for (const res of responses) {
      if (res.status === "fulfilled" && res.value) {
        const rawQuotes = Array.isArray(res.value.quotes) ? res.value.quotes : [];
        for (const rq of rawQuotes) {
          const mapped = mapRawQuote(rq);
          if (mapped && !seenSymbols.has(mapped.symbol)) {
            seenSymbols.add(mapped.symbol);
            mergedQuotes.push(mapped);
          }
        }

        const rawNews = Array.isArray(res.value.news) ? res.value.news : [];
        for (const rn of rawNews) {
          const mappedN = mapRawNews(rn);
          if (mappedN && !seenNewsIds.has(mappedN.uuid) && !seenNewsIds.has(mappedN.title)) {
            seenNewsIds.add(mappedN.uuid);
            seenNewsIds.add(mappedN.title);
            mergedNews.push(mappedN);
          }
        }
      }
    }

    // Prioritize IDX (.JK) stocks at the very top when searching 4-letter codes or Indonesian tickers
    mergedQuotes.sort((a, b) => {
      if (isFourLetterCode || isIdxSymbolQuery) {
        if (a.isIdx && !b.isIdx) return -1;
        if (!a.isIdx && b.isIdx) return 1;
        // Exact match with .JK first
        const targetJk = `${cleanIdxBase.toUpperCase()}.JK`;
        if (a.symbol === targetJk && b.symbol !== targetJk) return -1;
        if (b.symbol === targetJk && a.symbol !== targetJk) return 1;
      }
      return 0;
    });

    // Sort news by publish time descending
    mergedNews.sort((a, b) => b.providerPublishTime - a.providerPublishTime);

    return NextResponse.json({
      success: true,
      query: rawQuery,
      quotes: mergedQuotes.slice(0, 15),
      news: mergedNews.slice(0, 8),
    });
  } catch (err: any) {
    // Fallback local search if offline
    const qLower = rawQuery.toLowerCase();
    const fallbackQuotes: SearchQuoteItem[] = Object.values(MOCK_STOCKS)
      .filter(
        (s) =>
          s.ticker.toLowerCase().includes(qLower) ||
          s.name.toLowerCase().includes(qLower) ||
          s.yahooSymbol.toLowerCase().includes(qLower)
      )
      .map((s) => ({
        symbol: s.yahooSymbol,
        cleanTicker: s.ticker,
        shortName: s.name,
        longName: s.name,
        exchange: s.exchange,
        exchangeDisplay: s.exchangeLabel,
        quoteType: "EQUITY",
        sector: s.sector,
        isIdx: s.exchange === "IDX",
      }));

    return NextResponse.json({
      success: true,
      query: rawQuery,
      quotes: fallbackQuotes,
      news: [],
      message: err?.message || "Offline search fallback",
    });
  }
}
