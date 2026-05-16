import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const requireApiAuthMock = vi.fn();
const orchestrateTifaToolsMock = vi.fn();

vi.mock("../../../lib/auth/api", () => ({
  requireApiAuth: (...args: unknown[]) => requireApiAuthMock(...args),
}));

vi.mock("../../../lib/tifa-tools/orchestrator", () => ({
  orchestrateTifaTools: (...args: unknown[]) => orchestrateTifaToolsMock(...args),
}));

describe("/api/tifa-tools/ops-summary route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns ops summary payload", async () => {
    const { GET } = await import("./route");
    requireApiAuthMock.mockResolvedValue({ ok: true, via: "disabled" });
    orchestrateTifaToolsMock.mockResolvedValue({
      ok: true,
      outputs: {
        ops_summary: {
          ok: true,
          context_type: "ops_summary",
          status: "ok",
          executive: { headline: "All good" },
        },
      },
      warnings: [],
    });

    const response = await GET(new NextRequest("http://localhost/api/tifa-tools/ops-summary"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.context_type).toBe("ops_summary");
  });
});

