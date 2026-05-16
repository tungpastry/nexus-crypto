import type {
  DeepHealthExplainerOutput,
  GeminiHealthExplainerOutput,
  OpsSummaryOutput,
  ProviderHealthExplainerOutput,
  TifaOpsIssue,
} from "../types";

type BudgetPayload = {
  status?: "ok" | "degraded" | "blocked";
};

export function explainOpsSummary(params: {
  providerHealth: ProviderHealthExplainerOutput;
  deepHealth: DeepHealthExplainerOutput;
  geminiHealth: GeminiHealthExplainerOutput;
  budget?: BudgetPayload;
}): OpsSummaryOutput {
  const { providerHealth, deepHealth, geminiHealth, budget } = params;
  const combinedIssues: TifaOpsIssue[] = [
    ...providerHealth.issues,
    ...deepHealth.issues,
    ...geminiHealth.issues,
  ];

  const hasError = combinedIssues.some((issue) => issue.severity === "error");
  const hasWarn = combinedIssues.some((issue) => issue.severity === "warn");
  const status = hasError ? "error" : hasWarn ? "degraded" : "ok";

  const recommendations: string[] = [];
  if (deepHealth.status !== "ok") {
    recommendations.push(
      "Review deep health symbol errors before relying on full-universe diagnostics."
    );
  }
  if (providerHealth.status !== "ok") {
    recommendations.push(
      "Check lightweight provider health for snapshot/cache degradation signals."
    );
  }
  if (geminiHealth.status !== "ok") {
    recommendations.push(
      "Use tool-only fallback where needed until Gemini provider returns to healthy status."
    );
  }
  if (!recommendations.length) {
    recommendations.push("All monitored ops diagnostics are healthy at this time.");
  }

  const budgetStatus = budget?.status || "ok";
  const headline =
    status === "ok"
      ? "Ops diagnostics are healthy."
      : status === "degraded"
        ? "Ops diagnostics are degraded. Monitoring is recommended."
        : "Ops diagnostics are in error state. Immediate review is recommended.";

  return {
    ok: true,
    context_type: "ops_summary",
    updated_at: new Date().toISOString(),
    status,
    executive: {
      headline,
      status,
      provider_status: providerHealth.status,
      deep_health_status: deepHealth.status,
      gemini_status: geminiHealth.status,
      budget_status: budgetStatus,
    },
    provider_health: providerHealth,
    deep_health: deepHealth,
    gemini_health: geminiHealth,
    issues: combinedIssues,
    recommendations,
    disclaimer:
      "Operations summary is for diagnostics and workflow coordination only. Market data only; no trade execution.",
  };
}

