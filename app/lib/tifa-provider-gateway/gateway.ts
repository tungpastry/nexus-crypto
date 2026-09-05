import { getTifaRuntimeConfig } from "../tifa-runtime/config";
import {
  beginLlmCircuitAttempt,
  finalizeLlmCircuitAttempt,
  getLlmCircuitSnapshot,
} from "./circuitBreaker";
import { runGeminiChat, runGeminiChatStream } from "./gemini";
import { runOllamaChat, runOllamaChatStream } from "./ollama";
import type {
  LlmProviderName,
  ProviderChatRequest,
  ProviderGatewayResult,
  ProviderHealth,
  ProviderStreamGatewayResult,
} from "./types";

function activeProvider(): LlmProviderName {
  return getTifaRuntimeConfig().llmProvider;
}

function activeModel(): string {
  const config = getTifaRuntimeConfig();
  return config.llmProvider === "ollama" ? config.ollama.model : config.gemini.model;
}

async function runWithRetry(
  provider: LlmProviderName,
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
      provider,
      model: activeModel(),
      error: {
        code: provider === "ollama" ? "OLLAMA_REQUEST_FAILED" : "GEMINI_REQUEST_FAILED",
        message: provider === "ollama" ? "Ollama request failed." : "Gemini request failed.",
      },
    }
  );
}

async function runStreamWithRetry(
  provider: LlmProviderName,
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
      provider,
      model: activeModel(),
      error: {
        code: provider === "ollama" ? "OLLAMA_STREAM_FAILED" : "GEMINI_STREAM_FAILED",
        message: provider === "ollama" ? "Ollama stream failed." : "Gemini stream failed.",
      },
    }
  );
}

function blockedByCircuitError(provider: LlmProviderName): ProviderGatewayResult {
  return {
    ok: false,
    provider,
    model: activeModel(),
    error: {
      code: provider === "ollama" ? "OLLAMA_CIRCUIT_OPEN" : "GEMINI_CIRCUIT_OPEN",
      message:
        provider === "ollama"
          ? "Ollama provider is temporarily disabled by circuit breaker."
          : "Gemini provider is temporarily disabled by circuit breaker.",
    },
  };
}

function blockedByCircuitStreamError(
  provider: LlmProviderName
): ProviderStreamGatewayResult {
  return {
    ok: false,
    provider,
    model: activeModel(),
    error: {
      code: provider === "ollama" ? "OLLAMA_CIRCUIT_OPEN" : "GEMINI_CIRCUIT_OPEN",
      message:
        provider === "ollama"
          ? "Ollama provider is temporarily disabled by circuit breaker."
          : "Gemini provider is temporarily disabled by circuit breaker.",
    },
  };
}

export async function runTifaProviderGateway(
  request: ProviderChatRequest
): Promise<ProviderGatewayResult> {
  const config = getTifaRuntimeConfig();
  const provider = activeProvider();
  const attempt = beginLlmCircuitAttempt(provider);
  if (!attempt.allowed) {
    return blockedByCircuitError(provider);
  }

  // Ollama-only runtime: never auto-fallback to Gemini here. Failures fall
  // through to the tool-only answer in tifa-core/chat.ts.
  const result =
    provider === "ollama"
      ? await runWithRetry(provider, () => runOllamaChat(request), config.ollama.retryLimit)
      : await runWithRetry(provider, () => runGeminiChat(request), config.gemini.retryLimit);
  finalizeLlmCircuitAttempt(provider, result.ok);
  return result;
}

export async function runTifaProviderGatewayStream(
  request: ProviderChatRequest
): Promise<ProviderStreamGatewayResult> {
  const config = getTifaRuntimeConfig();
  const provider = activeProvider();
  const attempt = beginLlmCircuitAttempt(provider);
  if (!attempt.allowed) {
    return blockedByCircuitStreamError(provider);
  }

  const result =
    provider === "ollama"
      ? await runStreamWithRetry(
          provider,
          () => runOllamaChatStream(request),
          config.ollama.streamRetryLimit
        )
      : await runStreamWithRetry(
          provider,
          () => runGeminiChatStream(request),
          config.gemini.streamRetryLimit
        );
  finalizeLlmCircuitAttempt(provider, result.ok);
  return result;
}

export function getTifaProviderHealth(): ProviderHealth {
  const config = getTifaRuntimeConfig();
  const enabled = config.enabled;
  const provider = activeProvider();

  if (provider === "ollama") {
    const configured = Boolean(config.ollama.host && config.ollama.model);
    return {
      provider,
      model: config.ollama.model,
      enabled,
      configured,
      stream_enabled: true,
      retry_limit: config.ollama.retryLimit,
      timeout_ms: config.ollama.timeoutMs,
      stream_retry_limit: config.ollama.streamRetryLimit,
      stream_timeout_ms: config.ollama.streamTimeoutMs,
      circuit: getLlmCircuitSnapshot("ollama"),
      reason: configured ? undefined : "OLLAMA_HOST or OLLAMA_MODEL is missing",
    };
  }

  const configured = Boolean(config.gemini.apiKey);

  return {
    provider,
    model: config.gemini.model,
    enabled,
    configured,
    stream_enabled: config.gemini.streamEnabled,
    retry_limit: config.gemini.retryLimit,
    timeout_ms: config.gemini.timeoutMs,
    stream_retry_limit: config.gemini.streamRetryLimit,
    stream_timeout_ms: config.gemini.streamTimeoutMs,
    circuit: getLlmCircuitSnapshot("gemini"),
    reason: configured ? undefined : "GEMINI_API_KEY is missing",
  };
}
