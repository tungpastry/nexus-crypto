import { estimateChatCostUsd } from "./estimator";
import {
  appendLedgerEntry,
  ensureLedgerFiles,
  getCurrentMonthUtc,
  readMonthlyTotals,
  writeBudgetState,
} from "./ledger";
import { assertGeminiBudgetPolicy, getGeminiBudgetPolicy } from "./policy";
import type { GeminiBudgetPreflight } from "./types";

type BudgetPostflightInput = {
  requestId: string;
  model: string;
  status: "success" | "failed";
  reason: string;
  estimatedCostUsd: number;
  totalCostUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  monthlySpendBefore: number;
};

export async function runBudgetPreflight(
  requestId: string,
  model: string
): Promise<GeminiBudgetPreflight> {
  // Ollama-only runtime: local inference is free. Bypass USD guard but keep
  // ledger observability with cost 0.
  if (process.env.TIFA_LLM_PROVIDER?.trim().toLowerCase() === "ollama") {
    try {
      const policy = getGeminiBudgetPolicy();
      await ensureLedgerFiles(policy);
      const totals = await readMonthlyTotals(policy);
      return {
        allowed: true,
        status: "ok",
        reason: "OLLAMA_LOCAL_FREE",
        monthlySpendUsd: totals.monthlySpendUsd,
        monthlyRequests: totals.monthlyRequests,
        projectedSpendUsd: totals.monthlySpendUsd,
        estimatedCostUsd: 0,
      };
    } catch {
      return {
        allowed: true,
        status: "ok",
        reason: "OLLAMA_LOCAL_FREE",
        monthlySpendUsd: 0,
        monthlyRequests: 0,
        projectedSpendUsd: 0,
        estimatedCostUsd: 0,
      };
    }
  }

  const policy = getGeminiBudgetPolicy();
  try {
    assertGeminiBudgetPolicy(policy);
    await ensureLedgerFiles(policy);
    const totals = await readMonthlyTotals(policy);
    const estimatedCostUsd = estimateChatCostUsd(policy);
    const projectedSpendUsd = totals.monthlySpendUsd + estimatedCostUsd;

    if (totals.monthlyRequests >= policy.maxRequestsPerMonth) {
      return {
        allowed: false,
        status: "blocked",
        reason: "GEMINI_BUDGET_MAX_REQUESTS_REACHED",
        monthlySpendUsd: totals.monthlySpendUsd,
        monthlyRequests: totals.monthlyRequests,
        projectedSpendUsd,
        estimatedCostUsd,
      };
    }

    if (projectedSpendUsd >= policy.hardStopUsd) {
      await appendLedgerEntry(policy, {
        month_utc: totals.month,
        timestamp_utc: new Date().toISOString(),
        request_id: requestId,
        status: "blocked_hard_stop",
        reason: "GEMINI_BUDGET_HARD_STOP",
        model,
        estimated_cost_usd: estimatedCostUsd,
        total_cost_usd: 0,
        input_tokens: 0,
        output_tokens: 0,
        monthly_spend_before: totals.monthlySpendUsd,
        monthly_spend_after: totals.monthlySpendUsd,
      });

      return {
        allowed: false,
        status: "blocked",
        reason: "GEMINI_BUDGET_HARD_STOP",
        monthlySpendUsd: totals.monthlySpendUsd,
        monthlyRequests: totals.monthlyRequests,
        projectedSpendUsd,
        estimatedCostUsd,
      };
    }

    if (projectedSpendUsd >= policy.degradeThresholdUsd) {
      return {
        allowed: true,
        status: "degraded",
        reason: "GEMINI_BUDGET_DEGRADED",
        monthlySpendUsd: totals.monthlySpendUsd,
        monthlyRequests: totals.monthlyRequests,
        projectedSpendUsd,
        estimatedCostUsd,
        maxOutputTokensOverride: 480,
      };
    }

    return {
      allowed: true,
      status: "ok",
      reason: "GEMINI_BUDGET_OK",
      monthlySpendUsd: totals.monthlySpendUsd,
      monthlyRequests: totals.monthlyRequests,
      projectedSpendUsd,
      estimatedCostUsd,
    };
  } catch (error) {
    if (policy.failureMode === "best_effort") {
      return {
        allowed: true,
        status: "degraded",
        reason: "GEMINI_BUDGET_GUARD_UNAVAILABLE",
        monthlySpendUsd: 0,
        monthlyRequests: 0,
        projectedSpendUsd: 0,
        estimatedCostUsd: policy.estCostPerChatUsd,
      };
    }

    return {
      allowed: false,
      status: "blocked",
      reason:
        error instanceof Error
          ? `GEMINI_BUDGET_GUARD_UNAVAILABLE:${error.message}`
          : "GEMINI_BUDGET_GUARD_UNAVAILABLE",
      monthlySpendUsd: 0,
      monthlyRequests: 0,
      projectedSpendUsd: 0,
      estimatedCostUsd: policy.estCostPerChatUsd,
    };
  }
}

export async function writeBudgetPostflight(input: BudgetPostflightInput) {
  const policy = getGeminiBudgetPolicy();
  await ensureLedgerFiles(policy);
  const totals = await readMonthlyTotals(policy, getCurrentMonthUtc());
  const month = totals.month;
  const timestamp = new Date().toISOString();
  const totalCost = input.totalCostUsd ?? input.estimatedCostUsd;
  const spendAfter =
    input.status === "success"
      ? input.monthlySpendBefore + totalCost
      : input.monthlySpendBefore;

  await appendLedgerEntry(policy, {
    month_utc: month,
    timestamp_utc: timestamp,
    request_id: input.requestId,
    status: input.status,
    reason: input.reason,
    model: input.model,
    estimated_cost_usd: input.estimatedCostUsd,
    total_cost_usd: totalCost,
    input_tokens: input.inputTokens ?? 0,
    output_tokens: input.outputTokens ?? 0,
    monthly_spend_before: input.monthlySpendBefore,
    monthly_spend_after: spendAfter,
  });

  await writeBudgetState(policy, {
    current_month: month,
    monthly_spend_usd: spendAfter,
    monthly_requests: totals.monthlyRequests + 1,
    updated_at: timestamp,
    last_request_id: input.requestId,
    last_status: input.status,
    last_reason: input.reason,
  });
}
