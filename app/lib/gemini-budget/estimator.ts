import type { GeminiBudgetPolicy } from "./types";

export function estimateChatCostUsd(policy: GeminiBudgetPolicy) {
  return policy.estCostPerChatUsd;
}
