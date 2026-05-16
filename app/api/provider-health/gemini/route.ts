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
    budget,
    updated_at: new Date().toISOString(),
  });
}
