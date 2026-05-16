import axios from "axios";
import { getTifaRuntimeConfig } from "../tifa-runtime/config";
import type { ProviderChatRequest, ProviderGatewayResult } from "./types";

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
      {
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
      },
      {
        timeout: config.gemini.timeoutMs,
      }
    );

    const parts = response.data.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map((part) => part.text || "")
      .join("")
      .trim();

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
      return {
        ok: false,
        provider: "gemini",
        model,
        error: {
          code: "GEMINI_REQUEST_FAILED",
          message: error.response?.data?.error?.message || error.message,
        },
      };
    }

    return {
      ok: false,
      provider: "gemini",
      model,
      error: {
        code: "GEMINI_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Gemini request failed",
      },
    };
  }
}
