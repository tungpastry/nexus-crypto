import { afterEach, describe, expect, it } from "vitest";
import { assertGeminiBudgetPolicy, getGeminiBudgetPolicy } from "./policy";

const ORIGINAL_ENV = { ...process.env };

describe("gemini budget policy", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("reads numeric env overrides", () => {
    process.env.NEXUS_GEMINI_MONTHLY_CAP_USD = "6.5";
    process.env.NEXUS_GEMINI_HARD_STOP_USD = "6.0";
    process.env.NEXUS_GEMINI_DEGRADE_THRESHOLD_USD = "5.2";

    const policy = getGeminiBudgetPolicy();
    expect(policy.monthlyCapUsd).toBe(6.5);
    expect(policy.hardStopUsd).toBe(6);
    expect(policy.degradeThresholdUsd).toBe(5.2);
  });

  it("fails validation when hard stop exceeds monthly cap", () => {
    process.env.NEXUS_GEMINI_MONTHLY_CAP_USD = "4";
    process.env.NEXUS_GEMINI_HARD_STOP_USD = "5";
    const policy = getGeminiBudgetPolicy();
    expect(() => assertGeminiBudgetPolicy(policy)).toThrow(/HARD_STOP/);
  });
});
