import { describe, expect, it } from "vitest";
import {
  BINANCE_SYMBOLS,
  DEEP_HEALTH_SYMBOLS,
  NEXUS_ASSETS,
  NEXUS_ASSET_CATALOG,
  findAssetById,
} from "./assets";

describe("Nexus 100 asset catalog", () => {
  it("contains 100 unique assets in stable catalog order", () => {
    expect(NEXUS_ASSETS).toHaveLength(100);
    expect(new Set(NEXUS_ASSETS.map((asset) => asset.id)).size).toBe(100);
    expect(NEXUS_ASSETS.map((asset) => asset.catalogOrder)).toEqual(
      Array.from({ length: 100 }, (_, index) => index + 1)
    );
    expect(NEXUS_ASSET_CATALOG.universeSize).toBe(100);
  });

  it("keeps Binance capabilities internally consistent", () => {
    expect(new Set(BINANCE_SYMBOLS).size).toBe(BINANCE_SYMBOLS.length);
    for (const asset of NEXUS_ASSETS) {
      if (asset.enableChecklist) {
        expect(asset.binanceSymbol).toBeTruthy();
        expect(asset.tradingViewSymbol).toBe(`BINANCE:${asset.binanceSymbol}`);
        expect(asset.enableChart).toBe(true);
        expect(asset.enableMA).toBe(true);
      }
      if (asset.category === "stablecoin") {
        expect(asset.marketOnlyReason).toBe("stablecoin");
        expect(asset.enableChecklist).toBe(false);
      }
    }
  });

  it("preserves original route ids and eight deep-health canaries", () => {
    expect(findAssetById("bnb")?.coingeckoId).toBe("binancecoin");
    expect(findAssetById("binancecoin")?.id).toBe("bnb");
    expect(findAssetById("xrp")?.coingeckoId).toBe("ripple");
    expect(DEEP_HEALTH_SYMBOLS).toHaveLength(8);
  });
});
