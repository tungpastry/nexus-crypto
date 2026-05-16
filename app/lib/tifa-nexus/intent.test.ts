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

  it("detects market snapshot", () => {
    expect(resolveTifaIntent("market snapshot hôm nay")).toBe("market_snapshot");
  });

  it("detects deep health intent", () => {
    expect(resolveTifaIntent("show deep health diagnostics")).toBe("deep_health");
  });

  it("detects ops summary intent", () => {
    expect(resolveTifaIntent("ops executive summary now")).toBe("ops_summary");
  });

  it("detects stablecoin explain intent", () => {
    expect(resolveTifaIntent("phân tích usdt giúp mình")).toBe("stablecoin_explain");
  });
});
