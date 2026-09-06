import { LineChart, Shield } from "lucide-react";
import type { NexusAsset } from "../../config/assets";
import RetroPanel from "../layout/RetroPanel";
import CoinIcon from "../market/CoinIcon";

type AssetWorkspaceHeaderProps = {
  asset: NexusAsset;
};

function formatCategory(category: NexusAsset["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getCardToneClass(tone: "rank" | "category" | "binance" | "tv") {
  if (tone === "rank") {
    return "border-[rgba(255,95,162,0.28)] bg-[rgba(255,95,162,0.08)]";
  }
  if (tone === "category") {
    return "border-[rgba(196,181,253,0.3)] bg-[rgba(196,181,253,0.08)]";
  }
  if (tone === "binance") {
    return "border-[rgba(125,211,252,0.3)] bg-[rgba(125,211,252,0.08)]";
  }
  return "border-[rgba(94,234,212,0.3)] bg-[rgba(94,234,212,0.08)]";
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-full shadow-[var(--shadow-pink),var(--shadow-cyan)]">
              <CoinIcon
                src={asset.iconUrl}
                symbol={asset.symbol}
                name={asset.name}
                size="lg"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="nexus-title-gradient bg-clip-text text-4xl font-black tracking-normal text-transparent drop-shadow-[0_0_20px_rgba(255,95,162,0.2)] sm:text-5xl">
                {asset.symbol}
              </h1>
              <p className="pb-1 text-lg font-semibold text-[var(--text-muted)]">{asset.name}</p>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            {asset.note ||
              `${asset.name} uses the Nexus workspace for price context, TradingView workflow, Nexus Decision Matrix, and provider diagnostics.`}
          </p>
        </div>

        <div className="grid gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-2 lg:min-w-[420px]">
          <div className={`rounded-xl border p-3 ${getCardToneClass("rank")}`}>
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">Rank</p>
            <p className="mt-1 font-mono text-[var(--text-main)]">#{asset.rank}</p>
          </div>
          <div className={`rounded-xl border p-3 ${getCardToneClass("category")}`}>
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">Category</p>
            <p className="mt-1 font-mono text-[var(--text-main)]">{formatCategory(asset.category)}</p>
          </div>
          <div className={`rounded-xl border p-3 ${getCardToneClass("binance")}`}>
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">Binance</p>
            <p className="mt-1 font-mono text-[var(--text-main)]">
              {asset.binanceSymbol || "Unavailable"}
            </p>
          </div>
          <div className={`rounded-xl border p-3 ${getCardToneClass("tv")}`}>
            <p className="font-mono uppercase tracking-[0.16em] text-[var(--text-soft)]">TradingView</p>
            <p className="mt-1 font-mono text-[var(--text-main)]">
              {asset.tradingViewSymbol || "Unavailable"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                asset.enableChecklist
                  ? "border-[rgba(125,211,252,0.34)] bg-[rgba(125,211,252,0.08)] text-[var(--cyan-accent)]"
                  : "border-[rgba(251,191,36,0.34)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]"
              }`}
            >
              {modeIcon}
              {mode}
            </span>
          </div>
        </div>
      </div>
    </RetroPanel>
  );
}
