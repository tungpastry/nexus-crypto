import { readFileSync } from "fs";
import path from "path";
import type { GeminiBudgetPolicy } from "./types";

const POLICY_FILE = path.join(process.cwd(), ".gemini_budget_policy");

const DEFAULTS: GeminiBudgetPolicy = {
  monthlyCapUsd: 5,
  hardStopUsd: 4.5,
  degradeThresholdUsd: 4,
  maxRequestsPerMonth: 500,
  estCostPerChatUsd: 0.01,
  failureMode: "fail_closed",
  ledgerFile: "runtime/gemini_budget/gemini_monthly_ledger.csv",
  stateFile: "runtime/gemini_budget/gemini_budget_state.json",
};

function readNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readPolicyFileValues(): Record<string, string> {
  try {
    const raw = readFileSync(POLICY_FILE, "utf8");
    const lines = raw.split(/\r?\n/);
    const values: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
}

function envOrPolicy(
  key: string,
  policyValues: Record<string, string>
): string | undefined {
  return process.env[key] ?? policyValues[key];
}

export function getGeminiBudgetPolicy(): GeminiBudgetPolicy {
  const policyValues = readPolicyFileValues();
  const failureMode = envOrPolicy("NEXUS_GEMINI_BUDGET_FAILURE_MODE", policyValues);

  return {
    monthlyCapUsd: readNumber(
      envOrPolicy("NEXUS_GEMINI_MONTHLY_CAP_USD", policyValues),
      DEFAULTS.monthlyCapUsd
    ),
    hardStopUsd: readNumber(
      envOrPolicy("NEXUS_GEMINI_HARD_STOP_USD", policyValues),
      DEFAULTS.hardStopUsd
    ),
    degradeThresholdUsd: readNumber(
      envOrPolicy("NEXUS_GEMINI_DEGRADE_THRESHOLD_USD", policyValues),
      DEFAULTS.degradeThresholdUsd
    ),
    maxRequestsPerMonth: readInt(
      envOrPolicy("NEXUS_GEMINI_MAX_REQUESTS_PER_MONTH", policyValues),
      DEFAULTS.maxRequestsPerMonth
    ),
    estCostPerChatUsd: readNumber(
      envOrPolicy("NEXUS_GEMINI_EST_COST_PER_CHAT_USD", policyValues),
      DEFAULTS.estCostPerChatUsd
    ),
    failureMode: failureMode === "best_effort" ? "best_effort" : "fail_closed",
    ledgerFile:
      envOrPolicy("NEXUS_GEMINI_LEDGER_FILE", policyValues) || DEFAULTS.ledgerFile,
    stateFile:
      envOrPolicy("NEXUS_GEMINI_STATE_FILE", policyValues) || DEFAULTS.stateFile,
  };
}

export function assertGeminiBudgetPolicy(policy = getGeminiBudgetPolicy()) {
  if (policy.monthlyCapUsd <= 0) {
    throw new Error("NEXUS_GEMINI_MONTHLY_CAP_USD must be > 0");
  }
  if (policy.hardStopUsd <= 0 || policy.hardStopUsd > policy.monthlyCapUsd) {
    throw new Error("NEXUS_GEMINI_HARD_STOP_USD must be > 0 and <= monthly cap");
  }
  if (
    policy.degradeThresholdUsd <= 0 ||
    policy.degradeThresholdUsd > policy.monthlyCapUsd
  ) {
    throw new Error(
      "NEXUS_GEMINI_DEGRADE_THRESHOLD_USD must be > 0 and <= monthly cap"
    );
  }
  if (policy.maxRequestsPerMonth <= 0) {
    throw new Error("NEXUS_GEMINI_MAX_REQUESTS_PER_MONTH must be > 0");
  }
  if (policy.estCostPerChatUsd <= 0) {
    throw new Error("NEXUS_GEMINI_EST_COST_PER_CHAT_USD must be > 0");
  }
}
