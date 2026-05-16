import { describe, expect, it } from "vitest";
import { explainDeepHealth } from "./deepHealthExplainer";

describe("deepHealthExplainer", () => {
  it("builds deep health issue summary", () => {
    const result = explainDeepHealth({
      status: "degraded",
      updated_at: "2026-05-16T00:00:00.000Z",
      summary: {
        symbols_total: 2,
        symbols_ok: 1,
        symbols_warn: 0,
        symbols_error: 1,
        latency_ms: 650,
      },
      checks: {
        BTCUSDT: {
          status: "ok",
          price: { status: "ok", latency_ms: 120 },
          klines: { status: "ok", latency_ms: 110, candles: 5 },
        },
        ETHUSDT: {
          status: "error",
          price: { status: "error", latency_ms: 320, message: "provider down" },
          klines: { status: "ok", latency_ms: 140, candles: 5 },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.context_type).toBe("deep_health_explainer");
    expect(result.status).toBe("degraded");
    expect(result.summary.symbols_total).toBe(2);
    expect(result.summary.symbols_error).toBe(1);
    expect(result.symbols).toHaveLength(2);
    expect(result.issues[0]?.title).toContain("ETHUSDT");
  });
});

