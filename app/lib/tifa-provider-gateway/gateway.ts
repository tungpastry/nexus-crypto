import { getTifaRuntimeConfig } from "../tifa-runtime/config";
import {
  beginGeminiCircuitAttempt,
  finalizeGeminiCircuitAttempt,
  getGeminiCircuitSnapshot,
} from "./circuitBreaker";
import { runGeminiChat, runGeminiChatStream } from "./gemini";
import type {
  ProviderChatRequest,
  ProviderGatewayResult,
  ProviderHealth,
  ProviderStreamGatewayResult,
} from "./types";

async function runWithRetry(
  task: () => Promise<ProviderGatewayResult>,
  retryLimit: number
): Promise<ProviderGatewayResult> {
  let lastResult: ProviderGatewayResult | null = null;

  for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
    const result = await task();
    if (result.ok) return result;
    lastResult = result;
  }

  return (
    lastResult || {
      ok: false,
      provider: "gemini",
      model: getTifaRuntimeConfig().gemini.model,
      error: {
        code: "GEMINI_REQUEST_FAILED",
        message: "Gemini request failed.",
      },
    }
  );
}

async function runStreamWithRetry(
  task: () => Promise<ProviderStreamGatewayResult>,
  retryLimit: number
): Promise<ProviderStreamGatewayResult> {
  let lastResult: ProviderStreamGatewayResult | null = null;

  for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
    const result = await task();
    if (result.ok) return result;
    lastResult = result;
  }

  return (
    lastResult || {
      ok: false,
      provider: "gemini",
      model: getTifaRuntimeConfig().gemini.model,
      error: {
        code: "GEMINI_STREAM_FAILED",
        message: "Gemini stream failed.",
      },
    }
  );
}

function blockedByCircuitError(): ProviderGatewayResult {
  return {
    ok: false,
    provider: "gemini",
    model: getTifaRuntimeConfig().gemini.model,
    error: {
      code: "GEMINI_CIRCUIT_OPEN",
      message: "Gemini provider is temporarily disabled by circuit breaker.",
    },
  };
}

function blockedByCircuitStreamError(): ProviderStreamGatewayResult {
  return {
    ok: false,
    provider: "gemini",
    model: getTifaRuntimeConfig().gemini.model,
    error: {
      code: "GEMINI_CIRCUIT_OPEN",
      message: "Gemini provider is temporarily disabled by circuit breaker.",
    },
  };
}

export async function runTifaProviderGateway(
  request: ProviderChatRequest
): Promise<ProviderGatewayResult> {
  const config = getTifaRuntimeConfig();
  const attempt = beginGeminiCircuitAttempt();
  if (!attempt.allowed) {
    return blockedByCircuitError();
  }

  const result = await runWithRetry(() => runGeminiChat(request), config.gemini.retryLimit);
  finalizeGeminiCircuitAttempt(result.ok);
  return result;
}

export async function runTifaProviderGatewayStream(
  request: ProviderChatRequest
): Promise<ProviderStreamGatewayResult> {
  const config = getTifaRuntimeConfig();
  const attempt = beginGeminiCircuitAttempt();
  if (!attempt.allowed) {
    return blockedByCircuitStreamError();
  }

  const result = await runStreamWithRetry(
    () => runGeminiChatStream(request),
    config.gemini.streamRetryLimit
  );
  finalizeGeminiCircuitAttempt(result.ok);
  return result;
}

export function getTifaProviderHealth(): ProviderHealth {
  const config = getTifaRuntimeConfig();
  const enabled = config.enabled;
  const configured = Boolean(config.gemini.apiKey);

  return {
    provider: "gemini",
    model: config.gemini.model,
    enabled,
    configured,
    stream_enabled: config.gemini.streamEnabled,
    retry_limit: config.gemini.retryLimit,
    timeout_ms: config.gemini.timeoutMs,
    stream_retry_limit: config.gemini.streamRetryLimit,
    stream_timeout_ms: config.gemini.streamTimeoutMs,
    circuit: getGeminiCircuitSnapshot(),
    reason: configured ? undefined : "GEMINI_API_KEY is missing",
  };
}
