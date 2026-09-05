import axios from "axios";
import { getTifaRuntimeConfig } from "../tifa-runtime/config";
import { redactSecrets, sanitizeProviderError } from "./redaction";
import type {
  ProviderChatRequest,
  ProviderGatewayResult,
  ProviderStreamGatewayResult,
} from "./types";

type OllamaChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

function buildOllamaBody(request: ProviderChatRequest, stream: boolean) {
  const config = getTifaRuntimeConfig();
  return {
    model: config.ollama.model,
    stream,
    temperature: request.temperature,
    max_tokens: request.maxOutputTokens,
    // Gemma4 enables thinking by default; reasoning tokens would consume
    // max_tokens and leave content empty, so force it off for Tifa.
    think: false,
    reasoning_effort: "none",
    keep_alive: config.ollama.keepAlive,
    messages: [
      { role: "system", content: request.systemPrompt },
      { role: "user", content: request.userPrompt },
    ],
  };
}

function extractOllamaText(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as OllamaChatCompletionsResponse;
  const content = root.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? [content] : [];
}

function mapOllamaUsage(payload: OllamaChatCompletionsResponse) {
  if (!payload.usage) return undefined;
  return {
    promptTokenCount: payload.usage.prompt_tokens,
    candidatesTokenCount: payload.usage.completion_tokens,
    totalTokenCount: payload.usage.total_tokens,
  };
}

function createOllamaStreamReader(response: Response): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]: async function* iterator() {
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const emitBlock = (block: string): string[] => {
        const lines = block.split("\n");
        const dataLines = lines
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .filter(Boolean);

        if (!dataLines.length) return [];

        const output: string[] = [];
        for (const data of dataLines) {
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{
                delta?: { content?: string | null };
                message?: { content?: string | null };
              }>;
            };
            const chunk =
              parsed.choices?.[0]?.delta?.content ??
              parsed.choices?.[0]?.message?.content ??
              "";
            // Deliberately ignore delta.reasoning: Gemma thinking output must
            // never leak into the Tifa answer stream.
            if (typeof chunk === "string" && chunk) output.push(chunk);
          } catch {
            const sanitized = redactSecrets(data);
            if (sanitized) output.push(sanitized);
          }
        }
        return output;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const index = buffer.indexOf("\n\n");
          if (index === -1) break;
          const block = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 2);
          if (!block) continue;
          for (const text of emitBlock(block)) {
            yield text;
          }
        }
      }

      const tail = buffer.trim();
      if (tail) {
        for (const text of emitBlock(tail)) {
          yield text;
        }
      }
    },
  };
}

export async function runOllamaChat(
  request: ProviderChatRequest
): Promise<ProviderGatewayResult> {
  const config = getTifaRuntimeConfig();
  const host = config.ollama.host.replace(/\/$/, "");
  const model = config.ollama.model;

  if (!host || !model) {
    return {
      ok: false,
      provider: "ollama",
      model,
      error: {
        code: "OLLAMA_NOT_CONFIGURED",
        message: "OLLAMA_HOST or OLLAMA_MODEL is not configured.",
      },
    };
  }

  try {
    const response = await axios.post<OllamaChatCompletionsResponse>(
      `${host}/v1/chat/completions`,
      buildOllamaBody(request, false),
      { timeout: config.ollama.timeoutMs }
    );

    const text = extractOllamaText(response.data).join("").trim();
    if (!text) {
      return {
        ok: false,
        provider: "ollama",
        model,
        error: {
          code: "OLLAMA_EMPTY_RESPONSE",
          message: "Ollama returned empty content.",
        },
      };
    }

    return {
      ok: true,
      provider: "ollama",
      model,
      text,
      usage: mapOllamaUsage(response.data),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const vendorMessage =
        (error.response?.data as { error?: { message?: string } } | undefined)?.error
          ?.message ||
        (error.response?.data as { message?: string } | undefined)?.message ||
        error.message;

      return {
        ok: false,
        provider: "ollama",
        model,
        error: {
          code: "OLLAMA_REQUEST_FAILED",
          message: sanitizeProviderError(vendorMessage),
        },
      };
    }

    return {
      ok: false,
      provider: "ollama",
      model,
      error: {
        code: "OLLAMA_REQUEST_FAILED",
        message: sanitizeProviderError(error),
      },
    };
  }
}

export async function runOllamaChatStream(
  request: ProviderChatRequest
): Promise<ProviderStreamGatewayResult> {
  const config = getTifaRuntimeConfig();
  const host = config.ollama.host.replace(/\/$/, "");
  const model = config.ollama.model;

  if (!host || !model) {
    return {
      ok: false,
      provider: "ollama",
      model,
      error: {
        code: "OLLAMA_NOT_CONFIGURED",
        message: "OLLAMA_HOST or OLLAMA_MODEL is not configured.",
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ollama.streamTimeoutMs);

  try {
    const response = await fetch(`${host}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildOllamaBody(request, true)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        provider: "ollama",
        model,
        error: {
          code: "OLLAMA_STREAM_FAILED",
          message: sanitizeProviderError(text || `Ollama stream failed (${response.status})`),
        },
      };
    }

    if (!response.body) {
      return {
        ok: false,
        provider: "ollama",
        model,
        error: {
          code: "OLLAMA_STREAM_FAILED",
          message: "Ollama stream returned no body.",
        },
      };
    }

    return {
      ok: true,
      provider: "ollama",
      model,
      stream: createOllamaStreamReader(response),
    };
  } catch (error) {
    return {
      ok: false,
      provider: "ollama",
      model,
      error: {
        code: "OLLAMA_STREAM_FAILED",
        message: sanitizeProviderError(error),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
