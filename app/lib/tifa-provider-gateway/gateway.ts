import { getTifaRuntimeConfig } from "../tifa-runtime/config";
import { runGeminiChat } from "./gemini";
import type {
  ProviderChatRequest,
  ProviderGatewayResult,
  ProviderHealth,
} from "./types";

export async function runTifaProviderGateway(
  request: ProviderChatRequest
): Promise<ProviderGatewayResult> {
  return runGeminiChat(request);
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
    reason: configured ? undefined : "GEMINI_API_KEY is missing",
  };
}
