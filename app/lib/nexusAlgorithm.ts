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

export type NexusSignal = {
  asset: string;
  symbol: string;
  tf: string;
  price: number;
  ma20: number;
  ma50: number;
  ma200: number;
  trend: "UPTREND" | "DOWNTREND" | "SIDEWAY";
  bias: "Bull Bias" | "Bear Bias" | "Neutral" | "High Risk Chop";
  setup: "Continuation" | "Pullback Continuation" | "Breakout" | "Compression" | "No Setup";
  score: number;
  risk: "Low" | "Medium" | "High";
  updated_at: string;
  rules: NexusChecklistRule[];
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

export function buildNexusSignal(
  asset: NexusAsset,
  timeframe: NexusTimeframe,
  candles: NexusCandle[],
  updatedAt: string
): NexusSignal {
  const closes = candles.map((candle) => candle.close);
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

  let trend: NexusSignal["trend"] = "SIDEWAY";
  if (price > ma20 && ma20 > ma50 && ma50 > ma200) trend = "UPTREND";
  if (price < ma20 && ma20 < ma50 && ma50 < ma200) trend = "DOWNTREND";

  const isExtended = Math.abs(ma20Distance) > 7;
  const bias: NexusSignal["bias"] =
    trend === "UPTREND"
      ? isExtended
        ? "High Risk Chop"
        : "Bull Bias"
      : trend === "DOWNTREND"
        ? isExtended
          ? "High Risk Chop"
          : "Bear Bias"
        : "Neutral";

  const setup: NexusSignal["setup"] =
    trend === "SIDEWAY"
      ? bodyRatio < 0.35
        ? "Compression"
        : "No Setup"
      : Math.abs(ma20Distance) < 2.5
        ? "Pullback Continuation"
        : candleMomentum > 0 && trend === "UPTREND"
          ? "Continuation"
          : candleMomentum < 0 && trend === "DOWNTREND"
            ? "Continuation"
            : "No Setup";

  const trendStatus: NexusRuleStatus =
    trend === "UPTREND" || trend === "DOWNTREND" ? "pass" : "neutral";
  const positionStatus: NexusRuleStatus =
    price > ma20 && ma20 > ma50 ? "pass" : price < ma20 && ma20 < ma50 ? "fail" : "neutral";
  const momentumStatus: NexusRuleStatus =
    candleMomentum > 0 && trend === "UPTREND"
      ? "pass"
      : candleMomentum < 0 && trend === "DOWNTREND"
        ? "pass"
        : "neutral";
  const candleStatus: NexusRuleStatus = bodyRatio >= 0.45 ? "pass" : "warn";
  const riskStatus: NexusRuleStatus = isExtended ? "warn" : "pass";
  const freshnessStatus: NexusRuleStatus =
    Date.now() - new Date(updatedAt).getTime() < 60_000 ? "pass" : "warn";

  const rules: NexusChecklistRule[] = [
    {
      id: "trend_alignment",
      label: "Price and MA20/MA50/MA200 trend alignment",
      status: trendStatus,
      score: statusScore(trendStatus, 30),
      type: "auto",
    },
    {
      id: "ma_position",
      label: "Price position relative to MA20 and MA50",
      status: positionStatus,
      score: statusScore(positionStatus, 20),
      type: "auto",
    },
    {
      id: "momentum",
      label: "Latest candle momentum agrees with trend context",
      status: momentumStatus,
      score: statusScore(momentumStatus, 15),
      type: "auto",
    },
    {
      id: "candle_confirmation",
      label: "Latest candle has usable body confirmation",
      status: candleStatus,
      score: statusScore(candleStatus, 15),
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
      id: "freshness",
      label: "Market data updated recently",
      status: freshnessStatus,
      score: statusScore(freshnessStatus, 10),
      type: "auto",
    },
  ];

  const score = Math.min(100, rules.reduce((sum, rule) => sum + rule.score, 0));

  return {
    asset: asset.symbol,
    symbol: asset.binanceSymbol || asset.symbol,
    tf: timeframe.label,
    price,
    ma20,
    ma50,
    ma200,
    trend,
    bias,
    setup,
    score,
    risk: isExtended ? "High" : trend === "SIDEWAY" ? "Medium" : "Low",
    updated_at: updatedAt,
    rules,
  };
}
