import type { GeminiHealthExplainerOutput, TifaOpsIssue } from "../types";

type GeminiHealthPayload = {
  configured?: boolean;
  status?: "ok" | "degraded" | "blocked" | "disabled";
  stream?: {
    enabled?: boolean;
  };
  request?: {
    timeout_ms?: number;
    retry_limit?: number;
  };
  circuit?: {
    state?: "closed" | "open" | "half_open";
    failure_count?: number;
    threshold?: number;
  };
  budget?: {
    monthly_spend_usd?: number;
    hard_stop_usd?: number;
    status?: "ok" | "degraded" | "blocked";
  };
  reason?: string;
  updated_at?: string;
};

export function explainGeminiProviderHealth(
  payload: GeminiHealthPayload
): GeminiHealthExplainerOutput {
  const status = payload.status || "disabled";
  const configured = Boolean(payload.configured);
  const streamMode = !configured
    ? "tool-only"
    : payload.stream?.enabled
      ? "true-stream"
      : "pseudo-stream";

  const issues: TifaOpsIssue[] = [];

  if (!configured) {
    issues.push({
      id: "gemini:config",
      source: "gemini_provider",
      severity: "warn",
      title: "Gemini not configured",
      detail: payload.reason || "GEMINI_API_KEY is missing or unavailable.",
    });
  }

  const circuitState = payload.circuit?.state || "closed";
  if (circuitState === "open") {
    issues.push({
      id: "gemini:circuit-open",
      source: "gemini_provider",
      severity: "error",
      title: "Gemini circuit breaker is open",
      detail: "Provider calls are temporarily blocked until cooldown completes.",
    });
  } else if (circuitState === "half_open") {
    issues.push({
      id: "gemini:circuit-half-open",
      source: "gemini_provider",
      severity: "warn",
      title: "Gemini circuit breaker is half-open",
      detail: "Provider is in recovery mode with trial requests.",
    });
  }

  if (payload.budget?.status === "blocked") {
    issues.push({
      id: "gemini:budget-blocked",
      source: "budget",
      severity: "error",
      title: "Gemini budget hard stop reached",
      detail: "Provider calls are blocked by budget guard.",
    });
  } else if (payload.budget?.status === "degraded") {
    issues.push({
      id: "gemini:budget-degraded",
      source: "budget",
      severity: "warn",
      title: "Gemini budget near hard stop",
      detail: "Responses may run in degraded mode to preserve monthly budget.",
    });
  }

  const explanation =
    status === "ok"
      ? "Gemini provider is healthy with budget and circuit guard in normal range."
      : status === "disabled"
        ? "Gemini is disabled or not configured. Tifa runs in tool-only fallback mode."
        : "Gemini provider is constrained by budget/circuit state. Fallback behavior may apply.";

  return {
    ok: true,
    context_type: "gemini_health_explainer",
    updated_at: payload.updated_at || new Date().toISOString(),
    status,
    summary: {
      configured,
      stream_mode: streamMode,
      circuit_state: circuitState,
      circuit_failures: `${payload.circuit?.failure_count ?? 0}/${payload.circuit?.threshold ?? 0}`,
      retry_limit: payload.request?.retry_limit ?? 0,
      timeout_ms: payload.request?.timeout_ms ?? 0,
      monthly_spend_usd: payload.budget?.monthly_spend_usd ?? 0,
      hard_stop_usd: payload.budget?.hard_stop_usd ?? 0,
    },
    issues,
    explanation,
    disclaimer: "Provider diagnostics only. Secrets are never exposed in assistant responses.",
  };
}

