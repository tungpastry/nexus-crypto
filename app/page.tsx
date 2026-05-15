import { Activity, ShieldCheck } from "lucide-react";
import ClientErrorBoundary from "./components/layout/ClientErrorBoundary";
import AssetWatchlist from "./components/market/AssetWatchlist";
import MarketSnapshot from "./components/market/MarketSnapshot";
import ProviderHealthPanel from "./components/insights/ProviderHealthPanel";
import VersionBadge from "./components/insights/VersionBadge";
import LogoutButton from "./components/auth/LogoutButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050008] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-pink-500/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.36em] text-pink-300/75">
              Retro Market Command Center
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-normal text-pink-50 sm:text-5xl">
              Top 10 Nexus Universe
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-pink-100/60">
              Scan BTC, ETH, stablecoins, majors, altcoins, and meme assets from one clean market
              overview. Open an asset workspace for chart, Nexus Auto Checklist, and Manual
              Discipline Checklist.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-pink-100/70">
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-3">
              <Activity className="mb-2 h-4 w-4 text-cyan-300" />
              Binance + CoinGecko
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-black/50 p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-emerald-300" />
              Zenora health ready
            </div>
          </div>
        </header>

        <ClientErrorBoundary>
          <MarketSnapshot />
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <AssetWatchlist />
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <ProviderHealthPanel />
        </ClientErrorBoundary>

        <footer className="flex flex-col items-center gap-3 pb-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ClientErrorBoundary>
              <VersionBadge />
            </ClientErrorBoundary>
            <ClientErrorBoundary>
              <LogoutButton />
            </ClientErrorBoundary>
          </div>
          <p className="text-center text-xs text-pink-100/40">
            Market data only. Nexus does not execute trades or provide trading recommendations.
          </p>
        </footer>
      </div>
    </main>
  );
}
