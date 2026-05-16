import { describe, expect, it, vi, beforeEach } from "vitest";
import { orchestrateTifaTools } from "./orchestrator";

const axiosGetMock = vi.fn();
const getMarketContextMock = vi.fn();
const getAssetAnalysisContextMock = vi.fn();
const getGeminiBudgetStatusMock = vi.fn();
const getTifaProviderHealthMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => axiosGetMock(...args),
  },
}));

vi.mock("../tifa-nexus/marketContext", () => ({
  getMarketContext: (...args: unknown[]) => getMarketContextMock(...args),
  buildInternalAuthHeaders: vi.fn(() => undefined),
}));

vi.mock("../tifa-nexus/assetAnalysisContext", () => ({
  getAssetAnalysisContext: (...args: unknown[]) => getAssetAnalysisContextMock(...args),
}));

vi.mock("../gemini-budget/status", () => ({
  getGeminiBudgetStatus: (...args: unknown[]) => getGeminiBudgetStatusMock(...args),
}));

vi.mock("../tifa-provider-gateway/gateway", () => ({
  getTifaProviderHealth: (...args: unknown[]) => getTifaProviderHealthMock(...args),
}));

describe("tifa tool orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getMarketContextMock.mockResolvedValue({
      ok: true,
      context_type: "market_snapshot",
      top_assets: [],
      global: {},
    });
    getAssetAnalysisContextMock.mockResolvedValue({
      ok: true,
      context_type: "asset_analysis",
      mode: "nexus",
      analysis_enabled: true,
      asset: { id: "bitcoin", symbol: "BTC", name: "Bitcoin", binance_symbol: "BTCUSDT" },
      timeframe: { label: "1h", binance: "1h" },
      latest_price: 100,
      signal: { score: 70, state: "Ready" },
      rules_summary: { pass: 1, warn: 0, fail: 0, neutral: 0 },
    });
    getGeminiBudgetStatusMock.mockResolvedValue({
      provider: "gemini",
      status: "ok",
      monthly_spend_usd: 0.2,
      hard_stop_usd: 4.5,
    });
    getTifaProviderHealthMock.mockReturnValue({
      provider: "gemini",
      enabled: true,
      configured: true,
      model: "gemini-3-flash-preview",
      stream_enabled: true,
      retry_limit: 1,
      timeout_ms: 20000,
      stream_retry_limit: 1,
      stream_timeout_ms: 25000,
      circuit: {
        enabled: true,
        state: "closed",
        failure_count: 0,
        cooldown_ms: 60000,
        opened_until: null,
        threshold: 3,
      },
    });
    axiosGetMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/api/provider-health")) {
        return {
          data: {
            provider: "nexus_crypto",
            status: "ok",
            updated_at: "2026-05-16T00:00:00.000Z",
            checks: {
              binance_price: { status: "ok", latency_ms: 120 },
              binance_klines: { status: "ok", latency_ms: 140 },
              market_snapshot: { status: "ok", latency_ms: 200 },
            },
          },
        };
      }
      if (url.endsWith("/api/provider-health/deep")) {
        return {
          data: {
            provider: "nexus_crypto",
            mode: "deep",
            status: "ok",
            updated_at: "2026-05-16T00:00:00.000Z",
            summary: {
              symbols_total: 2,
              symbols_ok: 2,
              symbols_warn: 0,
              symbols_error: 0,
              latency_ms: 500,
            },
            checks: {
              BTCUSDT: {
                status: "ok",
                price: { status: "ok", latency_ms: 100 },
                klines: { status: "ok", latency_ms: 130, candles: 5 },
              },
              ETHUSDT: {
                status: "ok",
                price: { status: "ok", latency_ms: 110 },
                klines: { status: "ok", latency_ms: 125, candles: 5 },
              },
            },
          },
        };
      }
      throw new Error(`Unexpected URL ${url}`);
    });
  });

  it("orchestrates provider health intent with explainer tools", async () => {
    const result = await orchestrateTifaTools({
      origin: "http://localhost:3200",
      intent: "provider_health",
      message: "provider health status",
    });

    expect(result.ok).toBe(true);
    expect(result.tools_used).toContain("provider_health");
    expect(result.tools_used).toContain("provider_health_explainer");
    expect(result.outputs.provider_health_explainer).toBeTruthy();
  });

  it("orchestrates ops summary and includes aggregate payload", async () => {
    const result = await orchestrateTifaTools({
      origin: "http://localhost:3200",
      intent: "ops_summary",
      message: "ops executive summary",
    });

    expect(result.ok).toBe(true);
    expect(result.tools_used).toContain("ops_summary");
    expect(result.outputs.ops_summary).toBeTruthy();
    const summary = result.outputs.ops_summary as { context_type?: string };
    expect(summary.context_type).toBe("ops_summary");
  });
});

