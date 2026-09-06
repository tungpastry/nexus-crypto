import { describe, expect, it } from "vitest";
import { NEXUS_ASSETS } from "../config/assets";
import {
  buildWatchlistRows,
  filterAndSortWatchlistRows,
  paginateWatchlistRows,
} from "./assetWatchlist";

describe("asset watchlist selection", () => {
  const market = NEXUS_ASSETS.map((asset, index) => ({
    id: asset.id,
    rank: 100 - index,
    price: index,
    change_24h: index - 50,
    change_7d: 50 - index,
    volume_24h: index * 1_000,
    market_cap: index * 10_000,
  }));
  const rows = buildWatchlistRows(NEXUS_ASSETS, market);

  it("searches and filters by capability", () => {
    const result = filterAndSortWatchlistRows(rows, {
      query: "BTC",
      category: "all",
      mode: "nexus",
      sortKey: "rank",
      sortDirection: "asc",
    });
    expect(result.map((row) => row.asset.id)).toEqual(["bitcoin"]);
  });

  it("sorts live metrics and paginates 25 rows", () => {
    const result = filterAndSortWatchlistRows(rows, {
      query: "",
      category: "all",
      mode: "all",
      sortKey: "volume_24h",
      sortDirection: "desc",
    });
    const page = paginateWatchlistRows(result, 4);
    expect(page.pageCount).toBe(4);
    expect(page.rows).toHaveLength(25);
    expect(page.rows[0].market.volume_24h).toBeGreaterThan(page.rows[24].market.volume_24h ?? 0);
  });
});
