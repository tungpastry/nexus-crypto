import { ensureLedgerFiles, getCurrentMonthUtc, readMonthlyTotals } from "./ledger";
import { getGeminiBudgetPolicy } from "./policy";

export async function getGeminiBudgetStatus() {
  const policy = getGeminiBudgetPolicy();
  await ensureLedgerFiles(policy);
  const totals = await readMonthlyTotals(policy, getCurrentMonthUtc());
  const isOllama = process.env.TIFA_LLM_PROVIDER?.trim().toLowerCase() === "ollama";
  if (isOllama) {
    return {
      provider: "ollama",
      model: process.env.OLLAMA_MODEL || "gemma4:e4b-it-qat",
      current_month: totals.month,
      monthly_cap_usd: policy.monthlyCapUsd,
      hard_stop_usd: policy.hardStopUsd,
      degrade_threshold_usd: policy.degradeThresholdUsd,
      monthly_spend_usd: Number(totals.monthlySpendUsd.toFixed(6)),
      monthly_requests: totals.monthlyRequests,
      remaining_hard_stop_usd: Number(
        Math.max(0, policy.hardStopUsd - totals.monthlySpendUsd).toFixed(6)
      ),
      status: "ok",
      failure_mode: policy.failureMode,
      note: "OLLAMA_LOCAL_FREE",
    };
  }
  const remainingHardStop = Math.max(0, policy.hardStopUsd - totals.monthlySpendUsd);
  const projected = totals.monthlySpendUsd + policy.estCostPerChatUsd;

  const status =
    projected >= policy.hardStopUsd
      ? "blocked"
      : projected >= policy.degradeThresholdUsd
        ? "degraded"
        : "ok";

  return {
    provider: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    current_month: totals.month,
    monthly_cap_usd: policy.monthlyCapUsd,
    hard_stop_usd: policy.hardStopUsd,
    degrade_threshold_usd: policy.degradeThresholdUsd,
    monthly_spend_usd: Number(totals.monthlySpendUsd.toFixed(6)),
    monthly_requests: totals.monthlyRequests,
    remaining_hard_stop_usd: Number(remainingHardStop.toFixed(6)),
    status,
    failure_mode: policy.failureMode,
  };
}
