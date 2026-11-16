import { StockPricePoint, IndicatorPoint, RSIResult, RSISignal } from "@/types/stock";

/**
 * Normalizes and sorts price points strictly ascending by UNIX seconds
 */
function normalizeSeries(
  data: StockPricePoint[]
): Array<StockPricePoint & { sec: number }> {
  if (!Array.isArray(data) || data.length === 0) return [];

  const mapBySec = new Map<number, StockPricePoint & { sec: number }>();

  for (const pt of data) {
    if (pt && Number.isFinite(pt.timestamp) && Number.isFinite(pt.close)) {
      const sec = Math.floor(pt.timestamp / 1000);
      mapBySec.set(sec, {
        ...pt,
        sec,
      });
    }
  }

  return Array.from(mapBySec.values()).sort((a, b) => a.sec - b.sec);
}

/**
 * Pure function to calculate Simple Moving Average (SMA)
 * @param data Array of StockPricePoint
 * @param period Moving average window length (default: 20)
 */
export function calculateSMA(
  data: StockPricePoint[],
  period: number = 20
): IndicatorPoint[] {
  const sorted = normalizeSeries(data);
  if (sorted.length === 0) return [];

  const safePeriod = Math.max(1, Math.floor(period));
  const result: IndicatorPoint[] = [];
  let runningSum = 0;

  for (let i = 0; i < sorted.length; i++) {
    runningSum += sorted[i].close;

    if (i >= safePeriod) {
      runningSum -= sorted[i - safePeriod].close;
    }

    const windowCount = Math.min(i + 1, safePeriod);
    const avg = runningSum / windowCount;

    result.push({
      time: sorted[i].sec,
      timestamp: sorted[i].timestamp,
      value: Number(avg.toFixed(4)),
    });
  }

  return result;
}

/**
 * Pure function to calculate Exponential Moving Average (EMA)
 * @param data Array of StockPricePoint
 * @param period EMA smoothing period (default: 50)
 */
export function calculateEMA(
  data: StockPricePoint[],
  period: number = 50
): IndicatorPoint[] {
  const sorted = normalizeSeries(data);
  if (sorted.length === 0) return [];

  const safePeriod = Math.max(1, Math.floor(period));
  const k = 2 / (safePeriod + 1);
  const result: IndicatorPoint[] = [];

  let ema = sorted[0].close;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      ema = sorted[0].close;
    } else {
      ema = sorted[i].close * k + ema * (1 - k);
    }

    result.push({
      time: sorted[i].sec,
      timestamp: sorted[i].timestamp,
      value: Number(ema.toFixed(4)),
    });
  }

  return result;
}

/**
 * Pure function to classify RSI value into a signal state
 */
export function getRSISignal(rsiValue: number): RSISignal {
  if (rsiValue > 70) return "Overbought";
  if (rsiValue < 30) return "Oversold";
  return "Neutral";
}

/**
 * Pure function to calculate Relative Strength Index (RSI) using Wilder's smoothing
 * @param data Array of StockPricePoint
 * @param period Lookback period (default: 14)
 */
export function calculateRSI(
  data: StockPricePoint[],
  period: number = 14
): RSIResult {
  const sorted = normalizeSeries(data);
  if (sorted.length < 2) {
    return {
      value: 50,
      signal: "Neutral",
      series: [],
    };
  }

  const safePeriod = Math.max(1, Math.floor(period));
  const series: IndicatorPoint[] = [];

  let avgGain = 0;
  let avgLoss = 0;
  const initWindow = Math.min(safePeriod, sorted.length - 1);

  // Initial window average gain & loss
  for (let i = 1; i <= initWindow; i++) {
    const delta = sorted[i].close - sorted[i - 1].close;
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    avgGain += gain;
    avgLoss += loss;

    const currentAvgGain = avgGain / i;
    const currentAvgLoss = avgLoss / i;
    const rsiVal = computeRSIFromAverages(currentAvgGain, currentAvgLoss);

    series.push({
      time: sorted[i].sec,
      timestamp: sorted[i].timestamp,
      value: rsiVal,
    });
  }

  avgGain /= initWindow;
  avgLoss /= initWindow;

  // Wilder's smoothing for remaining bars
  for (let i = initWindow + 1; i < sorted.length; i++) {
    const delta = sorted[i].close - sorted[i - 1].close;
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    avgGain = (avgGain * (safePeriod - 1) + gain) / safePeriod;
    avgLoss = (avgLoss * (safePeriod - 1) + loss) / safePeriod;

    const rsiVal = computeRSIFromAverages(avgGain, avgLoss);

    series.push({
      time: sorted[i].sec,
      timestamp: sorted[i].timestamp,
      value: rsiVal,
    });
  }

  const latestRSI =
    series.length > 0 ? series[series.length - 1].value : 50;
  const roundedRSI = Math.round(latestRSI * 10) / 10;

  return {
    value: roundedRSI,
    signal: getRSISignal(roundedRSI),
    series,
  };
}

function computeRSIFromAverages(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0 && avgGain === 0) return 50;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Math.max(0, Math.min(100, Number(rsi.toFixed(2))));
}

export interface TechnicalMomentumSummary {
  latestSMA20: number;
  latestEMA50: number;
  trendBias: "Bullish" | "Bearish" | "Sideways";
  avgVolume: number;
  latestVolume: number;
  volumeRatio: number;
}

/**
 * Pure function to summarize technical momentum & volume activity
 */
export function summarizeTechnicalMomentum(
  data: StockPricePoint[],
  sma20: IndicatorPoint[],
  ema50: IndicatorPoint[]
): TechnicalMomentumSummary {
  const sorted = normalizeSeries(data);
  if (sorted.length === 0) {
    return {
      latestSMA20: 0,
      latestEMA50: 0,
      trendBias: "Sideways",
      avgVolume: 0,
      latestVolume: 0,
      volumeRatio: 1,
    };
  }

  const latestClose = sorted[sorted.length - 1].close;
  const latestSMA20 =
    sma20.length > 0 ? sma20[sma20.length - 1].value : latestClose;
  const latestEMA50 =
    ema50.length > 0 ? ema50[ema50.length - 1].value : latestClose;

  let trendBias: "Bullish" | "Bearish" | "Sideways" = "Sideways";
  if (latestClose > latestSMA20 && latestSMA20 >= latestEMA50 * 0.998) {
    trendBias = "Bullish";
  } else if (latestClose < latestSMA20 && latestSMA20 <= latestEMA50 * 1.002) {
    trendBias = "Bearish";
  }

  const volumes = sorted.map((d) => (Number.isFinite(d.volume) && d.volume > 0 ? d.volume : 0));
  const totalVol = volumes.reduce((acc, v) => acc + v, 0);
  const avgVolume = volumes.length > 0 ? totalVol / volumes.length : 0;
  const latestVolume = volumes.length > 0 ? volumes[volumes.length - 1] : 0;
  const volumeRatio = avgVolume > 0 ? latestVolume / avgVolume : 1;

  return {
    latestSMA20,
    latestEMA50,
    trendBias,
    avgVolume,
    latestVolume,
    volumeRatio: Number(volumeRatio.toFixed(2)),
  };
}
