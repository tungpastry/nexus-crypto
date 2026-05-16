import { describe, expect, it } from "vitest";
import { explainProviderHealth } from "./providerHealthExplainer";

describe("providerHealthExplainer", () => {
  it("normalizes checks and summary", () => {
    const result = explainProviderHealth({
      status: "degraded",
      updated_at: "2026-05-16T00:00:00.000Z",
      checks: {
        binance_price: { status: "ok", latency_ms: 120 },
        binance_klines: { status: "error", latency_ms: 300, message: "timeout" },
        market_snapshot: { status: "warn", latency_ms: 240 },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.context_type).toBe("provider_health_explainer");
    expect(result.status).toBe("degraded");
    expect(result.summary.total_checks).toBe(3);
    expect(result.summary.ok_checks).toBe(1);
    expect(result.summary.warn_checks).toBe(1);
    expect(result.summary.error_checks).toBe(1);
    expect(result.issues.length).toBe(2);
  });
});

