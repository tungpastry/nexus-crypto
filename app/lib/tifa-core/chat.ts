import axios from "axios";
import type { NextRequest } from "next/server";
import { runBudgetPreflight, writeBudgetPostflight } from "../gemini-budget/guard";
import { getGeminiBudgetStatus } from "../gemini-budget/status";
import { resolveTifaIntent } from "../tifa-nexus/intent";
import { buildInternalAuthHeaders, getMarketContext } from "../tifa-nexus/marketContext";
import { getAssetAnalysisContext } from "../tifa-nexus/assetAnalysisContext";
import { buildUserPrompt, loadTifaRuntimePrompt } from "../tifa-nexus/promptBuilder";
import {
  getTifaProviderHealth,
  runTifaProviderGateway,
} from "../tifa-provider-gateway/gateway";
import { appendTifaChatSession } from "../tifa-runtime/chatSessions";
import { assertTifaRuntimeSafe, getTifaRuntimeConfig } from "../tifa-runtime/config";
import type { TifaChatInput, TifaChatResult, TifaToolContext } from "./types";
import { createRequestId } from "./requestId";

async function fetchProviderHealth(origin: string, req?: NextRequest) {
  const response = await axios.get(`${origin}/api/provider-health`, {
    timeout: 8_000,
    headers: buildInternalAuthHeaders(req),
  });
  return response.data;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatPercent(value: unknown) {
  const num = asNumber(value);
  return num === null ? "--" : `${num.toFixed(2)}%`;
}

function formatCurrency(value: unknown) {
  const num = asNumber(value);
  if (num === null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function buildToolOnlyAnswer(message: string, toolContext: TifaToolContext) {
  const sections: string[] = [];
  const lowerMessage = message.toLowerCase();

  if (toolContext.market_context && typeof toolContext.market_context === "object") {
    const market = toolContext.market_context as {
      global?: Record<string, unknown>;
      top_assets?: Array<{
        symbol: string;
        change_24h: number | null;
        mode: "nexus" | "market-only";
      }>;
    };
    const topAssets = market.top_assets || [];
    const strongest = [...topAssets]
      .filter((item) => typeof item.change_24h === "number")
      .sort((a, b) => (b.change_24h || 0) - (a.change_24h || 0))[0];
    const weakest = [...topAssets]
      .filter((item) => typeof item.change_24h === "number")
      .sort((a, b) => (a.change_24h || 0) - (b.change_24h || 0))[0];

    sections.push(
      [
        "- Market Snapshot",
        `  - Market Cap: ${formatCurrency(market.global?.market_cap_usd)}`,
        `  - 24H Volume: ${formatCurrency(market.global?.volume_24h_usd)}`,
        `  - BTC Dominance: ${formatPercent(market.global?.btc_dominance)}`,
        `  - ETH Dominance: ${formatPercent(market.global?.eth_dominance)}`,
        strongest
          ? `  - 24H strongest in Top 10: ${strongest.symbol} (${formatPercent(strongest.change_24h)})`
          : undefined,
        weakest
          ? `  - 24H weakest in Top 10: ${weakest.symbol} (${formatPercent(weakest.change_24h)})`
          : undefined,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  if (
    toolContext.asset_analysis_context &&
    typeof toolContext.asset_analysis_context === "object"
  ) {
    const asset = toolContext.asset_analysis_context as {
      mode?: string;
      reason?: string;
      asset?: { symbol?: string; name?: string };
      timeframe?: { label?: string };
      signal?: {
        score?: number;
        state?: string;
        trend?: string;
        bias?: string;
        setup?: string;
        risk?: string;
        atrPercent?: number;
        volatility?: string;
        volumeRatio?: number;
      };
    };

    if (asset.mode === "market-only") {
      sections.push(
        [
          "- Asset Context",
          `  - ${asset.asset?.symbol || "Asset"} is running in market-only mode.`,
          `  - ${asset.reason || "Nexus MA and checklist analysis are disabled for this asset."}`,
        ].join("\n")
      );
    } else if (asset.signal) {
      sections.push(
        [
          `- Asset Analysis (${asset.asset?.symbol || "Asset"} ${asset.timeframe?.label || ""})`,
          `  - Nexus Score: ${asset.signal.score ?? "--"} | State: ${asset.signal.state ?? "--"}`,
          `  - Trend: ${asset.signal.trend ?? "--"} | Bias: ${asset.signal.bias ?? "--"} | Setup: ${asset.signal.setup ?? "--"}`,
          `  - Risk: ${asset.signal.risk ?? "--"} | ATR%: ${formatPercent(asset.signal.atrPercent)} | Volatility: ${asset.signal.volatility ?? "--"}`,
          `  - Volume Ratio: ${asNumber(asset.signal.volumeRatio)?.toFixed(2) ?? "--"}x`,
        ].join("\n")
      );
    }
  }

  if (toolContext.budget_context && typeof toolContext.budget_context === "object") {
    const budget = toolContext.budget_context as {
      status?: string;
      monthly_spend_usd?: number;
      remaining_hard_stop_usd?: number;
      current_month?: string;
    };
    sections.push(
      [
        "- Gemini Budget",
        `  - Status: ${budget.status || "--"} | Month: ${budget.current_month || "--"}`,
        `  - Monthly Spend: $${(budget.monthly_spend_usd ?? 0).toFixed(4)}`,
        `  - Remaining to Hard Stop: $${(budget.remaining_hard_stop_usd ?? 0).toFixed(4)}`,
      ].join("\n")
    );
  }

  if (!sections.length) {
    sections.push(
      "- I need more specific context. Try quick actions like Market Snapshot, Analyze Current Asset, or Gemini Budget."
    );
  }

  const guidance = lowerMessage.includes("newbie")
    ? "Keep this simple: focus on trend, risk, and state before any deeper rule reading."
    : "Use this as decision-support context only, then confirm with your own trading workflow.";

  return `${sections.join("\n\n")}\n\n- ${guidance}\n- Market data only. Not financial advice.`;
}

async function buildToolContext(
  req: NextRequest,
  input: TifaChatInput
): Promise<TifaToolContext> {
  const intent = resolveTifaIntent(input.message, input.context);
  const origin = new URL(req.url).origin;
  const context: TifaToolContext = { intent };

  if (intent === "market_overview" || intent === "general") {
    context.market_context = await getMarketContext(origin, req);
  }

  if (intent === "asset_analysis" || input.context?.assetId) {
    const assetId = input.context?.assetId || "bitcoin";
    context.asset_analysis_context = await getAssetAnalysisContext(
      assetId,
      input.context?.timeframe
    );
  }

  if (intent === "budget_status" || intent === "provider_health") {
    context.budget_context = await getGeminiBudgetStatus();
  }

  if (intent === "provider_health") {
    context.provider_health_context = await fetchProviderHealth(origin, req);
  }

  return context;
}

export async function runTifaChat(req: NextRequest, input: TifaChatInput): Promise<TifaChatResult> {
  const config = getTifaRuntimeConfig();
  if (!config.enabled) {
    return {
      ok: false,
      error: {
        code: "TIFA_DISABLED",
        message: "Tifa assistant is disabled.",
      },
    };
  }

  try {
    assertTifaRuntimeSafe(config);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "TIFA_CONFIG_ERROR",
        message: error instanceof Error ? error.message : "Invalid Tifa config.",
      },
    };
  }

  const requestId = createRequestId();
  const providerHealth = getTifaProviderHealth();
  const toolContext = await buildToolContext(req, input);
  const preflight = await runBudgetPreflight(requestId, providerHealth.model);

  const toolOnlyAnswer = buildToolOnlyAnswer(input.message, toolContext);

  if (!preflight.allowed) {
    return {
      ok: true,
      answer: toolOnlyAnswer,
      provider: "tool-only",
      model: providerHealth.model,
      tool_context: toolContext,
      budget: {
        status: "blocked",
        reason: preflight.reason,
      },
    };
  }

  if (!providerHealth.configured) {
    return {
      ok: true,
      answer: toolOnlyAnswer,
      provider: "tool-only",
      model: providerHealth.model,
      tool_context: toolContext,
      budget: {
        status: preflight.status,
        reason: "GEMINI_NOT_CONFIGURED",
      },
    };
  }

  const systemPrompt = await loadTifaRuntimePrompt();
  const userPrompt = buildUserPrompt(input.message, toolContext, config.timezone);
  const providerResult = await runTifaProviderGateway({
    systemPrompt,
    userPrompt,
    temperature: config.gemini.temperature,
    maxOutputTokens: preflight.maxOutputTokensOverride ?? config.gemini.maxOutputTokens,
  });

  if (!providerResult.ok) {
    await writeBudgetPostflight({
      requestId,
      model: providerHealth.model,
      status: "failed",
      reason: providerResult.error.code,
      estimatedCostUsd: preflight.estimatedCostUsd,
      monthlySpendBefore: preflight.monthlySpendUsd,
    });

    return {
      ok: true,
      answer: toolOnlyAnswer,
      provider: "tool-only",
      model: providerHealth.model,
      tool_context: toolContext,
      budget: {
        status: preflight.status,
        reason: providerResult.error.code,
      },
    };
  }

  await writeBudgetPostflight({
    requestId,
    model: providerHealth.model,
    status: "success",
    reason: preflight.status === "degraded" ? "GEMINI_BUDGET_DEGRADED" : "OK",
    estimatedCostUsd: preflight.estimatedCostUsd,
    totalCostUsd: preflight.estimatedCostUsd,
    inputTokens: providerResult.usage?.promptTokenCount,
    outputTokens: providerResult.usage?.candidatesTokenCount,
    monthlySpendBefore: preflight.monthlySpendUsd,
  });

  await appendTifaChatSession({
    request_id: requestId,
    timestamp_utc: new Date().toISOString(),
    message: input.message,
    answer: providerResult.text,
    context: input.context as Record<string, unknown> | undefined,
    provider: providerResult.provider,
    model: providerResult.model,
  });

  return {
    ok: true,
    answer: providerResult.text,
    provider: providerResult.provider,
    model: providerResult.model,
    tool_context: toolContext,
    budget: {
      status: preflight.status,
      reason: preflight.reason,
    },
  };
}
