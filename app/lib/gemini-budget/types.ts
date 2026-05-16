export type BudgetFailureMode = "fail_closed" | "best_effort";

export type GeminiBudgetPolicy = {
  monthlyCapUsd: number;
  hardStopUsd: number;
  degradeThresholdUsd: number;
  maxRequestsPerMonth: number;
  estCostPerChatUsd: number;
  failureMode: BudgetFailureMode;
  ledgerFile: string;
  stateFile: string;
};

export type GeminiBudgetLedgerEntry = {
  month_utc: string;
  timestamp_utc: string;
  request_id: string;
  status: "success" | "failed" | "blocked_hard_stop" | "blocked_guard";
  reason: string;
  model: string;
  estimated_cost_usd: number;
  total_cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  monthly_spend_before: number;
  monthly_spend_after: number;
};

export type GeminiBudgetMonthlyTotals = {
  month: string;
  monthlySpendUsd: number;
  monthlyRequests: number;
};

export type GeminiBudgetPreflight = {
  allowed: boolean;
  status: "ok" | "degraded" | "blocked";
  reason: string;
  monthlySpendUsd: number;
  monthlyRequests: number;
  projectedSpendUsd: number;
  estimatedCostUsd: number;
  maxOutputTokensOverride?: number;
};
