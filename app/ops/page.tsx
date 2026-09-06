import Link from "next/link";
import { Activity, ArrowLeft, Radar } from "lucide-react";
import ProviderDeepHealthCard from "../components/insights/ProviderDeepHealthCard";
import GeminiAssistantStatusPanel from "../components/insights/GeminiAssistantStatusPanel";
import OpsExecutiveSummaryPanel from "../components/insights/OpsExecutiveSummaryPanel";
import ProviderHealthPanel from "../components/insights/ProviderHealthPanel";
import ClientErrorBoundary from "../components/layout/ClientErrorBoundary";
import NexusFooter from "../components/layout/NexusFooter";
import ThemeSwitcher from "../components/theme/ThemeSwitcher";
import TifaWidget from "../components/tifa/TifaWidget";

export default function OpsPage() {
  return (
    <main className="nexus-page-background min-h-screen px-4 py-6 text-[var(--text-main)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="nexus-control-surface inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-pink)] hover:bg-[var(--bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Top 10 Nexus Universe
          </Link>
          <ThemeSwitcher />
        </div>

        <header className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.36em] text-[var(--text-soft)]">
              Nexus Ops Center
            </p>
            <h1 className="mt-2 nexus-title-gradient bg-clip-text text-4xl font-black tracking-normal text-transparent drop-shadow-[0_0_22px_rgba(255,95,162,0.18)] sm:text-5xl">
              Provider Diagnostics
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
              Monitor lightweight readiness checks and full multi-asset Binance diagnostics without
              cluttering the market dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-main)]">
            <div className="rounded-xl border border-[var(--border-cyan)] bg-[var(--bg-panel-strong)] p-3 shadow-[var(--shadow-cyan)]">
              <Activity className="mb-2 h-4 w-4 text-[var(--cyan-accent)]" />
              Lightweight checks refresh every 60 seconds
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-strong)] p-3 shadow-[var(--shadow-pink)]">
              <Radar className="mb-2 h-4 w-4 text-[var(--mint-positive)]" />
              Deep checks run on mount and manual refresh only
            </div>
          </div>
        </header>

        <ClientErrorBoundary>
          <OpsExecutiveSummaryPanel />
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <ProviderHealthPanel />
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <GeminiAssistantStatusPanel />
        </ClientErrorBoundary>

        <ClientErrorBoundary>
          <ProviderDeepHealthCard />
        </ClientErrorBoundary>

        <NexusFooter />
      </div>
      <TifaWidget page="ops" context={{ page: "/ops" }} />
    </main>
  );
}
