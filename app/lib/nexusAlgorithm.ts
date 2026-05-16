import type { NexusAsset } from "../config/assets";
import type { NexusTimeframe } from "../config/timeframes";
import type { NexusCandle } from "./binance";

export type NexusRuleStatus = "pass" | "warn" | "fail" | "neutral";
export type NexusRuleType = "auto" | "hybrid" | "manual";

export type NexusChecklistRule = {
  id: string;
  label: string;
  status: NexusRuleStatus;
  score: number;
  type: NexusRuleType;
};

export type NexusSignalState = "No Trade" | "Watch" | "Ready" | "Confirmed";
export type NexusVolatilityRegime = "Low" | "Normal" | "High" | "Unknown";
export type NexusContextDirection =
  | "near_support"
  | "near_resistance"
  | "midrange"
  | "unknown";

export type NexusSignal = {
  asset: string;
  symbol: string;
  tf: string;
  price: number;
  ma20: number;
  ma50: number;
  ma200: number;
  direction: "bull" | "bear" | "neutral";
  trend: "UPTREND" | "DOWNTREND" | "SIDEWAY";
  bias: "Bull Bias" | "Bear Bias" | "Neutral" | "High Risk Chop";
  setup:
    | "Continuation"
    | "Pullback Continuation"
    | "Breakout"
    | "Compression"
    | "No Setup";
  score: number;
  risk: "Low" | "Medium" | "High";
  state: NexusSignalState;
  atr14: number;
  atrPercent: number;
  volatility: NexusVolatilityRegime;
  volumeRatio: number;
  volumeConfirmation: NexusRuleStatus;
  multiTimeframeAgreement: NexusRuleStatus;
  supportResistance: {
    nearestSupport: number;
    nearestResistance: number;
    position: NexusContextDirection;
    rangePercent: number;
  };
  updated_at: string;
  rules: NexusChecklistRule[];
};

export type NexusSignalBuildOptions = {
  higherTimeframeSignal?: {
    direction: NexusSignal["direction"];
    trend: NexusSignal["trend"];
  };
  higherTimeframeDirection?: NexusSignal["direction"];
};

function sma(values: number[], period: number) {
  if (values.length < period) return 0;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function pctDistance(price: number, basis: number) {
  if (!basis) return 0;
  return ((price - basis) / basis) * 100;
}

function statusScore(status: NexusRuleStatus, max: number) {
  if (status === "pass") return max;
  if (status === "warn" || status === "neutral") return Math.round(max * 0.5);
  return 0;
}

function calculateAtr14(candles: NexusCandle[]) {
  if (candles.length < 15) return 0;
  const trueRanges: number[] = [];

  for (let index = 1; index < candles.length; index += 1) {
    const current = candles[index];
    const previousClose = candles[index - 1].close;
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previousClose),
      Math.abs(current.low - previousClose)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < 14) return 0;
  return sma(trueRanges, 14);
}

function getVolatilityRegime(
  atrPercent: number,
  price: number
): NexusVolatilityRegime {
  if (!Number.isFinite(atrPercent) || atrPercent <= 0 || price <= 0) {
    return "Unknown";
  }
  if (atrPercent < 1) return "Low";
  if (atrPercent <= 4) return "Normal";
  return "High";
}

function supportResistanceContext(candles: NexusCandle[], price: number, atr14: number) {
  const window = candles.slice(-50);
  if (!window.length || price <= 0) {
    return {
      nearestSupport: 0,
      nearestResistance: 0,
      position: "unknown" as NexusContextDirection,
      rangePercent: 0,
    };
  }

  const lows = window.map((item) => item.low);
  const highs = window.map((item) => item.high);
  const nearestSupport = Math.min(...lows);
  const nearestResistance = Math.max(...highs);

  if (!Number.isFinite(nearestSupport) || !Number.isFinite(nearestResistance)) {
    return {
      nearestSupport: 0,
      nearestResistance: 0,
      position: "unknown" as NexusContextDirection,
      rangePercent: 0,
    };
  }

  const rangePercent =
    nearestResistance > nearestSupport
      ? ((nearestResistance - nearestSupport) / price) * 100
      : 0;

  const nearThresholdPct = 1.5;
  const supportDistance = Math.abs(((price - nearestSupport) / price) * 100);
  const resistanceDistance = Math.abs(
    ((nearestResistance - price) / price) * 100
  );
  const nearSupport =
    supportDistance <= nearThresholdPct ||
    (atr14 > 0 && Math.abs(price - nearestSupport) <= atr14);
  const nearResistance =
    resistanceDistance <= nearThresholdPct ||
    (atr14 > 0 && Math.abs(nearestResistance - price) <= atr14);

  let position: NexusContextDirection = "midrange";
  if (nearSupport && !nearResistance) position = "near_support";
  if (nearResistance && !nearSupport) position = "near_resistance";

  return {
    nearestSupport,
    nearestResistance,
    position,
    rangePercent: Math.max(rangePercent, 0),
  };
}

