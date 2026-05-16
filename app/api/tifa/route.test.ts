import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const requireApiAuthMock = vi.fn();
const runTifaChatMock = vi.fn();

vi.mock("../../lib/auth/api", () => ({
  requireApiAuth: (...args: unknown[]) => requireApiAuthMock(...args),
}));

vi.mock("../../lib/tifa-core/chat", () => ({
  runTifaChat: (...args: unknown[]) => runTifaChatMock(...args),
}));

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tifa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/tifa contract", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty message", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });

    const response = await POST(buildRequest({ message: "", context: { page: "/" } }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("TIFA_REQUEST_ERROR");
  });

  it("accepts market snapshot intent response shape", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatMock.mockResolvedValue({
      ok: true,
      answer: "Market snapshot summary",
      provider: "tool-only",
      model: "gemini-3-flash-preview",
      tool_context: { intent: "market_overview", market_context: { ok: true } },
      budget: { status: "ok" },
    });

    const response = await POST(
      buildRequest({ message: "Market hôm nay thế nào?", context: { page: "/" } })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.answer).toBeTruthy();
    expect(payload.provider).toBeTruthy();
    expect(payload.model).toBeTruthy();
    expect(payload.tool_context).toBeTruthy();
    expect(JSON.stringify(payload)).not.toContain("GEMINI_API_KEY");
  });

  it("accepts asset analysis intent", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatMock.mockResolvedValue({
      ok: true,
      answer: "Asset analysis summary",
      provider: "tool-only",
      model: "gemini-3-flash-preview",
      tool_context: { intent: "asset_analysis", asset_analysis_context: { ok: true } },
      budget: { status: "ok" },
    });

    const response = await POST(
      buildRequest({
        message: "Phân tích BTC theo Nexus Algorithm",
        context: {
          page: "/asset/bitcoin",
          assetId: "bitcoin",
          timeframe: "1h",
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.tool_context.intent).toBe("asset_analysis");
  });

  it("handles stablecoin market-only response", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatMock.mockResolvedValue({
      ok: true,
      answer: "USDT is market-only.",
      provider: "tool-only",
      model: "gemini-3-flash-preview",
      tool_context: {
        intent: "asset_analysis",
        asset_analysis_context: {
          mode: "market-only",
          analysis_enabled: false,
          reason: "USDT is configured as market-only.",
        },
      },
      budget: { status: "ok" },
    });

    const response = await POST(
      buildRequest({
        message: "Phân tích USDT",
        context: {
          page: "/asset/tether",
          assetId: "tether",
          timeframe: "1h",
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(JSON.stringify(payload).toLowerCase()).toContain("market-only");
  });

  it("handles budget hard stop as blocked response", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatMock.mockResolvedValue({
      ok: true,
      answer: "Budget guard blocked provider call.",
      provider: "tool-only",
      model: "gemini-3-flash-preview",
      tool_context: { intent: "budget_status" },
      budget: { status: "blocked", reason: "GEMINI_BUDGET_HARD_STOP" },
    });

    const response = await POST(
      buildRequest({ message: "budget status", context: { page: "/ops" } })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.budget.status).toBe("blocked");
    expect(payload.budget.reason).toBe("GEMINI_BUDGET_HARD_STOP");
  });
});
