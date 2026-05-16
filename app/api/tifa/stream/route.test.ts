import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const requireApiAuthMock = vi.fn();
const runTifaChatStreamMock = vi.fn();
const finalizeTifaStreamSuccessMock = vi.fn();

vi.mock("../../../lib/auth/api", () => ({
  requireApiAuth: (...args: unknown[]) => requireApiAuthMock(...args),
}));

vi.mock("../../../lib/tifa-core/chat", () => ({
  runTifaChatStream: (...args: unknown[]) => runTifaChatStreamMock(...args),
  finalizeTifaStreamSuccess: (...args: unknown[]) =>
    finalizeTifaStreamSuccessMock(...args),
}));

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tifa/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function* streamFromChunks(chunks: string[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe("/api/tifa/stream contract", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns valid SSE headers and emits start/tool/budget/delta/done", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatStreamMock.mockResolvedValue({
      requestId: "req_1",
      providerModel: "gemini-3-flash-preview",
      toolContext: { intent: "market_overview" },
      budget: { status: "ok" },
      answerForFallback: "",
      postflight: { estimatedCostUsd: 0.01, monthlySpendBefore: 0.02 },
      mode: "provider-stream",
      stream: streamFromChunks(["Hello ", "world"]),
    });

    const response = await POST(
      buildRequest({ message: "Market hôm nay thế nào?", context: { page: "/" } })
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");
    expect(text).toContain("event: start");
    expect(text).toContain("event: tool");
    expect(text).toContain("event: budget");
    expect(text).toContain("event: delta");
    expect(text).toContain("event: done");
  });

  it("returns SSE error for invalid request body", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });

    const response = await POST(buildRequest({ message: "" }));
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toContain("event: error");
    expect(text).toContain("INVALID_REQUEST");
  });

  it("emits blocked budget path without provider stream", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatStreamMock.mockResolvedValue({
      requestId: "req_block",
      providerModel: "gemini-3-flash-preview",
      toolContext: { intent: "budget_status" },
      budget: { status: "blocked", reason: "GEMINI_BUDGET_HARD_STOP" },
      answerForFallback: "Budget blocked",
      postflight: null,
      mode: "tool-only",
      streamErrorCode: "GEMINI_BUDGET_HARD_STOP",
    });

    const response = await POST(buildRequest({ message: "budget", context: { page: "/ops" } }));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain('"status":"blocked"');
    expect(text).toContain("GEMINI_BUDGET_HARD_STOP");
    expect(text).toContain("event: done");
  });

  it("emits stream provider error when stream fails after start", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    async function* brokenStream() {
      yield "partial";
      throw new Error("stream exploded");
    }

    runTifaChatStreamMock.mockResolvedValue({
      requestId: "req_err",
      providerModel: "gemini-3-flash-preview",
      toolContext: { intent: "market_overview" },
      budget: { status: "ok" },
      answerForFallback: "",
      postflight: null,
      mode: "provider-stream",
      stream: brokenStream(),
    });

    const response = await POST(buildRequest({ message: "market", context: { page: "/" } }));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("event: delta");
    expect(text).toContain("event: error");
    expect(text).toContain("STREAM_PROVIDER_ERROR");
  });
});
