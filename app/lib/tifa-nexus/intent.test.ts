import { describe, expect, it } from "vitest";
import { resolveTifaIntent } from "./intent";

describe("resolveTifaIntent", () => {
  it("detects budget intent", () => {
    expect(resolveTifaIntent("show me gemini budget status")).toBe("budget_status");
  });

  it("prioritizes asset analysis on asset page context", () => {
    expect(
      resolveTifaIntent("giải thích score hiện tại", {
        page: "/asset/bitcoin",
        assetId: "bitcoin",
      })
    ).toBe("asset_analysis");
  });

  it("detects market overview", () => {
    expect(resolveTifaIntent("market snapshot hôm nay")).toBe("market_overview");
  });
});
