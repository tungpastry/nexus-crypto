import axios from "axios";
import type { NextRequest } from "next/server";
import { NEXUS_ASSETS } from "../../config/assets";
import { NEXUS_TIMEFRAMES } from "../../config/timeframes";
import { getGeminiBudgetStatus } from "../gemini-budget/status";
import type { TifaPageContext, TifaToolContext } from "../tifa-core/types";
import { getAssetAnalysisContext } from "../tifa-nexus/assetAnalysisContext";
import { buildInternalAuthHeaders, getMarketContext } from "../tifa-nexus/marketContext";
import { getTifaProviderHealth } from "../tifa-provider-gateway/gateway";
import { sanitizeProviderError } from "../tifa-provider-gateway/redaction";
import { explainDeepHealth } from "./explainers/deepHealthExplainer";
import { explainGeminiProviderHealth } from "./explainers/geminiHealthExplainer";
import { explainOpsSummary } from "./explainers/opsSummaryExplainer";
import { explainProviderHealth } from "./explainers/providerHealthExplainer";
import { getToolsForIntent, isSupportedTool } from "./registry";
import type {
  TifaIntentName,
  TifaOrchestrationResult,
  TifaToolName,
} from "./types";

type OrchestratorParams = {
  req?: NextRequest;
  origin: string;
  intent: TifaIntentName;
  message: string;
  context?: TifaPageContext;
  requestedTools?: TifaToolName[];
};

type ProviderHealthPayload = {
  provider: string;
  status: "ok" | "degraded";
  updated_at: string;
  checks: Record<
    string,
    {
      status: "ok" | "warn" | "error";
      latency_ms?: number;
      value?: string | number | null;
      message?: string;
    }
  >;
};

type DeepHealthPayload = {
  provider: string;
  mode: "deep";
  status: "ok" | "degraded" | "error";
  updated_at: string;
  summary: {
    symbols_total: number;
    symbols_ok: number;
    symbols_warn: number;
    symbols_error: number;
    latency_ms: number;
  };
  checks: Record<
    string,
    {
      status: "ok" | "error";
      price: {
        status: "ok" | "warn" | "error";
        latency_ms: number;
        message?: string;
      };
      klines: {
        status: "ok" | "warn" | "error";
        latency_ms: number;
        candles?: number;
        message?: string;
      };
    }
  >;
};

type GeminiProviderPayload = {
  provider: string;
  assistant_enabled: boolean;
  configured: boolean;
  model: string;
  status: "ok" | "degraded" | "blocked" | "disabled";
  reason?: string;
  stream: {
    enabled: boolean;
    timeout_ms: number;
    retry_limit: number;
  };
  request: {
    timeout_ms: number;
    retry_limit: number;
  };
  circuit: {
    enabled: boolean;
    state: "closed" | "open" | "half_open";
    failure_count: number;
    cooldown_ms: number;
    opened_until: string | null;
    threshold: number;
  };
  budget: {
    status: "ok" | "degraded" | "blocked";
    monthly_spend_usd: number;
    hard_stop_usd: number;
  };
  updated_at: string;
};

function detectAssetId(message: string, context?: TifaPageContext) {
  if (context?.assetId) return context.assetId;
  const text = message.toLowerCase();
  const match = NEXUS_ASSETS.find(
    (asset) =>
      text.includes(asset.id.toLowerCase()) ||
      text.includes(asset.symbol.toLowerCase()) ||
      text.includes(asset.name.toLowerCase())
  );
  return match?.id || "bitcoin";
}

function detectTimeframe(message: string, context?: TifaPageContext) {
  if (context?.timeframe) return context.timeframe;
  const text = message.toLowerCase();
  const timeframe = NEXUS_TIMEFRAMES.find(
    (item) =>
      text.includes(item.label.toLowerCase()) || text.includes(item.binance.toLowerCase())
  );
  return timeframe?.label || "1h";
}

export async function getGeminiProviderHealthSnapshot(): Promise<GeminiProviderPayload> {
  const provider = getTifaProviderHealth();
  const budget = await getGeminiBudgetStatus();
  const providerStatus: GeminiProviderPayload["status"] = provider.configured
    ? budget.status === "ok" || budget.status === "degraded" || budget.status === "blocked"
      ? budget.status
      : "disabled"
    : "disabled";
  const budgetStatus: GeminiProviderPayload["budget"]["status"] =
    budget.status === "ok" || budget.status === "degraded" || budget.status === "blocked"
      ? budget.status
      : "ok";

  return {
    provider: "gemini",
    assistant_enabled: provider.enabled,
    configured: provider.configured,
    model: provider.model,
    status: providerStatus,
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
    budget: {
      status: budgetStatus,
      monthly_spend_usd: budget.monthly_spend_usd,
      hard_stop_usd: budget.hard_stop_usd,
    },
    updated_at: new Date().toISOString(),
  };
}

async function fetchProviderHealth(origin: string, req?: NextRequest) {
  const response = await axios.get<ProviderHealthPayload>(`${origin}/api/provider-health`, {
    timeout: 10_000,
    headers: buildInternalAuthHeaders(req),
  });
  return response.data;
}

