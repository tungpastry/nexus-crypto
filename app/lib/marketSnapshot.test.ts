import { describe, expect, it } from "vitest";
import { NEXUS_ASSETS, NEXUS_ASSET_CATALOG } from "../config/assets";
import { buildMarketSnapshot, isMarketSnapshot } from "./marketSnapshot";

describe("market snapshot catalog mapping", () => {
  it("maps and sorts all 100 assets by live market rank", () => {
    const markets = NEXUS_ASSETS.map((asset, index) => ({
      id: asset.coingeckoId,
      market_cap_rank: 100 - index,
      current_price: index + 1,
      total_volume: 1_000 + index,
      market_cap: 10_000 + index,
    }));
    const snapshot = buildMarketSnapshot({}, markets, "2026-09-06T00:00:00.000Z");
    expect(snapshot.assets).toHaveLength(100);
    expect(snapshot.assets[0].rank).toBe(1);
    expect(snapshot.catalog_version).toBe(NEXUS_ASSET_CATALOG.catalogVersion);
    expect(isMarketSnapshot(snapshot)).toBe(true);
  });

  it("rejects a persistent snapshot from another catalog version", () => {
    const snapshot = buildMarketSnapshot({}, []);
    expect(isMarketSnapshot({ ...snapshot, catalog_version: "old-catalog" })).toBe(false);
  });
});
