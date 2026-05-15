import { LineChart, Shield } from "lucide-react";
import type { NexusAsset } from "../../config/assets";
import RetroPanel from "../layout/RetroPanel";

type AssetWorkspaceHeaderProps = {
  asset: NexusAsset;
};

function formatCategory(category: NexusAsset["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function AssetWorkspaceHeader({ asset }: AssetWorkspaceHeaderProps) {
  const mode = asset.enableChecklist ? "Nexus Mode" : "Market Mode";
  const modeIcon = asset.enableChecklist ? (
    <LineChart className="h-4 w-4 text-cyan-300" />
  ) : (
    <Shield className="h-4 w-4 text-amber-300" />
  );

  return (
    <RetroPanel title={`${asset.symbol} Workspace`} eyebrow={asset.name}>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="text-4xl font-black tracking-normal text-pink-50 sm:text-5xl">
              {asset.symbol}
            </h1>
            <p className="pb-1 text-lg font-semibold text-pink-100/75">{asset.name}</p>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-pink-100/60">
            {asset.note ||
              `${asset.name} uses the Nexus workspace for price context, chart workflow, auto checklist, and manual discipline tracking.`}
          </p>
        </div>

        <div className="grid gap-2 text-xs text-pink-100/70 sm:grid-cols-2 lg:min-w-[420px]">
          <div className="rounded-xl border border-pink-500/15 bg-black/40 p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-pink-200/45">Rank</p>
            <p className="mt-1 text-pink-50">#{asset.rank}</p>
          </div>
          <div className="rounded-xl border border-pink-500/15 bg-black/40 p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-pink-200/45">Category</p>
            <p className="mt-1 text-pink-50">{formatCategory(asset.category)}</p>
          </div>
          <div className="rounded-xl border border-pink-500/15 bg-black/40 p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-pink-200/45">Binance</p>
            <p className="mt-1 font-mono text-pink-50">{asset.binanceSymbol || "Disabled"}</p>
          </div>
          <div className="rounded-xl border border-pink-500/15 bg-black/40 p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-pink-200/45">TradingView</p>
            <p className="mt-1 font-mono text-pink-50">
              {asset.tradingViewSymbol || "Disabled"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-500/25 bg-black/45 px-3 py-2 text-xs font-semibold text-pink-50">
              {modeIcon}
              {mode}
            </span>
          </div>
        </div>
      </div>
    </RetroPanel>
  );
}
