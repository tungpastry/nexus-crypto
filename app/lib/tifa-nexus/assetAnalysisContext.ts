import { findAssetById } from "../../config/assets";
import {
  NEXUS_TIMEFRAMES,
  findTimeframeByBinance,
  findTimeframeByLabel,
} from "../../config/timeframes";
import { getCryptoKlines, getCryptoPrice } from "../binance";
import { buildNexusSignal } from "../nexusAlgorithm";
import { getCachedOrFetch } from "../serverCache";
import type { AssetAnalysisPayload } from "./types";

const PRICE_CACHE_TTL_MS = 5_000;
const KLINES_CACHE_TTL_MS = 60_000;

function resolveTimeframe(value: string | undefined) {
  if (!value) return NEXUS_TIMEFRAMES[2];
  return findTimeframeByLabel(value) || findTimeframeByBinance(value) || NEXUS_TIMEFRAMES[2];
}

export async function getAssetAnalysisContext(
  assetId: string | undefined,
  timeframeInput: string | undefined
): Promise<AssetAnalysisPayload> {
  if (!assetId) {
    throw new Error("assetId is required");
  }

  const asset = findAssetById(assetId);
  if (!asset) {
    throw new Error(`Unsupported assetId: ${assetId}`);
  }

  const timeframe = resolveTimeframe(timeframeInput);

  if (!asset.enableChecklist || !asset.binanceSymbol) {
    return {
      ok: true,
      context_type: "asset_analysis",
      mode: "market-only",
      analysis_enabled: false,
      asset: {
        id: asset.id,
        symbol: asset.symbol,
      },
      timeframe: {
        label: timeframe.label,
        binance: timeframe.binance,
      },
      reason: `${asset.symbol} is configured as a stablecoin market-only asset. Nexus MA/checklist analysis is disabled.`,
    };
  }

  const [pricePayload, klinesPayload] = await Promise.all([
    getCachedOrFetch({
      key: `tifa:price:${asset.binanceSymbol}`,
      ttlMs: PRICE_CACHE_TTL_MS,
      fetcher: () => getCryptoPrice(asset.binanceSymbol as string),
      staleErrorCode: "PRICE_PROVIDER_STALE",
    }),
    getCachedOrFetch({
      key: `tifa:klines:${asset.binanceSymbol}:${timeframe.binance}:400`,
      ttlMs: KLINES_CACHE_TTL_MS,
      fetcher: () => getCryptoKlines(asset.binanceSymbol as string, timeframe.binance, 400),
      staleErrorCode: "KLINES_PROVIDER_STALE",
    }),
  ]);

  const latestPrice = Number.parseFloat(String(pricePayload.price));
  const signal = buildNexusSignal(
    asset,
    timeframe,
    klinesPayload.candles,
    klinesPayload.updated_at
  );

  const rulesSummary = signal.rules.reduce(
    (acc, rule) => {
      acc[rule.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, neutral: 0 }
  );

  return {
    ok: true,
    context_type: "asset_analysis",
    mode: "nexus",
    analysis_enabled: true,
    updated_at: signal.updated_at,
    asset: {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      binance_symbol: asset.binanceSymbol,
    },
    timeframe: {
      label: timeframe.label,
      binance: timeframe.binance,
    },
    latest_price: Number.isFinite(latestPrice) ? latestPrice : signal.price,
    signal,
    rules_summary: rulesSummary,
  };
}