async function fetchDeepProviderHealth(origin: string, req?: NextRequest) {
  const response = await axios.get<DeepHealthPayload>(`${origin}/api/provider-health/deep`, {
    timeout: 15_000,
    headers: buildInternalAuthHeaders(req),
  });
  return response.data;
}

async function executeTool(
  tool: TifaToolName,
  params: OrchestratorParams,
  cache: Partial<Record<TifaToolName, unknown>>
): Promise<unknown> {
  if (cache[tool] !== undefined) {
    return cache[tool];
  }

  const { origin, req } = params;

  if (tool === "market_context") {
    const value = await getMarketContext(origin, req);
    cache[tool] = value;
    return value;
  }

  if (tool === "asset_analysis") {
    const value = await getAssetAnalysisContext(
      detectAssetId(params.message, params.context),
      detectTimeframe(params.message, params.context)
    );
    cache[tool] = value;
    return value;
  }

  if (tool === "budget_status") {
    const value = await getGeminiBudgetStatus();
    cache[tool] = value;
    return value;
  }

  if (tool === "gemini_provider_health") {
    const value = await getGeminiProviderHealthSnapshot();
    cache[tool] = value;
    return value;
  }

  if (tool === "provider_health") {
    const value = await fetchProviderHealth(origin, req);
    cache[tool] = value;
    return value;
  }

  if (tool === "deep_provider_health") {
    const value = await fetchDeepProviderHealth(origin, req);
    cache[tool] = value;
    return value;
  }

  if (tool === "provider_health_explainer") {
    const providerHealth = (await executeTool(
      "provider_health",
      params,
      cache
    )) as ProviderHealthPayload;
    const value = explainProviderHealth(providerHealth);
    cache[tool] = value;
    return value;
  }

  if (tool === "deep_health_explainer") {
    const deepHealth = (await executeTool(
      "deep_provider_health",
      params,
      cache
    )) as DeepHealthPayload;
    const value = explainDeepHealth(deepHealth);
    cache[tool] = value;
    return value;
  }

  if (tool === "ops_summary") {
    const [providerHealthRaw, deepHealthRaw, geminiHealthRaw, budgetStatus] =
      (await Promise.all([
        executeTool("provider_health", params, cache),
        executeTool("deep_provider_health", params, cache),
        executeTool("gemini_provider_health", params, cache),
        executeTool("budget_status", params, cache),
      ])) as [ProviderHealthPayload, DeepHealthPayload, GeminiProviderPayload, { status?: "ok" | "degraded" | "blocked" }];

    const providerHealth = explainProviderHealth(providerHealthRaw);
    const deepHealth = explainDeepHealth(deepHealthRaw);
    const geminiHealth = explainGeminiProviderHealth(geminiHealthRaw);
    const value = explainOpsSummary({
      providerHealth,
      deepHealth,
      geminiHealth,
      budget: budgetStatus,
    });
    cache["provider_health_explainer"] = providerHealth;
    cache["deep_health_explainer"] = deepHealth;
    cache[tool] = value;
    return value;
  }

  throw new Error(`Unsupported tool: ${tool}`);
}

export async function orchestrateTifaTools(
  params: OrchestratorParams
): Promise<TifaOrchestrationResult> {
  const toolsRequested = params.requestedTools?.length
    ? params.requestedTools
    : getToolsForIntent(params.intent);
  const toolsUsed: TifaToolName[] = [];
  const outputs: Partial<Record<TifaToolName, unknown>> = {};
  const warnings: string[] = [];

  for (const tool of toolsRequested) {
    if (!isSupportedTool(tool)) {
      warnings.push(`TOOL_NOT_ALLOWED:${tool}`);
      continue;
    }

    try {
      outputs[tool] = await executeTool(tool, params, outputs);
      toolsUsed.push(tool);
    } catch (error) {
      warnings.push(
        `${tool}:${
          sanitizeProviderError(error, "Tool execution failed").slice(0, 180)
        }`
      );
    }
  }

  return {
    ok: true,
    intent: params.intent,
    tools_requested: toolsRequested,
    tools_used: toolsUsed,
    outputs,
    warnings,
  };
}

export function mapOrchestrationToToolContext(
  result: TifaOrchestrationResult
): TifaToolContext {
  return {
    intent: result.intent,
    market_context: result.outputs.market_context,
    asset_analysis_context: result.outputs.asset_analysis,
    budget_context: result.outputs.budget_status,
    provider_health_context: result.outputs.provider_health,
    deep_health_context: result.outputs.deep_provider_health,
    gemini_provider_health_context: result.outputs.gemini_provider_health,
    provider_health_explainer_context: result.outputs.provider_health_explainer,
    deep_health_explainer_context: result.outputs.deep_health_explainer,
    ops_summary_context: result.outputs.ops_summary,
    tool_orchestration: {
      tools_requested: result.tools_requested,
      tools_used: result.tools_used,
      warnings: result.warnings,
    },
  };
}
