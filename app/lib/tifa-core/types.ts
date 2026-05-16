export type TifaPageContext = {
  page?: string;
  assetId?: string;
  timeframe?: string;
};

export type TifaChatInput = {
  message: string;
  context?: TifaPageContext;
};

export type TifaIntent =
  | "market_snapshot"
  | "asset_analysis"
  | "stablecoin_explain"
  | "budget_status"
  | "provider_health"
  | "deep_health"
  | "ops_summary"
  | "system_explain"
  | "unknown";

export type TifaToolContext = {
  intent: TifaIntent;
  market_context?: unknown;
  asset_analysis_context?: unknown;
  budget_context?: unknown;
  provider_health_context?: unknown;
  deep_health_context?: unknown;
  gemini_provider_health_context?: unknown;
  provider_health_explainer_context?: unknown;
  deep_health_explainer_context?: unknown;
  ops_summary_context?: unknown;
  tool_orchestration?: {
    tools_requested: string[];
    tools_used: string[];
    warnings: string[];
  };
};

export type TifaChatSuccess = {
  ok: true;
  answer: string;
  provider: string;
  model: string;
  tool_context: TifaToolContext;
  budget: {
    status: "ok" | "degraded" | "blocked";
    reason?: string;
  };
};

export type TifaChatFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type TifaChatResult = TifaChatSuccess | TifaChatFailure;
