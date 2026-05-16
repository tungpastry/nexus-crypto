import type { OpsSummaryOutput } from "../types";
import {
  formatDeepHealthForAssistant,
  formatGeminiHealthForAssistant,
  formatProviderHealthForAssistant,
} from "./healthFormatter";

export function formatOpsSummaryForAssistant(payload: OpsSummaryOutput) {
  const issues = payload.issues.slice(0, 5);
  const recommendations = payload.recommendations.slice(0, 3);

  return [
    "- Ops Executive Summary",
    `  - Headline: ${payload.executive.headline}`,
    `  - Overall status: ${payload.status}`,
    `  - Provider: ${payload.executive.provider_status} | Deep: ${payload.executive.deep_health_status} | Gemini: ${payload.executive.gemini_status} | Budget: ${payload.executive.budget_status}`,
    "",
    formatProviderHealthForAssistant(payload.provider_health),
    "",
    formatDeepHealthForAssistant(payload.deep_health),
    "",
    formatGeminiHealthForAssistant(payload.gemini_health),
    "",
    issues.length
      ? `- Top Issues\n${issues.map((issue) => `  - [${issue.severity}] ${issue.title}: ${issue.detail}`).join("\n")}`
      : "- Top Issues\n  - None",
    "",
    "- Recommendations",
    ...recommendations.map((item) => `  - ${item}`),
  ].join("\n");
}

