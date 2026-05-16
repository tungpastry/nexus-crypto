import type { NexusSignal } from "../nexusAlgorithm";

export type MarketContextPayload = {
  ok: boolean;
  context_type: "market_snapshot";
  updated_at: string;
  cache?: {
    status?: "hit" | "miss" | "stale";
    age_ms?: number;
  };
  global: {
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    btc_dominance: number | null;
    eth_dominance: number | null;
  };
  top_assets: Array<{
    id: string;
    symbol: string;
    name: string;
    rank: number;
    category: string;
    price: number | null;
    change_24h: number | null;
    change_7d: number | null;
    mode: "nexus" | "market-only";
  }>;
  disclaimer: string;
};

export type AssetAnalysisSuccessPayload = {
  ok: true;
  context_type: "asset_analysis";
  mode: "nexus";
  analysis_enabled: true;
  updated_at: string;
  asset: {
    id: string;
    symbol: string;
    name: string;
    binance_symbol: string;
  };
  timeframe: {
    label: string;
    binance: string;
  };
  latest_price: number;
  signal: NexusSignal;
  rules_summary: {
    pass: number;
    warn: number;
    fail: number;
    neutral: number;
  };
};

export type AssetAnalysisMarketOnlyPayload = {
  ok: true;
  context_type: "asset_analysis";
  mode: "market-only";
  analysis_enabled: false;
  asset: {
    id: string;
    symbol: string;
  };
  timeframe: {
    label: string;
    binance: string;
  };
  reason: string;
};

export type AssetAnalysisPayload =
  | AssetAnalysisSuccessPayload
  | AssetAnalysisMarketOnlyPayload;
