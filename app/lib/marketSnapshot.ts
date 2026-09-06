import {
  NEXUS_ASSETS,
  NEXUS_ASSET_CATALOG,
  type NexusAsset,
} from "../config/assets";

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  category: string;
  price: number | null;
  change_1h: number | null;
  change_24h: number | null;
  change_7d: number | null;
  volume_24h: number | null;
  market_cap: number | null;
};

export type MarketSnapshot = {
  provider: "coingecko";
  status?: "degraded";
  catalog_version: string;
  catalog_generated_at: string;
  universe_size: number;
  updated_at: string;
  error?: {
    code: string;
    message: string;
  };
  global: {
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    btc_dominance: number | null;
    eth_dominance: number | null;
  };
  assets: MarketAsset[];
};

export type CoinGeckoMarket = {
  id: string;
  market_cap_rank?: number | null;
  current_price?: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  total_volume?: number | null;
  market_cap?: number | null;
};

export type CoinGeckoGlobalData = {
  total_market_cap?: { usd?: number };
  total_volume?: { usd?: number };
  market_cap_percentage?: { btc?: number; eth?: number };
};

function finiteOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function catalogFields() {
  return {
    catalog_version: NEXUS_ASSET_CATALOG.catalogVersion,
    catalog_generated_at: NEXUS_ASSET_CATALOG.generatedAt,
    universe_size: NEXUS_ASSET_CATALOG.universeSize,
  };
}

export function buildMarketSnapshot(
  globalData: CoinGeckoGlobalData,
  markets: CoinGeckoMarket[],
  updatedAt = new Date().toISOString(),
  assets: NexusAsset[] = NEXUS_ASSETS
): MarketSnapshot {
  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const rows = assets
    .map((asset) => {
      const market = marketsById.get(asset.coingeckoId);
      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        rank: finiteOrNull(market?.market_cap_rank) ?? asset.rank,
        category: asset.category,
        price: finiteOrNull(market?.current_price),
        change_1h: finiteOrNull(market?.price_change_percentage_1h_in_currency),
        change_24h: finiteOrNull(market?.price_change_percentage_24h_in_currency),
        change_7d: finiteOrNull(market?.price_change_percentage_7d_in_currency),
        volume_24h: finiteOrNull(market?.total_volume),
        market_cap: finiteOrNull(market?.market_cap),
      };
    })
    .sort((left, right) => left.rank - right.rank);

  return {
    provider: "coingecko",
    ...catalogFields(),
    updated_at: updatedAt,
    global: {
      market_cap_usd: finiteOrNull(globalData.total_market_cap?.usd),
      volume_24h_usd: finiteOrNull(globalData.total_volume?.usd),
      btc_dominance: finiteOrNull(globalData.market_cap_percentage?.btc),
      eth_dominance: finiteOrNull(globalData.market_cap_percentage?.eth),
    },
    assets: rows,
  };
}

export function buildFallbackMarketSnapshot(
  message: string,
  updatedAt = new Date().toISOString()
): MarketSnapshot {
  return {
    provider: "coingecko",
    status: "degraded",
    ...catalogFields(),
    updated_at: updatedAt,
    error: { code: "MARKET_SNAPSHOT_ERROR", message },
    global: {
      market_cap_usd: null,
      volume_24h_usd: null,
      btc_dominance: null,
      eth_dominance: null,
    },
    assets: NEXUS_ASSETS.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      rank: asset.rank,
      category: asset.category,
      price: null,
      change_1h: null,
      change_24h: null,
      change_7d: null,
      volume_24h: null,
      market_cap: null,
    })),
  };
}

function isNumberOrNull(value: unknown): value is number | null {
  return typeof value === "number" || value === null;
}

export function isMarketSnapshot(value: unknown): value is MarketSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  const global = snapshot.global as Record<string, unknown> | undefined;
  const assets = snapshot.assets;

  return (
    snapshot.provider === "coingecko" &&
    snapshot.catalog_version === NEXUS_ASSET_CATALOG.catalogVersion &&
    snapshot.catalog_generated_at === NEXUS_ASSET_CATALOG.generatedAt &&
    snapshot.universe_size === NEXUS_ASSET_CATALOG.universeSize &&
    typeof snapshot.updated_at === "string" &&
    Boolean(global) &&
    isNumberOrNull(global?.market_cap_usd) &&
    isNumberOrNull(global?.volume_24h_usd) &&
    isNumberOrNull(global?.btc_dominance) &&
    isNumberOrNull(global?.eth_dominance) &&
    Array.isArray(assets) &&
    assets.length === NEXUS_ASSET_CATALOG.universeSize
  );
}
