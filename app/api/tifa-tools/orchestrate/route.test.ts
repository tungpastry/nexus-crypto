import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const requireApiAuthMock = vi.fn();
const resolveTifaIntentMock = vi.fn();
const orchestrateTifaToolsMock = vi.fn();

vi.mock("../../../lib/auth/api", () => ({
  requireApiAuth: (...args: unknown[]) => requireApiAuthMock(...args),
}));

vi.mock("../../../lib/tifa-nexus/intent", () => ({
  resolveTifaIntent: (...args: unknown[]) => resolveTifaIntentMock(...args),
}));

vi.mock("../../../lib/tifa-tools/orchestrator", () => ({
  orchestrateTifaTools: (...args: unknown[]) => orchestrateTifaToolsMock(...args),
}));

describe("/api/tifa-tools/orchestrate route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns orchestration output for GET", async () => {
    const { GET } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    resolveTifaIntentMock.mockReturnValue("ops_summary");
    orchestrateTifaToolsMock.mockResolvedValue({
      ok: true,
      intent: "ops_summary",
      tools_requested: ["ops_summary"],
      tools_used: ["ops_summary"],
      outputs: { ops_summary: { ok: true } },
      warnings: [],
    });

    const response = await GET(
      new NextRequest("http://localhost/api/tifa-tools/orchestrate?message=ops+summary")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.tools_used).toContain("ops_summary");
  });

  it("returns orchestration output for POST", async () => {
    const { POST } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    resolveTifaIntentMock.mockReturnValue("provider_health");
    orchestrateTifaToolsMock.mockResolvedValue({
      ok: true,
      intent: "provider_health",
      tools_requested: ["provider_health_explainer"],
      tools_used: ["provider_health_explainer"],
      outputs: { provider_health_explainer: { ok: true } },
      warnings: [],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/tifa-tools/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "provider health explain",
          tools: ["provider_health_explainer"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.tools_requested).toContain("provider_health_explainer");
  });
});

