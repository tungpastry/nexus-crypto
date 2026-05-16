import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const requireApiAuthMock = vi.fn();
const runTifaChatMock = vi.fn();
const runTifaChatStreamMock = vi.fn();
const finalizeTifaStreamSuccessMock = vi.fn();

vi.mock("../auth/api", () => ({
  requireApiAuth: (...args: unknown[]) => requireApiAuthMock(...args),
}));

vi.mock("../tifa-core/chat", () => ({
  runTifaChat: (...args: unknown[]) => runTifaChatMock(...args),
  runTifaChatStream: (...args: unknown[]) => runTifaChatStreamMock(...args),
  finalizeTifaStreamSuccess: (...args: unknown[]) =>
    finalizeTifaStreamSuccessMock(...args),
}));

const ORIGINAL_ENV = { ...process.env };

function req(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function assertNoSecretLeak(serialized: string, secret: string) {
  expect(serialized).not.toContain(secret);
  expect(serialized).not.toContain(`key=${secret}`);
  expect(serialized).not.toContain("GEMINI_API_KEY=");
}

describe("no secret leakage in tifa responses", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.clearAllMocks();
  });

  it("redacts secret in /api/tifa error response", async () => {
    const { POST: postTifa } = await import("../../api/tifa/route");
    const secret = "TEST_SECRET_GEMINI_KEY_SHOULD_NEVER_LEAK";
    process.env.GEMINI_API_KEY = secret;
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatMock.mockImplementation(() => {
      throw new Error(`vendor failed key=${secret}`);
    });

    const response = await postTifa(
      req("http://localhost/api/tifa", {
        message: "hello",
        context: { page: "/" },
      })
    );
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    assertNoSecretLeak(serialized, secret);
  });

  it("redacts secret in /api/tifa/stream error event", async () => {
    const { POST: postTifaStream } = await import("../../api/tifa/stream/route");
    const secret = "TEST_SECRET_GEMINI_KEY_SHOULD_NEVER_LEAK";
    process.env.GEMINI_API_KEY = secret;
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    runTifaChatStreamMock.mockImplementation(() => {
      throw new Error(`stream failed key=${secret}`);
    });

    const response = await postTifaStream(
      req("http://localhost/api/tifa/stream", {
        message: "hello",
        context: { page: "/" },
      })
    );
    const text = await response.text();
    assertNoSecretLeak(text, secret);
  });

  it("does not leak secret in /api/tifa-tools/budget-status", async () => {
    const { GET: getBudgetStatus } = await import("../../api/tifa-tools/budget-status/route");
    const secret = "TEST_SECRET_GEMINI_KEY_SHOULD_NEVER_LEAK";
    process.env.GEMINI_API_KEY = secret;
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });

    const response = await getBudgetStatus(req("http://localhost/api/tifa-tools/budget-status"));
    const payload = await response.json();
    assertNoSecretLeak(JSON.stringify(payload), secret);
  });

  it("does not leak secret in /api/provider-health/gemini", async () => {
    const { GET: getGeminiHealth } = await import("../../api/provider-health/gemini/route");
    const secret = "TEST_SECRET_GEMINI_KEY_SHOULD_NEVER_LEAK";
    process.env.GEMINI_API_KEY = secret;

    const response = await getGeminiHealth();
    const payload = await response.json();
    assertNoSecretLeak(JSON.stringify(payload), secret);
  });
});
