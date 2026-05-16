import { NextResponse } from "next/server";
import { getGeminiBudgetStatus } from "../../../lib/gemini-budget/status";
import { getTifaProviderHealth } from "../../../lib/tifa-provider-gateway/gateway";
import { getTifaRuntimeConfig } from "../../../lib/tifa-runtime/config";

export const runtime = "nodejs";

export async function GET() {
  const provider = getTifaProviderHealth();
  const config = getTifaRuntimeConfig();
  const budget = await getGeminiBudgetStatus();

  return NextResponse.json({
    provider: "gemini",
    assistant_enabled: config.enabled,
    configured: provider.configured,
    model: provider.model,
    status: provider.configured ? budget.status : "disabled",
    reason: provider.reason,
    stream: {
      enabled: provider.stream_enabled,
      timeout_ms: provider.stream_timeout_ms,
      retry_limit: provider.stream_retry_limit,
    },
    request: {
      timeout_ms: provider.timeout_ms,
      retry_limit: provider.retry_limit,
    },
    circuit: provider.circuit,
    budget,
    updated_at: new Date().toISOString(),
  });
}
