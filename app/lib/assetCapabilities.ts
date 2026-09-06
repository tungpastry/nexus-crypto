import type { NexusAsset } from "../config/assets";

export function getMarketOnlyReason(asset: NexusAsset) {
  if (asset.marketOnlyReason === "stablecoin") {
    return `${asset.symbol} is configured as a stablecoin market-only asset.`;
  }

  return `${asset.symbol} does not have a verified Binance Spot/USDT market in the committed catalog.`;
}
