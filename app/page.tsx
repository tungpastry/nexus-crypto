import { Activity, ShieldCheck } from "lucide-react";
import ClientErrorBoundary from "./components/layout/ClientErrorBoundary";
import AssetWatchlist from "./components/market/AssetWatchlist";
import MarketSnapshot from "./components/market/MarketSnapshot";
import ProviderHealthPanel from "./components/insights/ProviderHealthPanel";
import ProviderDeepHealthCard from "./components/insights/ProviderDeepHealthCard";
import NexusFooter from "./components/layout/NexusFooter";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-6 text-[var(--text-main)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.36em] text-[var(--text-soft)]">
              Retro Market Command Center
            </p>
            <h1 className="mt-2 bg-[linear-gradient(90deg,#ffffff,#ff8fbd,#7dd3fc)] bg-clip-text text-4xl font-black tracking-normal text-transparent drop-shadow-[0_0_22px_rgba(255,95,162,0.18)] sm:text-5xl">
              Top 10 Nexus Universe
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
              Scan BTC, ETH, stablecoins, majors, altcoins, and meme assets from one clean market
              overview. Open an asset workspace for TradingView context, Nexus Decision Matrix,
              and provider diagnostics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-main)]">
            <div className="rounded-xl border border-[var(--border-cyan)] bg-[rgba(255,255,255,0.1)] p-3 shadow-[var(--shadow-cyan)]">
              <Activity className="mb-2 h-4 w-4 text-[var(--cyan-accent)]" />
              Binance + CoinGecko
            </div>
            <div className="rounded-xl border border-[rgba(94,234,212,0.28)] bg-[rgba(255,255,255,0.1)] p-3 shadow-[var(--shadow-pink)]">
              <ShieldCheck className="mb-2 h-4 w-4 text-[var(--mint-positive)]" />
              Zenora Health Ready
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

        <ClientErrorBoundary>
          <ProviderDeepHealthCard />
        </ClientErrorBoundary>

        <NexusFooter />
      </div>
    </main>
  );
}
