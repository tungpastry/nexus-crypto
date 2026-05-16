import type { TifaPageContext } from "../tifa-core/types";

export type TifaToolName =
  | "market_context"
  | "asset_analysis"
  | "budget_status"
  | "gemini_provider_health"
  | "provider_health"
  | "deep_provider_health"
  | "provider_health_explainer"
  | "deep_health_explainer"
  | "ops_summary";

export type TifaIntentName =
  | "market_snapshot"
  | "asset_analysis"
  | "stablecoin_explain"
  | "budget_status"
  | "provider_health"
  | "deep_health"
  | "ops_summary"
  | "system_explain"
  | "unknown";

export type ToolExecutionParams = {
  message: string;
  origin: string;
  context?: TifaPageContext;
};

export type TifaIssueSeverity = "info" | "warn" | "error";

export type TifaOpsIssue = {
  id: string;
  source: "provider_health" | "deep_health" | "gemini_provider" | "budget";
  severity: TifaIssueSeverity;
  title: string;
  detail: string;
};

export type ProviderHealthExplainerOutput = {
  ok: true;
  context_type: "provider_health_explainer";
  updated_at: string;
  status: "ok" | "degraded";
  summary: {
    total_checks: number;
    ok_checks: number;
    warn_checks: number;
    error_checks: number;
    slowest_check: string | null;
    slowest_latency_ms: number | null;
  };
  checks: Array<{
    key: string;
    label: string;
    status: "ok" | "warn" | "error";
    latency_ms: number | null;
    value: string | number | null;
    message: string | null;
  }>;
  issues: TifaOpsIssue[];
  explanation: string;
  disclaimer: string;
};

export type DeepHealthExplainerOutput = {
  ok: true;
  context_type: "deep_health_explainer";
  updated_at: string;
  status: "ok" | "degraded" | "error";
  summary: {
    symbols_total: number;
    symbols_ok: number;
    symbols_warn: number;
    symbols_error: number;
    latency_ms: number | null;
    slow_symbols: Array<{ symbol: string; latency_ms: number }>;
  };
  symbols: Array<{
    symbol: string;
    status: "ok" | "error";
    price_status: "ok" | "warn" | "error";
    price_latency_ms: number | null;
    klines_status: "ok" | "warn" | "error";
    klines_latency_ms: number | null;
    candles: number | null;
    issue: string | null;
  }>;
  issues: TifaOpsIssue[];
  explanation: string;
  disclaimer: string;
};

export type GeminiHealthExplainerOutput = {
  ok: true;
  context_type: "gemini_health_explainer";
  updated_at: string;
  status: "ok" | "degraded" | "blocked" | "disabled";
  summary: {
    configured: boolean;
    stream_mode: "true-stream" | "pseudo-stream" | "tool-only";
    circuit_state: "closed" | "open" | "half_open";
    circuit_failures: string;
    retry_limit: number;
    timeout_ms: number;
    monthly_spend_usd: number;
    hard_stop_usd: number;
  };
  issues: TifaOpsIssue[];
  explanation: string;
  disclaimer: string;
};

export type OpsSummaryOutput = {
  ok: true;
  context_type: "ops_summary";
  updated_at: string;
  status: "ok" | "degraded" | "error";
  executive: {
    headline: string;
    status: "ok" | "degraded" | "error";
    provider_status: "ok" | "degraded";
    deep_health_status: "ok" | "degraded" | "error";
    gemini_status: "ok" | "degraded" | "blocked" | "disabled";
    budget_status: "ok" | "degraded" | "blocked";
  };
  provider_health: ProviderHealthExplainerOutput;
  deep_health: DeepHealthExplainerOutput;
  gemini_health: GeminiHealthExplainerOutput;
  issues: TifaOpsIssue[];
  recommendations: string[];
  disclaimer: string;
};

export type TifaOrchestrationResult = {
  ok: true;
  intent: TifaIntentName;
  tools_requested: TifaToolName[];
  tools_used: TifaToolName[];
  outputs: Partial<Record<TifaToolName, unknown>>;
  warnings: string[];
};

