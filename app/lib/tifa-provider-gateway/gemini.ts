import axios from "axios";
import { getTifaRuntimeConfig } from "../tifa-runtime/config";
import { redactSecrets, sanitizeProviderError } from "./redaction";
import type {
  ProviderChatRequest,
  ProviderGatewayResult,
  ProviderStreamGatewayResult,
} from "./types";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    code?: number;
    message?: string;
  };
};

function buildGeminiBody(request: ProviderChatRequest) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${request.systemPrompt}\n\nUSER_MESSAGE:\n${request.userPrompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
    },
  };
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const parts = root.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter(Boolean);
}

function createStreamReader(response: Response): AsyncIterable<string> {
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
            const parsed = JSON.parse(data) as unknown;
            output.push(...extractGeminiText(parsed));
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

export async function runGeminiChat(
  request: ProviderChatRequest
): Promise<ProviderGatewayResult> {
  const config = getTifaRuntimeConfig();
  const apiKey = config.gemini.apiKey;
  const model = config.gemini.model;

  if (!apiKey) {
    return {
      ok: false,
      provider: "gemini",
      model,
      error: {
        code: "GEMINI_NOT_CONFIGURED",
        message: "GEMINI_API_KEY is not configured.",
      },
    };
  }

  const url = `${config.gemini.apiUrl}/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post<GeminiGenerateContentResponse>(
      url,
      buildGeminiBody(request),
      { timeout: config.gemini.timeoutMs }
    );

    const text = extractGeminiText(response.data).join("").trim();
    if (!text) {
      return {
        ok: false,
        provider: "gemini",
        model,
        error: {
          code: "GEMINI_EMPTY_RESPONSE",
          message: "Gemini returned empty content.",
        },
      };
    }

    return {
      ok: true,
      provider: "gemini",
      model,
      text,
      usage: response.data.usageMetadata,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const vendorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message;

      return {
        ok: false,
        provider: "gemini",
        model,
        error: {
          code: "GEMINI_REQUEST_FAILED",
          message: sanitizeProviderError(vendorMessage),
        },
      };
    }

    return {
      ok: false,
      provider: "gemini",
      model,
      error: {
        code: "GEMINI_REQUEST_FAILED",
        message: sanitizeProviderError(error),
      },
    };
  }
}

export async function runGeminiChatStream(
  request: ProviderChatRequest
): Promise<ProviderStreamGatewayResult> {
  const config = getTifaRuntimeConfig();
  const apiKey = config.gemini.apiKey;
  const model = config.gemini.model;

  if (!config.gemini.streamEnabled) {
    return {
      ok: false,
      provider: "gemini",
      model,
      error: {
        code: "GEMINI_STREAM_DISABLED",
        message: "Gemini streaming is disabled by configuration.",
      },
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      provider: "gemini",
      model,
      error: {
        code: "GEMINI_NOT_CONFIGURED",
        message: "GEMINI_API_KEY is not configured.",
      },
    };
  }

  const url = `${config.gemini.apiUrl}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.gemini.streamTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGeminiBody(request)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        provider: "gemini",
        model,
        error: {
          code: "GEMINI_STREAM_FAILED",
          message: sanitizeProviderError(text || `Gemini stream failed (${response.status})`),
        },
      };
    }

    if (!response.body) {
      return {
        ok: false,
        provider: "gemini",
        model,
        error: {
          code: "GEMINI_STREAM_FAILED",
          message: "Gemini stream returned no body.",
        },
      };
    }

    return {
      ok: true,
      provider: "gemini",
      model,
      stream: createStreamReader(response),
    };
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      model,
      error: {
        code: "GEMINI_STREAM_FAILED",
        message: sanitizeProviderError(error),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
