import type { TifaIntentName, TifaToolName } from "./types";

export const TIFA_TOOL_ALLOWLIST: TifaToolName[] = [
  "market_context",
  "asset_analysis",
  "budget_status",
  "gemini_provider_health",
  "provider_health",
  "deep_provider_health",
  "provider_health_explainer",
  "deep_health_explainer",
  "ops_summary",
];

export const TIFA_INTENT_TOOLS: Record<TifaIntentName, TifaToolName[]> = {
  market_snapshot: ["market_context"],
  asset_analysis: ["asset_analysis"],
  stablecoin_explain: ["asset_analysis"],
  budget_status: ["budget_status", "gemini_provider_health"],
  provider_health: [
    "provider_health",
    "provider_health_explainer",
    "gemini_provider_health",
  ],
  deep_health: ["deep_provider_health", "deep_health_explainer"],
  ops_summary: ["ops_summary"],
  system_explain: ["gemini_provider_health", "budget_status"],
  unknown: ["market_context"],
};

export function isSupportedTool(tool: string): tool is TifaToolName {
  return TIFA_TOOL_ALLOWLIST.includes(tool as TifaToolName);
}

export function getToolsForIntent(intent: TifaIntentName): TifaToolName[] {
  return TIFA_INTENT_TOOLS[intent] || TIFA_INTENT_TOOLS.unknown;
}

