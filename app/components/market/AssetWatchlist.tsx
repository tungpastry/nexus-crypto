"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight, LineChart, Shield } from "lucide-react";
import { NEXUS_ASSETS } from "../../config/assets";
import RetroPanel from "../layout/RetroPanel";
import DataFreshnessBadge from "./DataFreshnessBadge";

type SnapshotAsset = {
  id: string;
  price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  volume_24h: number | null;
  market_cap: number | null;
};

type Snapshot = {
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
  if (typeof value !== "number") return <span className="text-pink-100/40">--</span>;
  const positive = value >= 0;
  return (
    <span className={positive ? "text-emerald-300" : "text-red-300"}>
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function AssetWatchlist() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

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

  const snapshotById = new Map(snapshot?.assets.map((asset) => [asset.id, asset]));
  const openWorkspace = (assetId: string) => {
    router.push(`/asset/${assetId}`);
  };

  return (
    <RetroPanel title="Asset Watchlist" eyebrow="Top 10 Nexus universe">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-pink-500/10 text-xs uppercase tracking-[0.16em] text-pink-200/55">
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
            {NEXUS_ASSETS.map((asset) => {
              const row = snapshotById.get(asset.id);

              return (
                <tr
                  key={asset.id}
                  data-testid={`asset-row-${asset.symbol}`}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer border-b border-pink-500/10 bg-transparent transition hover:bg-pink-500/10 focus:outline-none focus-visible:bg-pink-500/10"
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
                      <span className="font-mono text-xs text-pink-200/45">#{asset.rank}</span>
                      <div>
                        <p className="font-semibold text-pink-50">{asset.symbol}</p>
                        <p className="text-xs text-pink-100/45">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-pink-50">{formatPrice(row?.price)}</td>
                  <td className="px-4 py-3 font-mono">
                    <Percent value={row?.change_24h} />
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <Percent value={row?.change_7d} />
                  </td>
                  <td className="px-4 py-3 font-mono text-pink-100/70">
                    {formatCompact(row?.volume_24h)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-pink-500/20 bg-black/40 px-2 py-1 text-xs text-pink-100/70">
                      {asset.enableChecklist ? (
                        <LineChart className="h-3 w-3 text-cyan-300" />
                      ) : (
                        <Shield className="h-3 w-3 text-amber-300" />
                      )}
                      {asset.enableChecklist ? "Nexus" : "Market"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-pink-500/20 bg-black/40 px-3 py-2 text-xs font-semibold text-pink-100">
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
      <div className="flex items-center justify-between border-t border-pink-500/10 px-4 py-3 text-xs text-pink-100/60">
        <span>Prices are market data only; no trade execution or recommendations.</span>
        <DataFreshnessBadge updatedAt={snapshot?.updated_at} />
      </div>
    </RetroPanel>
  );
}
