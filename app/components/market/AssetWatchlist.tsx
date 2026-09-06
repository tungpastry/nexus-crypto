"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowDown, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, LineChart, Search, Shield } from "lucide-react";
import { NEXUS_ASSETS, NEXUS_ASSET_CATALOG, type NexusAssetCategory } from "../../config/assets";
import {
  buildWatchlistRows,
  filterAndSortWatchlistRows,
  paginateWatchlistRows,
  type WatchlistMode,
  type WatchlistSortDirection,
  type WatchlistSortKey,
} from "../../lib/assetWatchlist";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "./DataFreshnessBadge";
import CoinIcon from "./CoinIcon";

type SnapshotAsset = {
  id: string;
  rank: number;
  price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  volume_24h: number | null;
  market_cap: number | null;
};

type Snapshot = {
  catalog_generated_at?: string;
  universe_size?: number;
  updated_at: string;
  assets: SnapshotAsset[];
};

function formatPrice(value?: number | null) {
  if (typeof value !== "number") return "--";
  const digits = value < 1 ? 6 : 2;
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value < 1 ? 2 : 2,
  })}`;
}

function formatCompact(value?: number | null) {
  if (typeof value !== "number") return "--";
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function Percent({ value }: { value?: number | null }) {
  if (typeof value !== "number") return <span className="text-[var(--text-soft)]">--</span>;
  const positive = value >= 0;
  return (
    <span className={positive ? "text-[var(--mint-positive)]" : "text-[var(--red-negative)]"}>
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function AssetWatchlist() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | NexusAssetCategory>("all");
  const [mode, setMode] = useState<WatchlistMode>("all");
  const [sortKey, setSortKey] = useState<WatchlistSortKey>("rank");
  const [sortDirection, setSortDirection] = useState<WatchlistSortDirection>("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function fetchSnapshot() {
      try {
        const res = await axios.get("/api/market-snapshot");
        if (active) setSnapshot(res.data);
      } catch {
        if (active) setSnapshot(null);
      }
    }

    fetchSnapshot();
    const id = setInterval(fetchSnapshot, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const selection = useMemo(() => {
    const rows = buildWatchlistRows(NEXUS_ASSETS, snapshot?.assets);
    const filtered = filterAndSortWatchlistRows(rows, {
      query,
      category,
      mode,
      sortKey,
      sortDirection,
    });
    return { filtered, pagination: paginateWatchlistRows(filtered, page) };
  }, [category, mode, page, query, snapshot?.assets, sortDirection, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [category, mode, query, sortDirection, sortKey]);

  useEffect(() => {
    if (page !== selection.pagination.page) setPage(selection.pagination.page);
  }, [page, selection.pagination.page]);

  const openWorkspace = (assetId: string) => {
    router.push(`/asset/${assetId}`);
  };

  return (
    <RetroPanel title="Asset Watchlist" eyebrow="Top 100 Nexus universe">
      <div className="grid gap-3 border-b border-[var(--border-soft)] p-4 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,auto))_auto]">
        <label className="relative">
          <span className="sr-only">Search assets</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-soft)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search symbol or name"
            className="nexus-control-surface h-10 w-full rounded-lg border border-[var(--border-soft)] pl-9 pr-3 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--border-cyan)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          />
        </label>
        <select
          aria-label="Filter category"
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | NexusAssetCategory)}
          className="nexus-control-surface h-10 rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-cyan)] focus:ring-2 focus:ring-[var(--focus-ring)]"
        >
          <option value="all">All categories</option>
          <option value="major">Major</option>
          <option value="stablecoin">Stablecoin</option>
          <option value="exchange">Exchange</option>
          <option value="altcoin">Altcoin</option>
          <option value="meme">Meme</option>
        </select>
        <select
          aria-label="Filter analysis mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as WatchlistMode)}
          className="nexus-control-surface h-10 rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-cyan)] focus:ring-2 focus:ring-[var(--focus-ring)]"
        >
          <option value="all">All modes</option>
          <option value="nexus">Nexus</option>
          <option value="market-only">Market only</option>
        </select>
        <select
          aria-label="Sort assets"
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as WatchlistSortKey)}
          className="nexus-control-surface h-10 rounded-lg border border-[var(--border-soft)] px-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--border-cyan)] focus:ring-2 focus:ring-[var(--focus-ring)]"
        >
          <option value="rank">Market rank</option>
          <option value="price">Price</option>
          <option value="change_24h">24h change</option>
          <option value="change_7d">7d change</option>
          <option value="volume_24h">24h volume</option>
        </select>
        <button
          type="button"
          title={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
          aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
          onClick={() => setSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
          className="nexus-control-surface inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--cyan-accent)] transition hover:border-[var(--border-cyan)] hover:bg-[var(--bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="nexus-table-head border-b border-[var(--border-soft)] text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">24h</th>
              <th className="px-4 py-3">7d</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {selection.pagination.rows.map(({ asset, market: row }) => {

              return (
                <tr
                  key={asset.id}
                  data-testid={`asset-row-${asset.symbol}`}
                  role="button"
                  tabIndex={0}
                  className="nexus-table-row cursor-pointer border-b border-[var(--line-subtle)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  onClick={() => openWorkspace(asset.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openWorkspace(asset.id);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CoinIcon src={asset.iconUrl} symbol={asset.symbol} name={asset.name} />
                      <div>
                        <p className="font-semibold text-[var(--text-main)]">{asset.symbol}</p>
                        <p className="text-xs text-[var(--text-soft)]">#{row.rank} · {asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--text-main)]">{formatPrice(row?.price)}</td>
                  <td className="px-4 py-3 font-mono">
                    <Percent value={row?.change_24h} />
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <Percent value={row?.change_7d} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--text-muted)]">
                    {formatCompact(row?.volume_24h)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                        asset.enableChecklist
                          ? "border-[rgba(125,211,252,0.34)] bg-[rgba(125,211,252,0.08)] text-[var(--cyan-accent)]"
                          : "border-[rgba(251,191,36,0.34)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]"
                      }`}
                    >
                      {asset.enableChecklist ? (
                        <LineChart className="h-3 w-3 text-[var(--cyan-accent)]" />
                      ) : (
                        <Shield className="h-3 w-3 text-[var(--amber-warning)]" />
                      )}
                      {asset.enableChecklist ? "Nexus" : "Market"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="nexus-primary-action inline-flex items-center gap-2 rounded-lg border border-[var(--border-pink)] px-3 py-2 text-xs font-semibold shadow-[var(--shadow-accent)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
                      Open Workspace
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border-soft)] px-4 py-3 text-xs text-[var(--text-muted)]">
        <div>
          <p>{selection.filtered.length} of {snapshot?.universe_size ?? NEXUS_ASSET_CATALOG.universeSize} assets</p>
          <p className="mt-1 text-[10px] text-[var(--text-soft)]">
            Catalog {new Date(snapshot?.catalog_generated_at ?? NEXUS_ASSET_CATALOG.generatedAt).toLocaleDateString("en-CA")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Previous page"
            aria-label="Previous page"
            disabled={selection.pagination.page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--text-main)] hover:border-[var(--border-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono">Page {selection.pagination.page} / {selection.pagination.pageCount}</span>
          <button
            type="button"
            title="Next page"
            aria-label="Next page"
            disabled={selection.pagination.page === selection.pagination.pageCount}
            onClick={() => setPage((value) => Math.min(selection.pagination.pageCount, value + 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--text-main)] hover:border-[var(--border-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <DataFreshnessBadge updatedAt={snapshot?.updated_at} />
        </div>
      </div>
    </RetroPanel>
  );
}
