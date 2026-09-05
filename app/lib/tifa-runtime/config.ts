import fs from "fs";
import path from "path";

export type TifaRuntimeConfig = {
  enabled: boolean;
  timezone: string;
  runtimeDir: string;
  promptPath: string;
  llmProvider: "gemini" | "ollama";
  routingPolicy: string;
  fallbackOrder: string[];
  ollama: {
    host: string;
    model: string;
    timeoutMs: number;
    retryLimit: number;
    streamTimeoutMs: number;
    streamRetryLimit: number;
    think: boolean;
    keepAlive: string;
  };
  gemini: {
    apiKey?: string;
    model: string;
    apiUrl: string;
    timeoutMs: number;
    retryLimit: number;
    maxOutputTokens: number;
    temperature: number;
    streamEnabled: boolean;
    streamTimeoutMs: number;
    streamRetryLimit: number;
    circuitBreaker: {
      enabled: boolean;
      failureThreshold: number;
      cooldownMs: number;
    };
  };
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLlmProvider(value: string | undefined): "gemini" | "ollama" {
  return value?.trim().toLowerCase() === "ollama" ? "ollama" : "gemini";
}

export function getTifaRuntimeConfig(): TifaRuntimeConfig {
  const runtimeDir = process.env.TIFA_RUNTIME_DIR || "runtime";
  const promptPath =
    process.env.TIFA_PROMPT_PATH || "prompts/TIFA_NEXUS_CRYPTO_RUNTIME.md";

  return {
    enabled: process.env.TIFA_ASSISTANT_ENABLED !== "0",
    timezone: process.env.TIFA_TIMEZONE || "Asia/Ho_Chi_Minh",
    runtimeDir,
    promptPath,
    llmProvider: parseLlmProvider(process.env.TIFA_LLM_PROVIDER),
    routingPolicy: process.env.TIFA_LLM_ROUTING_POLICY || "cost-aware",
    fallbackOrder: (process.env.TIFA_LLM_FALLBACK_ORDER || "ollama")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    ollama: {
      host:
        process.env.OLLAMA_HOST === undefined
          ? "http://192.168.1.7:11434"
          : process.env.OLLAMA_HOST,
      model:
        process.env.OLLAMA_MODEL === undefined ? "gemma4:e4b-it-qat" : process.env.OLLAMA_MODEL,
      timeoutMs: parsePositiveInt(process.env.OLLAMA_TIMEOUT_MS, 20_000),
      retryLimit: parsePositiveInt(process.env.OLLAMA_RETRY_LIMIT, 1),
      streamTimeoutMs: parsePositiveInt(process.env.OLLAMA_STREAM_TIMEOUT_MS, 25_000),
      streamRetryLimit: parsePositiveInt(process.env.OLLAMA_STREAM_RETRY_LIMIT, 1),
      think: process.env.OLLAMA_THINK === "1",
      keepAlive: process.env.OLLAMA_KEEP_ALIVE || "30m",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
      apiUrl:
        process.env.GEMINI_API_URL ||
        "https://generativelanguage.googleapis.com/v1beta",
      timeoutMs: parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 20_000),
      retryLimit: parsePositiveInt(process.env.GEMINI_RETRY_LIMIT, 1),
      maxOutputTokens: parsePositiveInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 900),
      temperature: parseNumber(process.env.GEMINI_TEMPERATURE, 0.3),
      streamEnabled: process.env.GEMINI_STREAM_ENABLED !== "0",
      streamTimeoutMs: parsePositiveInt(process.env.GEMINI_STREAM_TIMEOUT_MS, 25_000),
      streamRetryLimit: parsePositiveInt(process.env.GEMINI_STREAM_RETRY_LIMIT, 1),
      circuitBreaker: {
        enabled: process.env.GEMINI_CIRCUIT_BREAKER_ENABLED !== "0",
        failureThreshold: parsePositiveInt(process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD, 3),
        cooldownMs: parsePositiveInt(process.env.GEMINI_CIRCUIT_COOLDOWN_MS, 60_000),
      },
    },
  };
}

export function assertTifaRuntimeSafe(config = getTifaRuntimeConfig()) {
  if (!config.runtimeDir) {
    throw new Error("TIFA_RUNTIME_DIR is empty");
  }
  if (!config.promptPath) {
    throw new Error("TIFA_PROMPT_PATH is empty");
  }
  if (config.gemini.timeoutMs < 1_000 || config.gemini.timeoutMs > 120_000) {
    throw new Error("GEMINI_TIMEOUT_MS must be between 1000 and 120000");
  }
  if (config.gemini.maxOutputTokens < 64 || config.gemini.maxOutputTokens > 8_192) {
    throw new Error("GEMINI_MAX_OUTPUT_TOKENS must be between 64 and 8192");
  }
  if (config.gemini.streamTimeoutMs < 1_000 || config.gemini.streamTimeoutMs > 120_000) {
    throw new Error("GEMINI_STREAM_TIMEOUT_MS must be between 1000 and 120000");
  }
  if (config.llmProvider === "ollama") {
    if (!config.ollama.host) {
      throw new Error("OLLAMA_HOST is empty");
    }
    if (!config.ollama.model) {
      throw new Error("OLLAMA_MODEL is empty");
    }
    if (config.ollama.timeoutMs < 1_000 || config.ollama.timeoutMs > 120_000) {
      throw new Error("OLLAMA_TIMEOUT_MS must be between 1000 and 120000");
    }
    if (
      config.ollama.streamTimeoutMs < 1_000 ||
      config.ollama.streamTimeoutMs > 120_000
    ) {
      throw new Error("OLLAMA_STREAM_TIMEOUT_MS must be between 1000 and 120000");
    }
  }
}

export function resolveRuntimePath(relativeOrAbsolute: string) {
  if (path.isAbsolute(relativeOrAbsolute)) return relativeOrAbsolute;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), relativeOrAbsolute);
}

export function ensureRuntimeDir(config = getTifaRuntimeConfig()) {
  const absolute = resolveRuntimePath(config.runtimeDir);
  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}
