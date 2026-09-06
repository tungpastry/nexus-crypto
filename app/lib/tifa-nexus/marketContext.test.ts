import { describe, expect, it } from "vitest";
import { NEXUS_ASSETS } from "../../config/assets";
import { buildMarketContextPayload } from "./marketContext";

describe("Tifa market context", () => {
  it("uses the full universe for leaders while bounding prompt assets", () => {
    const assets = NEXUS_ASSETS.map((asset, index) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      rank: index + 1,
      category: asset.category,
      price: index + 1,
      change_24h: index === 99 ? 99 : index - 50,
      change_7d: 0,
    }));

    const context = buildMarketContextPayload({ universe_size: 100, assets });

    expect(context.universe_size).toBe(100);
    expect(context.top_assets).toHaveLength(20);
    expect(context.leaders_24h[0].id).toBe(assets[99].id);
    expect(context.laggards_24h[0].id).toBe(assets[0].id);
  });
});
