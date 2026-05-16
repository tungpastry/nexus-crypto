import { NextResponse } from "next/server";
import { getGeminiBudgetStatus } from "../../../lib/gemini-budget/status";
import { getTifaProviderHealth } from "../../../lib/tifa-provider-gateway/gateway";
import { getTifaRuntimeConfig } from "../../../lib/tifa-runtime/config";
import { getGeminiProviderHealthSnapshot } from "../../../lib/tifa-tools/orchestrator";

export const runtime = "nodejs";

export async function GET() {
  const provider = getTifaProviderHealth();
  const config = getTifaRuntimeConfig();
  const budget = await getGeminiBudgetStatus();
  const snapshot = await getGeminiProviderHealthSnapshot();

  return NextResponse.json({
    provider: snapshot.provider,
    assistant_enabled: config.enabled,
    configured: provider.configured,
    model: provider.model,
    status: snapshot.status,
    reason: provider.reason,
    stream: snapshot.stream,
    request: snapshot.request,
    circuit: snapshot.circuit,
    budget,
    updated_at: snapshot.updated_at,
  });
}
