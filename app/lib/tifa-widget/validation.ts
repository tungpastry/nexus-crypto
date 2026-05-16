import type { TifaChatInput, TifaPageContext } from "../tifa-core/types";

function cleanString(value: unknown, max = 160) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export function sanitizeTifaContext(value: unknown): TifaPageContext | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return {
    page: cleanString((value as { page?: unknown }).page, 120),
    assetId: cleanString((value as { assetId?: unknown }).assetId, 80),
    timeframe: cleanString((value as { timeframe?: unknown }).timeframe, 24),
  };
}

export function validateTifaChatInput(value: unknown): TifaChatInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid request body");
  }

  const message = cleanString((value as { message?: unknown }).message, 1_500);
  if (!message) {
    throw new Error("Message is required");
  }

  return {
    message,
    context: sanitizeTifaContext((value as { context?: unknown }).context),
  };
}
