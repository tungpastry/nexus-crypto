import type { ProviderHealthExplainerOutput, TifaOpsIssue } from "../types";

type HealthCheck = {
  status?: "ok" | "warn" | "error";
  latency_ms?: number;
  value?: string | number | null;
  message?: string;
};

type ProviderHealthPayload = {
  status?: "ok" | "degraded";
  updated_at?: string;
  checks?: Record<string, HealthCheck>;
};

const CHECK_LABELS: Record<string, string> = {
  binance_price: "Binance price",
  binance_klines: "Binance klines",
  market_snapshot: "Market snapshot",
  market_snapshot_cache_status: "Snapshot cache status",
  market_snapshot_age_ms: "Snapshot cache age",
};

function labelForCheck(key: string) {
  return CHECK_LABELS[key] || key.replaceAll("_", " ");
}

export function explainProviderHealth(
  payload: ProviderHealthPayload
): ProviderHealthExplainerOutput {
  const checks = Object.entries(payload.checks || {}).map(([key, check]) => ({
    key,
    label: labelForCheck(key),
    status: check.status || "error",
    latency_ms:
      typeof check.latency_ms === "number" && Number.isFinite(check.latency_ms)
        ? check.latency_ms
        : null,
    value:
      typeof check.value === "string" || typeof check.value === "number" || check.value === null
        ? check.value
        : null,
    message: typeof check.message === "string" ? check.message : null,
  }));

  const summary = checks.reduce(
    (acc, check) => {
      if (check.status === "ok") acc.ok_checks += 1;
      else if (check.status === "warn") acc.warn_checks += 1;
      else acc.error_checks += 1;

      if (
        typeof check.latency_ms === "number" &&
        (acc.slowest_latency_ms === null || check.latency_ms > acc.slowest_latency_ms)
      ) {
        acc.slowest_latency_ms = check.latency_ms;
        acc.slowest_check = check.label;
      }
      return acc;
    },
    {
      total_checks: checks.length,
      ok_checks: 0,
      warn_checks: 0,
      error_checks: 0,
      slowest_check: null as string | null,
      slowest_latency_ms: null as number | null,
    }
  );

  const issues: TifaOpsIssue[] = [];
  for (const check of checks) {
    if (check.status === "ok") continue;
    issues.push({
      id: `provider_health:${check.key}`,
      source: "provider_health",
      severity: check.status === "error" ? "error" : "warn",
      title: `${check.label} ${check.status}`,
      detail:
        check.message ||
        (typeof check.value === "string" || typeof check.value === "number"
          ? `Value: ${check.value}`
          : "Check is not in OK state."),
    });
  }

  const status = payload.status === "ok" ? "ok" : "degraded";
  const explanation =
    status === "ok"
      ? "Provider readiness checks are healthy. Binance price/klines and market snapshot are responding normally."
      : "Provider readiness checks are degraded. Review non-OK checks before relying on live diagnostics.";

  return {
    ok: true,
    context_type: "provider_health_explainer",
    updated_at: payload.updated_at || new Date().toISOString(),
    status,
    summary,
    checks,
    issues,
    explanation,
    disclaimer: "Market data only. No trade execution or financial recommendations.",
  };
}

