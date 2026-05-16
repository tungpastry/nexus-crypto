import type { DeepHealthExplainerOutput, TifaOpsIssue } from "../types";

type EndpointCheck = {
  status?: "ok" | "warn" | "error";
  latency_ms?: number;
  message?: string;
  candles?: number;
};

type SymbolCheck = {
  status?: "ok" | "error";
  price?: EndpointCheck;
  klines?: EndpointCheck;
};

type DeepHealthPayload = {
  status?: "ok" | "degraded" | "error";
  updated_at?: string;
  summary?: {
    symbols_total?: number;
    symbols_ok?: number;
    symbols_warn?: number;
    symbols_error?: number;
    latency_ms?: number;
  };
  checks?: Record<string, SymbolCheck>;
};

function safeStatus(status: unknown): "ok" | "warn" | "error" {
  return status === "ok" || status === "warn" || status === "error" ? status : "error";
}

export function explainDeepHealth(payload: DeepHealthPayload): DeepHealthExplainerOutput {
  const symbols: DeepHealthExplainerOutput["symbols"] = Object.entries(
    payload.checks || {}
  ).map(([symbol, check]) => {
    const priceStatus = safeStatus(check.price?.status);
    const klinesStatus = safeStatus(check.klines?.status);
    const issue = check.price?.message || check.klines?.message || null;

    return {
      symbol,
      status: check.status === "ok" ? "ok" : "error",
      price_status: priceStatus,
      price_latency_ms:
        typeof check.price?.latency_ms === "number" ? check.price.latency_ms : null,
      klines_status: klinesStatus,
      klines_latency_ms:
        typeof check.klines?.latency_ms === "number" ? check.klines.latency_ms : null,
      candles: typeof check.klines?.candles === "number" ? check.klines.candles : null,
      issue,
    };
  });

  const slowSymbols = symbols
    .map((item) => ({
      symbol: item.symbol,
      latency_ms: Math.max(item.price_latency_ms || 0, item.klines_latency_ms || 0),
    }))
    .sort((a, b) => b.latency_ms - a.latency_ms)
    .slice(0, 3)
    .filter((item) => item.latency_ms > 0);

  const issues: TifaOpsIssue[] = [];
  for (const symbol of symbols) {
    if (symbol.status === "ok") continue;
    issues.push({
      id: `deep_health:${symbol.symbol}`,
      source: "deep_health",
      severity: "error",
      title: `${symbol.symbol} deep check error`,
      detail: symbol.issue || "Price or kline check failed.",
    });
  }

  const status =
    payload.status === "ok" || payload.status === "error" ? payload.status : "degraded";

  const summary = {
    symbols_total:
      typeof payload.summary?.symbols_total === "number"
        ? payload.summary.symbols_total
        : symbols.length,
    symbols_ok:
      typeof payload.summary?.symbols_ok === "number"
        ? payload.summary.symbols_ok
        : symbols.filter((item) => item.status === "ok").length,
    symbols_warn:
      typeof payload.summary?.symbols_warn === "number" ? payload.summary.symbols_warn : 0,
    symbols_error:
      typeof payload.summary?.symbols_error === "number"
        ? payload.summary.symbols_error
        : symbols.filter((item) => item.status === "error").length,
    latency_ms:
      typeof payload.summary?.latency_ms === "number" ? payload.summary.latency_ms : null,
    slow_symbols: slowSymbols,
  };

  const explanation =
    status === "ok"
      ? "Deep provider diagnostics are healthy across Binance-enabled assets."
      : status === "degraded"
        ? "Deep provider diagnostics are partially degraded. Some symbols are failing checks."
        : "Deep provider diagnostics are in error state. Most or all symbols are failing.";

  return {
    ok: true,
    context_type: "deep_health_explainer",
    updated_at: payload.updated_at || new Date().toISOString(),
    status,
    summary,
    symbols,
    issues,
    explanation,
    disclaimer: "Diagnostics only. Market data context may be stale or partially unavailable.",
  };
}
