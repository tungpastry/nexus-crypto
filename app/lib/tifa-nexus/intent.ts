import type { TifaIntent, TifaPageContext } from "../tifa-core/types";

const ASSET_KEYWORDS = [
  "asset",
  "btc",
  "eth",
  "sol",
  "doge",
  "trend",
  "score",
  "rule",
  "atr",
  "volatility",
  "setup",
  "bias",
  "btc",
  "eth",
  "sol",
  "doge",
];

const MARKET_KEYWORDS = [
  "market",
  "snapshot",
  "dominance",
  "top 10",
  "watchlist",
  "volume",
  "market cap",
];

const BUDGET_KEYWORDS = [
  "budget",
  "gemini",
  "cost",
  "token",
  "spend",
  "hard stop",
  "degrade",
];

const PROVIDER_HEALTH_KEYWORDS = [
  "provider health",
  "provider status",
  "health check",
  "readiness",
];
const DEEP_HEALTH_KEYWORDS = [
  "deep health",
  "multi-asset",
  "deep diagnostics",
  "deep check",
];
const OPS_SUMMARY_KEYWORDS = [
  "ops summary",
  "executive summary",
  "ops center",
  "operations summary",
];
const SYSTEM_EXPLAIN_KEYWORDS = [
  "system explain",
  "how tifa works",
  "stream fallback",
  "circuit breaker",
  "tool orchestration",
];
const STABLECOIN_KEYWORDS = [
  "stablecoin",
  "usdt",
  "usdc",
  "tether",
  "usd coin",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function resolveTifaIntent(
  message: string,
  context?: TifaPageContext
): TifaIntent {
  const text = message.toLowerCase();

  if (includesAny(text, BUDGET_KEYWORDS)) return "budget_status";
  if (includesAny(text, OPS_SUMMARY_KEYWORDS)) return "ops_summary";
  if (includesAny(text, DEEP_HEALTH_KEYWORDS)) return "deep_health";
  if (includesAny(text, PROVIDER_HEALTH_KEYWORDS)) return "provider_health";
  if (includesAny(text, SYSTEM_EXPLAIN_KEYWORDS)) return "system_explain";

  if (context?.assetId || context?.page?.startsWith("/asset/")) {
    if (includesAny(text, STABLECOIN_KEYWORDS)) {
      return "stablecoin_explain";
    }
    if (includesAny(text, MARKET_KEYWORDS) && !includesAny(text, ASSET_KEYWORDS)) {
      return "market_snapshot";
    }
    return "asset_analysis";
  }

  if (includesAny(text, STABLECOIN_KEYWORDS)) return "stablecoin_explain";
  if (includesAny(text, ASSET_KEYWORDS)) return "asset_analysis";
  if (includesAny(text, MARKET_KEYWORDS)) return "market_snapshot";

  if (context?.page === "/ops") return "ops_summary";
  return "unknown";
}
