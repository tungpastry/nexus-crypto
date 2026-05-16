import { readFile } from "fs/promises";
import { getTifaRuntimeConfig, resolveRuntimePath } from "../tifa-runtime/config";
import type { TifaToolContext } from "../tifa-core/types";

const FALLBACK_PROMPT = `You are TifaWidget Assistant for Nexus Crypto.
Use only provided tool context.
If data is missing, say so clearly.
Do not provide trading recommendations.
Use orchestration context for provider/deep health and ops summaries.
Always include: Market data only.`;

export async function loadTifaRuntimePrompt() {
  const config = getTifaRuntimeConfig();
  const promptPath = resolveRuntimePath(config.promptPath);
  try {
    return await readFile(promptPath, "utf8");
  } catch {
    return FALLBACK_PROMPT;
  }
}

export function buildUserPrompt(
  message: string,
  toolContext: TifaToolContext,
  timezone: string
) {
  return [
    `User timezone: ${timezone}`,
    `User message: ${message}`,
    `Tool context JSON:`,
    JSON.stringify(toolContext, null, 2),
    "Return a concise grounded answer with bullet points when useful.",
    "Do not invent metrics or statuses that are missing in tool context.",
    "When provider/deep health or ops summary context exists, explain issues and next checks clearly.",
    "Always remind: market data only, not financial advice.",
  ].join("\n\n");
}
