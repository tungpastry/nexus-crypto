import { describe, expect, it } from "vitest";
import { findAssetById } from "../config/assets";
import { getMarketOnlyReason } from "./assetCapabilities";

describe("asset capability descriptions", () => {
  it("describes stablecoin market-only mode", () => {
    const asset = findAssetById("tether");
    expect(asset && getMarketOnlyReason(asset)).toContain("stablecoin market-only");
  });

  it("describes missing Binance Spot/USDT separately", () => {
    const asset = findAssetById("hyperliquid");
    expect(asset && getMarketOnlyReason(asset)).toContain("does not have a verified Binance Spot/USDT");
  });
});
