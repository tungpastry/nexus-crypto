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

const HEALTH_KEYWORDS = ["provider health", "deep health", "ops", "status"];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function resolveTifaIntent(
  message: string,
  context?: TifaPageContext
): TifaIntent {
  const text = message.toLowerCase();

  if (includesAny(text, BUDGET_KEYWORDS)) return "budget_status";
  if (includesAny(text, HEALTH_KEYWORDS)) return "provider_health";

  if (context?.assetId || context?.page?.startsWith("/asset/")) {
    if (includesAny(text, MARKET_KEYWORDS) && !includesAny(text, ASSET_KEYWORDS)) {
      return "market_overview";
    }
    return "asset_analysis";
  }

  if (includesAny(text, ASSET_KEYWORDS)) return "asset_analysis";
  if (includesAny(text, MARKET_KEYWORDS)) return "market_overview";

  if (context?.page === "/ops") return "provider_health";
  return "general";
}
