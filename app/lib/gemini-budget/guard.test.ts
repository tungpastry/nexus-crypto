import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { runBudgetPreflight } from "./guard";

const ORIGINAL_ENV = { ...process.env };
const tempDirs: string[] = [];

async function setupBudgetEnv() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexus-budget-test-"));
  tempDirs.push(dir);
  process.env.NEXUS_GEMINI_LEDGER_FILE = path.join(dir, "ledger.csv");
  process.env.NEXUS_GEMINI_STATE_FILE = path.join(dir, "state.json");
}

describe("gemini budget guard", () => {
  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        await rm(dir, { recursive: true, force: true });
      }
    }
  });

  it("allows requests when spend is below thresholds", async () => {
    await setupBudgetEnv();
    process.env.NEXUS_GEMINI_MONTHLY_CAP_USD = "5";
    process.env.NEXUS_GEMINI_HARD_STOP_USD = "4.5";
    process.env.NEXUS_GEMINI_DEGRADE_THRESHOLD_USD = "4.0";
    process.env.NEXUS_GEMINI_EST_COST_PER_CHAT_USD = "0.01";

    const preflight = await runBudgetPreflight("req_ok", "gemini-3-flash-preview");
    expect(preflight.allowed).toBe(true);
    expect(preflight.status).toBe("ok");
  });

  it("blocks requests when projected spend hits hard stop", async () => {
    await setupBudgetEnv();
    process.env.NEXUS_GEMINI_MONTHLY_CAP_USD = "1";
    process.env.NEXUS_GEMINI_HARD_STOP_USD = "0.005";
    process.env.NEXUS_GEMINI_DEGRADE_THRESHOLD_USD = "0.004";
    process.env.NEXUS_GEMINI_EST_COST_PER_CHAT_USD = "0.01";

    const preflight = await runBudgetPreflight("req_block", "gemini-3-flash-preview");
    expect(preflight.allowed).toBe(false);
    expect(preflight.reason).toBe("GEMINI_BUDGET_HARD_STOP");
  });

  it("fails closed when guard policy is invalid", async () => {
    await setupBudgetEnv();
    process.env.NEXUS_GEMINI_MONTHLY_CAP_USD = "0";
    process.env.NEXUS_GEMINI_BUDGET_FAILURE_MODE = "fail_closed";

    const preflight = await runBudgetPreflight("req_guard", "gemini-3-flash-preview");
    expect(preflight.allowed).toBe(false);
    expect(preflight.reason).toContain("GEMINI_BUDGET_GUARD_UNAVAILABLE");
  });
});
