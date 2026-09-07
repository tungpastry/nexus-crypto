export type NexusAssetCategory =
  | "major"
  | "stablecoin"
  | "exchange"
  | "altcoin"
  | "meme";

export type NexusAsset = {
  id: string;
  rank: number;
  catalogOrder: number;
  name: string;
  symbol: string;
  iconUrl: string;
  category: NexusAssetCategory;
  coingeckoId: string;
  binanceSymbol?: string;
  binancePriceTickSize?: string;
  tradingViewSymbol?: string;
  quote?: "USDT" | "USD";
  enablePrice: boolean;
  enableChart: boolean;
  enableMA: boolean;
  enableChecklist: boolean;
  marketOnlyReason?: "stablecoin" | "binance-usdt-unavailable";
  deepHealthCanary?: boolean;
  note?: string;
};
import generatedCatalog from "./assets.generated.json";

export type NexusAssetCatalogMetadata = {
  catalogVersion: string;
  generatedAt: string;
  universeSize: number;
  binanceEnabledCount: number;
  marketOnlyCount: number;
  sources: {
    coingecko: string;
    binance: string;
  };
};

export const NEXUS_ASSET_CATALOG =
  generatedCatalog.metadata as NexusAssetCatalogMetadata;

export const NEXUS_ASSETS = generatedCatalog.assets as NexusAsset[];

export const BINANCE_SYMBOLS = NEXUS_ASSETS.flatMap((asset) =>
  asset.binanceSymbol ? [asset.binanceSymbol] : []
);

export const BINANCE_SYMBOL_SET = new Set(BINANCE_SYMBOLS);

export const DEEP_HEALTH_SYMBOLS = NEXUS_ASSETS.flatMap((asset) =>
  asset.deepHealthCanary && asset.binanceSymbol ? [asset.binanceSymbol] : []
);

export function findAssetById(id: string) {
  return NEXUS_ASSETS.find(
    (asset) => asset.id === id || asset.coingeckoId === id
  );
}

export function findAssetByBinanceSymbol(symbol: string) {
  return NEXUS_ASSETS.find((asset) => asset.binanceSymbol === symbol);
}
