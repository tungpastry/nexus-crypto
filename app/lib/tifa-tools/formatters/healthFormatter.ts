import type {
  DeepHealthExplainerOutput,
  GeminiHealthExplainerOutput,
  ProviderHealthExplainerOutput,
} from "../types";

export function formatProviderHealthForAssistant(payload: ProviderHealthExplainerOutput) {
  const slowest =
    payload.summary.slowest_check && payload.summary.slowest_latency_ms !== null
      ? `${payload.summary.slowest_check} (${payload.summary.slowest_latency_ms}ms)`
      : "--";

  return [
    "- Provider Health Summary",
    `  - Status: ${payload.status}`,
    `  - Checks: ok ${payload.summary.ok_checks} / warn ${payload.summary.warn_checks} / error ${payload.summary.error_checks}`,
    `  - Slowest check: ${slowest}`,
    payload.issues.length
      ? `  - Issues: ${payload.issues.slice(0, 3).map((issue) => issue.title).join("; ")}`
      : "  - Issues: none",
  ].join("\n");
}

export function formatDeepHealthForAssistant(payload: DeepHealthExplainerOutput) {
  const slow = payload.summary.slow_symbols
    .map((item) => `${item.symbol} ${item.latency_ms}ms`)
    .join(", ");

  return [
    "- Deep Health Summary",
    `  - Status: ${payload.status}`,
    `  - Symbols: ${payload.summary.symbols_ok}/${payload.summary.symbols_total} OK`,
    `  - Errors: ${payload.summary.symbols_error}`,
    `  - Slow symbols: ${slow || "--"}`,
    payload.issues.length
      ? `  - Issues: ${payload.issues.slice(0, 3).map((issue) => issue.title).join("; ")}`
      : "  - Issues: none",
  ].join("\n");
}

export function formatGeminiHealthForAssistant(payload: GeminiHealthExplainerOutput) {
  return [
    "- Gemini Provider Summary",
    `  - Status: ${payload.status}`,
    `  - Stream mode: ${payload.summary.stream_mode}`,
    `  - Circuit: ${payload.summary.circuit_state} (${payload.summary.circuit_failures})`,
    `  - Budget spend: $${payload.summary.monthly_spend_usd.toFixed(4)} / hard stop $${payload.summary.hard_stop_usd.toFixed(2)}`,
    payload.issues.length
      ? `  - Issues: ${payload.issues.slice(0, 3).map((issue) => issue.title).join("; ")}`
      : "  - Issues: none",
  ].join("\n");
}

