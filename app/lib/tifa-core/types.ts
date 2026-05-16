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
  | "market_overview"
  | "asset_analysis"
  | "budget_status"
  | "provider_health"
  | "general";

export type TifaToolContext = {
  intent: TifaIntent;
  market_context?: unknown;
  asset_analysis_context?: unknown;
  budget_context?: unknown;
  provider_health_context?: unknown;
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
