import type { NextRequest } from "next/server";
import { runBudgetPreflight, writeBudgetPostflight } from "../gemini-budget/guard";
import { resolveTifaIntent } from "../tifa-nexus/intent";
import { buildUserPrompt, loadTifaRuntimePrompt } from "../tifa-nexus/promptBuilder";
import {
  getTifaProviderHealth, runTifaProviderGateway, runTifaProviderGatewayStream,
} from "../tifa-provider-gateway/gateway";
import { appendTifaChatSession } from "../tifa-runtime/chatSessions";
import { assertTifaRuntimeSafe, getTifaRuntimeConfig } from "../tifa-runtime/config";
import {
  formatDeepHealthForAssistant,
  formatGeminiHealthForAssistant,
  formatProviderHealthForAssistant,
} from "../tifa-tools/formatters/healthFormatter";
import { formatOpsSummaryForAssistant } from "../tifa-tools/formatters/opsFormatter";
import { mapOrchestrationToToolContext, orchestrateTifaTools } from "../tifa-tools/orchestrator";
import { createRequestId } from "./requestId";
import type { TifaChatInput, TifaChatResult, TifaToolContext } from "./types";

type TifaStreamPreparation = {
  requestId: string;
  providerModel: string;
  toolContext: TifaToolContext;
  budget: {
    status: "ok" | "degraded" | "blocked";
    reason?: string;
  };
  answerForFallback: string;
  postflight: {
    estimatedCostUsd: number;
    monthlySpendBefore: number;
  } | null;
  mode: "tool-only" | "provider-stream";
  stream?: AsyncIterable<string>;
  streamErrorCode?: string;
};

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

  if (toolContext.ops_summary_context && typeof toolContext.ops_summary_context === "object") {
    sections.push(formatOpsSummaryForAssistant(toolContext.ops_summary_context as Parameters<typeof formatOpsSummaryForAssistant>[0]));
  } else {
    if (
      toolContext.provider_health_explainer_context &&
      typeof toolContext.provider_health_explainer_context === "object"
    ) {
      sections.push(
        formatProviderHealthForAssistant(
          toolContext.provider_health_explainer_context as Parameters<typeof formatProviderHealthForAssistant>[0]
        )
      );
    }

    if (
      toolContext.deep_health_explainer_context &&
      typeof toolContext.deep_health_explainer_context === "object"
    ) {
      sections.push(
        formatDeepHealthForAssistant(
          toolContext.deep_health_explainer_context as Parameters<typeof formatDeepHealthForAssistant>[0]
        )
      );
    }

    if (
      toolContext.gemini_provider_health_context &&
      typeof toolContext.gemini_provider_health_context === "object"
    ) {
      sections.push(
        formatGeminiHealthForAssistant(
          toolContext.gemini_provider_health_context as Parameters<typeof formatGeminiHealthForAssistant>[0]
        )
      );
    }
  }

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
      asset?: { symbol?: string };
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
  const orchestration = await orchestrateTifaTools({
    req,
    origin,
    intent,
    message: input.message,
    context: input.context,
  });

  return mapOrchestrationToToolContext(orchestration);
}

