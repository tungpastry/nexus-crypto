import type { NexusAsset, NexusAssetCategory } from "../config/assets";

export type WatchlistMarketData = {
  id: string;
  rank: number;
  price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  volume_24h: number | null;
  market_cap: number | null;
};

export type WatchlistRow = {
  asset: NexusAsset;
  market: WatchlistMarketData;
};

export type WatchlistSortKey = "rank" | "price" | "change_24h" | "change_7d" | "volume_24h";
export type WatchlistSortDirection = "asc" | "desc";
export type WatchlistMode = "all" | "nexus" | "market-only";

function numericValue(row: WatchlistRow, key: WatchlistSortKey) {
  return row.market[key];
}

export function buildWatchlistRows(
  assets: NexusAsset[],
  marketRows: WatchlistMarketData[] = []
) {
  const marketById = new Map(marketRows.map((row) => [row.id, row]));
  return assets.map((asset) => ({
    asset,
    market: marketById.get(asset.id) ?? {
      id: asset.id,
      rank: asset.rank,
      price: null,
      change_24h: null,
      change_7d: null,
      volume_24h: null,
      market_cap: null,
    },
  }));
}

export function filterAndSortWatchlistRows(
  rows: WatchlistRow[],
  options: {
    query: string;
    category: "all" | NexusAssetCategory;
    mode: WatchlistMode;
    sortKey: WatchlistSortKey;
    sortDirection: WatchlistSortDirection;
  }
) {
  const query = options.query.trim().toLowerCase();
  const direction = options.sortDirection === "asc" ? 1 : -1;

  return rows
    .filter(({ asset }) => {
      if (query && !`${asset.symbol} ${asset.name}`.toLowerCase().includes(query)) return false;
      if (options.category !== "all" && asset.category !== options.category) return false;
      if (options.mode === "nexus" && !asset.enableChecklist) return false;
      if (options.mode === "market-only" && asset.enableChecklist) return false;
      return true;
    })
    .sort((left, right) => {
      const leftValue = numericValue(left, options.sortKey);
      const rightValue = numericValue(right, options.sortKey);
      if (leftValue === null && rightValue === null) return left.asset.catalogOrder - right.asset.catalogOrder;
      if (leftValue === null) return 1;
      if (rightValue === null) return -1;
      if (leftValue === rightValue) return left.asset.catalogOrder - right.asset.catalogOrder;
      return (leftValue - rightValue) * direction;
    });
}

export function paginateWatchlistRows(rows: WatchlistRow[], page: number, pageSize = 25) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    rows: rows.slice(start, start + pageSize),
  };
}
