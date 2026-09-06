import Link from "next/link";
import { Activity, ShieldCheck } from "lucide-react";
import ClientErrorBoundary from "./components/layout/ClientErrorBoundary";
import AssetWatchlist from "./components/market/AssetWatchlist";
import MarketSnapshot from "./components/market/MarketSnapshot";
import NexusFooter from "./components/layout/NexusFooter";
import ThemeSwitcher from "./components/theme/ThemeSwitcher";
import TifaWidget from "./components/tifa/TifaWidget";

export default function Home() {
  return (
    <main className="nexus-page-background min-h-screen px-4 py-6 text-[var(--text-main)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.36em] text-[var(--text-soft)]">
              Retro Market Command Center
            </p>
            <h1 className="mt-2 nexus-title-gradient bg-clip-text text-4xl font-black tracking-normal text-transparent drop-shadow-[0_0_22px_rgba(255,95,162,0.18)] sm:text-5xl">
              Top 100 Nexus Universe
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
              Scan BTC, ETH, stablecoins, majors, altcoins, and meme assets from one clean market
              overview. Open an asset workspace for TradingView context, live price flow, and
              Nexus Decision Matrix.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <ThemeSwitcher />
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-main)]">
              <div className="rounded-xl border border-[var(--border-cyan)] bg-[var(--bg-panel-strong)] p-3 shadow-[var(--shadow-cyan)]">
                <Activity className="mb-2 h-4 w-4 text-[var(--cyan-accent)]" />
                Binance + CoinGecko
              </div>
              <Link
                href="/ops"
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-strong)] p-3 shadow-[var(--shadow-pink)] transition hover:border-[var(--border-pink)] hover:bg-[var(--bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <ShieldCheck className="mb-2 h-4 w-4 text-[var(--mint-positive)]" />
                Zenora Ops Center
              </Link>
            </div>
          </div>
        </header>

        <ClientErrorBoundary>
          <MarketSnapshot />
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <AssetWatchlist />
        </ClientErrorBoundary>

        <NexusFooter />
      </div>
      <TifaWidget page="home" context={{ page: "/" }} />
    </main>
  );
}