export function buildNexusSignal(
  asset: NexusAsset,
  timeframe: NexusTimeframe,
  candles: NexusCandle[],
  updatedAt: string,
  options?: NexusSignalBuildOptions
): NexusSignal {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const latest = candles.at(-1);
  const previous = candles.at(-2);
  const price = latest?.close ?? 0;
  const ma20 = sma(closes, 20);
  const ma50 = sma(closes, 50);
  const ma200 = sma(closes, 200);
  const ma20Distance = pctDistance(price, ma20);
  const candleMomentum = latest && previous ? latest.close - previous.close : 0;
  const candleRange = latest ? Math.max(latest.high - latest.low, 0) : 0;
  const candleBody = latest ? Math.abs(latest.close - latest.open) : 0;
  const bodyRatio = candleRange ? candleBody / candleRange : 0;

  const hasMovingAverages = ma20 > 0 && ma50 > 0 && ma200 > 0;
  const isBullAligned = hasMovingAverages && price > ma20 && ma20 > ma50 && ma50 > ma200;
  const isBearAligned = hasMovingAverages && price < ma20 && ma20 < ma50 && ma50 < ma200;
  const direction: NexusSignal["direction"] = isBullAligned
    ? "bull"
    : isBearAligned
      ? "bear"
      : "neutral";
  const momentumAligned =
    (direction === "bull" && candleMomentum > 0) ||
    (direction === "bear" && candleMomentum < 0);

  let trend: NexusSignal["trend"] = "SIDEWAY";
  if (direction === "bull") trend = "UPTREND";
  if (direction === "bear") trend = "DOWNTREND";

  const atr14 = calculateAtr14(candles);
  const atrPercent = price > 0 && atr14 > 0 ? (atr14 / price) * 100 : 0;
  const volatility = getVolatilityRegime(atrPercent, price);

  const isExtended = Math.abs(ma20Distance) > 7;
  const bias: NexusSignal["bias"] = isExtended
    ? "High Risk Chop"
    : direction === "bull"
      ? "Bull Bias"
      : direction === "bear"
        ? "Bear Bias"
        : "Neutral";

  const setup: NexusSignal["setup"] =
    direction === "neutral"
      ? bodyRatio < 0.35
        ? "Compression"
        : "No Setup"
      : Math.abs(ma20Distance) < 2.5
        ? "Pullback Continuation"
        : momentumAligned
          ? "Continuation"
          : "No Setup";

  const risk: NexusSignal["risk"] = isExtended
    ? "High"
    : direction === "neutral"
      ? "Medium"
      : "Low";

  const avgVolume20 = sma(volumes, 20);
  const latestVolume = latest?.volume ?? 0;
  const volumeRatio = avgVolume20 > 0 ? latestVolume / avgVolume20 : 0;
  const volumeConfirmation: NexusRuleStatus =
    direction === "neutral" || avgVolume20 <= 0
      ? "neutral"
      : volumeRatio >= 1.05
        ? "pass"
        : volumeRatio >= 0.8
          ? "warn"
          : "fail";

  const higherDirection =
    options?.higherTimeframeSignal?.direction ??
    options?.higherTimeframeDirection;

  const multiTimeframeAgreement: NexusRuleStatus =
    !higherDirection
      ? "neutral"
      : direction === "neutral" || higherDirection === "neutral"
        ? "warn"
        : higherDirection === direction
          ? "pass"
          : "fail";

  const supportResistance = supportResistanceContext(candles, price, atr14);
  const supportResistanceStatus: NexusRuleStatus =
    direction === "neutral" || supportResistance.position === "unknown"
      ? "neutral"
      : direction === "bull" && supportResistance.position === "near_support"
        ? "pass"
        : direction === "bear" && supportResistance.position === "near_resistance"
          ? "pass"
          : supportResistance.position === "midrange"
            ? "warn"
            : "fail";

  const trendStatus: NexusRuleStatus =
    direction === "bull" || direction === "bear" ? "pass" : "neutral";
  const positionStatus: NexusRuleStatus =
    direction === "neutral" ? "neutral" : "pass";
  const momentumStatus: NexusRuleStatus =
    direction === "neutral" ? "neutral" : momentumAligned ? "pass" : "neutral";
  const candleStatus: NexusRuleStatus = bodyRatio >= 0.45 ? "pass" : "warn";
  const riskStatus: NexusRuleStatus = isExtended ? "warn" : "pass";
  const volatilityStatus: NexusRuleStatus =
    volatility === "Normal"
      ? "pass"
      : volatility === "Low"
        ? "warn"
        : volatility === "High"
          ? "fail"
          : "neutral";
  const freshnessStatus: NexusRuleStatus =
    Date.now() - new Date(updatedAt).getTime() < 60_000 ? "pass" : "warn";

  const rules: NexusChecklistRule[] = [
    {
      id: "trend_alignment",
      label: "Price and MA20/MA50/MA200 trend alignment",
      status: trendStatus,
      score: statusScore(trendStatus, 20),
      type: "auto",
    },
    {
      id: "ma_position",
      label: "Directional MA position supports bull/bear context",
      status: positionStatus,
      score: statusScore(positionStatus, 15),
      type: "auto",
    },
    {
      id: "momentum",
      label: "Latest candle momentum agrees with trend context",
      status: momentumStatus,
      score: statusScore(momentumStatus, 12),
      type: "auto",
    },
    {
      id: "candle_confirmation",
      label: "Latest candle has usable body confirmation",
      status: candleStatus,
      score: statusScore(candleStatus, 10),
      type: "hybrid",
    },
    {
      id: "risk_context",
      label: "Price is not overextended from MA20",
      status: riskStatus,
      score: statusScore(riskStatus, 10),
      type: "auto",
    },
    {
      id: "volatility_atr",
      label: "ATR volatility is inside usable range",
      status: volatilityStatus,
      score: statusScore(volatilityStatus, 10),
      type: "auto",
    },
    {
      id: "volume_confirmation",
      label: "Volume confirms current market context",
      status: volumeConfirmation,
      score: statusScore(volumeConfirmation, 8),
      type: "hybrid",
    },
    {
      id: "support_resistance_context",
      label: "Price location has clear support/resistance context",
      status: supportResistanceStatus,
      score: statusScore(supportResistanceStatus, 8),
      type: "hybrid",
    },
    {
      id: "multi_timeframe_agreement",
      label: "Higher timeframe context agrees or is neutral",
      status: multiTimeframeAgreement,
      score: statusScore(multiTimeframeAgreement, 4),
      type: "auto",
    },
    {
      id: "freshness",
      label: "Market data updated recently",
      status: freshnessStatus,
      score: statusScore(freshnessStatus, 3),
      type: "auto",
    },
  ];

  const score = Math.min(100, rules.reduce((sum, rule) => sum + rule.score, 0));
  const isNoTrade =
    score < 45 || risk === "High" || (volatility === "High" && setup === "No Setup");
  const isConfirmed =
    score >= 80 &&
    direction !== "neutral" &&
    momentumStatus === "pass" &&
    (volumeConfirmation === "pass" || volumeConfirmation === "warn") &&
    risk !== "High" &&
    volatility !== "High";
  const isReady =
    score >= 65 && direction !== "neutral" && risk !== "High" && setup !== "No Setup";

  const state: NexusSignalState = isNoTrade
    ? "No Trade"
    : isConfirmed
      ? "Confirmed"
      : isReady
        ? "Ready"
        : "Watch";

  return {
    asset: asset.symbol,
    symbol: asset.binanceSymbol || asset.symbol,
    tf: timeframe.label,
    price,
    ma20,
    ma50,
    ma200,
    direction,
    trend,
    bias,
    setup,
    score,
    risk,
    state,
    atr14,
    atrPercent,
    volatility,
    volumeRatio,
    volumeConfirmation,
    multiTimeframeAgreement,
    supportResistance,
    updated_at: updatedAt,
    rules,
  };
}
