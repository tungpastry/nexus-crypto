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
    <LineChart className="h-4 w-4 text-[var(--cyan-accent)]" />
  ) : (
    <Shield className="h-4 w-4 text-[var(--amber-warning)]" />
  );

  return (
    <RetroPanel title={`${asset.symbol} Workspace`} eyebrow={asset.name}>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="bg-[linear-gradient(90deg,#ffffff,#ff8fbd,#7dd3fc)] bg-clip-text text-4xl font-black tracking-normal text-transparent sm:text-5xl">
              {asset.symbol}
            </h1>
            <p className="pb-1 text-lg font-semibold text-[var(--text-muted)]">{asset.name}</p>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            {asset.note ||
              `${asset.name} uses the Nexus workspace for price context, chart workflow, auto checklist, and manual discipline tracking.`}
          </p>
        </div>

        <div className="grid gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-2 lg:min-w-[420px]">
          <div className="rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">Rank</p>
            <p className="mt-1 text-[var(--text-main)]">#{asset.rank}</p>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">Category</p>
            <p className="mt-1 text-[var(--text-main)]">{formatCategory(asset.category)}</p>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">Binance</p>
            <p className="mt-1 font-mono text-[var(--text-main)]">{asset.binanceSymbol || "Disabled"}</p>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] p-3">
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">TradingView</p>
            <p className="mt-1 font-mono text-[var(--text-main)]">
              {asset.tradingViewSymbol || "Disabled"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs font-semibold text-[var(--text-main)]">
              {modeIcon}
              {mode}
            </span>
          </div>
        </div>
      </div>
    </RetroPanel>
  );
}