async function prepareTifaChat(req: NextRequest, input: TifaChatInput) {
  const config = getTifaRuntimeConfig();
  if (!config.enabled) {
    return {
      ok: false as const,
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
      ok: false as const,
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

  return {
    ok: true as const,
    config,
    requestId,
    providerHealth,
    toolContext,
    preflight,
    toolOnlyAnswer,
    input,
  };
}

export async function runTifaChat(req: NextRequest, input: TifaChatInput): Promise<TifaChatResult> {
  const prepared = await prepareTifaChat(req, input);
  if (!prepared.ok) {
    return {
      ok: false,
      error: prepared.error,
    };
  }

  if (!prepared.preflight.allowed) {
    return {
      ok: true,
      answer: prepared.toolOnlyAnswer,
      provider: "tool-only",
      model: prepared.providerHealth.model,
      tool_context: prepared.toolContext,
      budget: {
        status: "blocked",
        reason: prepared.preflight.reason,
      },
    };
  }

  if (!prepared.providerHealth.configured) {
    return {
      ok: true,
      answer: prepared.toolOnlyAnswer,
      provider: "tool-only",
      model: prepared.providerHealth.model,
      tool_context: prepared.toolContext,
      budget: {
        status: prepared.preflight.status,
        reason:
          prepared.config.llmProvider === "ollama"
            ? "OLLAMA_NOT_CONFIGURED"
            : "GEMINI_NOT_CONFIGURED",
      },
    };
  }

  const systemPrompt = await loadTifaRuntimePrompt();
  const userPrompt = buildUserPrompt(
    input.message,
    prepared.toolContext,
    prepared.config.timezone
  );
  const activeTemperature =
    prepared.config.llmProvider === "ollama"
      ? 0.3
      : prepared.config.gemini.temperature;

  const providerResult = await runTifaProviderGateway({
    systemPrompt,
    userPrompt,
    temperature: activeTemperature,
    maxOutputTokens:
      prepared.preflight.maxOutputTokensOverride ?? prepared.config.gemini.maxOutputTokens,
  });

  if (!providerResult.ok) {
    await writeBudgetPostflight({
      requestId: prepared.requestId,
      model: prepared.providerHealth.model,
      status: "failed",
      reason: providerResult.error.code,
      estimatedCostUsd: prepared.preflight.estimatedCostUsd,
      monthlySpendBefore: prepared.preflight.monthlySpendUsd,
    });

    return {
      ok: true,
      answer: prepared.toolOnlyAnswer,
      provider: "tool-only",
      model: prepared.providerHealth.model,
      tool_context: prepared.toolContext,
      budget: {
        status: prepared.preflight.status,
        reason: providerResult.error.code,
      },
    };
  }

  await writeBudgetPostflight({
    requestId: prepared.requestId,
    model: prepared.providerHealth.model,
    status: "success",
    reason: prepared.preflight.status === "degraded" ? "GEMINI_BUDGET_DEGRADED" : "OK",
    estimatedCostUsd: prepared.preflight.estimatedCostUsd,
    totalCostUsd: prepared.preflight.estimatedCostUsd,
    inputTokens: providerResult.usage?.promptTokenCount,
    outputTokens: providerResult.usage?.candidatesTokenCount,
    monthlySpendBefore: prepared.preflight.monthlySpendUsd,
  });

  await appendTifaChatSession({
    request_id: prepared.requestId,
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
    tool_context: prepared.toolContext,
    budget: {
      status: prepared.preflight.status,
      reason: prepared.preflight.reason,
    },
  };
}

export async function runTifaChatStream(
  req: NextRequest,
  input: TifaChatInput
): Promise<TifaStreamPreparation | { ok: false; error: { code: string; message: string } }> {
  const prepared = await prepareTifaChat(req, input);
  if (!prepared.ok) {
    return { ok: false, error: prepared.error };
  }

  if (!prepared.preflight.allowed) {
    return {
      requestId: prepared.requestId,
      providerModel: prepared.providerHealth.model,
      toolContext: prepared.toolContext,
      budget: { status: "blocked", reason: prepared.preflight.reason },
      answerForFallback: prepared.toolOnlyAnswer,
      postflight: null,
      mode: "tool-only",
    };
  }

  if (!prepared.providerHealth.configured) {
    return {
      requestId: prepared.requestId,
      providerModel: prepared.providerHealth.model,
      toolContext: prepared.toolContext,
      budget: {
        status: prepared.preflight.status,
        reason:
          prepared.config.llmProvider === "ollama"
            ? "OLLAMA_NOT_CONFIGURED"
            : "GEMINI_NOT_CONFIGURED",
      },
      answerForFallback: prepared.toolOnlyAnswer,
      postflight: null,
      mode: "tool-only",
    };
  }

  const systemPrompt = await loadTifaRuntimePrompt();
  const userPrompt = buildUserPrompt(
    input.message,
    prepared.toolContext,
    prepared.config.timezone
  );

  const providerStream = await runTifaProviderGatewayStream({
    systemPrompt,
    userPrompt,
    temperature:
      prepared.config.llmProvider === "ollama" ? 0.3 : prepared.config.gemini.temperature,
    maxOutputTokens:
      prepared.preflight.maxOutputTokensOverride ?? prepared.config.gemini.maxOutputTokens,
  });

  if (!providerStream.ok) {
    await writeBudgetPostflight({
      requestId: prepared.requestId,
      model: prepared.providerHealth.model,
      status: "failed",
      reason: providerStream.error.code,
      estimatedCostUsd: prepared.preflight.estimatedCostUsd,
      monthlySpendBefore: prepared.preflight.monthlySpendUsd,
    });

    return {
      requestId: prepared.requestId,
      providerModel: prepared.providerHealth.model,
      toolContext: prepared.toolContext,
      budget: { status: prepared.preflight.status, reason: providerStream.error.code },
      answerForFallback: prepared.toolOnlyAnswer,
      postflight: null,
      mode: "tool-only",
      streamErrorCode: providerStream.error.code,
    };
  }

  return {
    requestId: prepared.requestId,
    providerModel: prepared.providerHealth.model,
    toolContext: prepared.toolContext,
    budget: { status: prepared.preflight.status, reason: prepared.preflight.reason },
    answerForFallback: prepared.toolOnlyAnswer,
    postflight: {
      estimatedCostUsd: prepared.preflight.estimatedCostUsd,
      monthlySpendBefore: prepared.preflight.monthlySpendUsd,
    },
    mode: "provider-stream",
    stream: providerStream.stream,
  };
}

export async function finalizeTifaStreamSuccess(params: {
  requestId: string;
  model: string;
  estimatedCostUsd: number;
  monthlySpendBefore: number;
  answer: string;
  message: string;
  context?: Record<string, unknown>;
}) {
  await writeBudgetPostflight({
    requestId: params.requestId,
    model: params.model,
    status: "success",
    reason: "OK",
    estimatedCostUsd: params.estimatedCostUsd,
    totalCostUsd: params.estimatedCostUsd,
    monthlySpendBefore: params.monthlySpendBefore,
  });

  await appendTifaChatSession({
    request_id: params.requestId,
    timestamp_utc: new Date().toISOString(),
    message: params.message,
    answer: params.answer,
    context: params.context,
    provider: getTifaRuntimeConfig().llmProvider,
    model: params.model,
  });
}
