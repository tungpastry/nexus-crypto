import { Activity, Github, ShieldCheck, Sparkles } from "lucide-react";
import LogoutButton from "../auth/LogoutButton";
import VersionBadge from "../insights/VersionBadge";
import ClientErrorBoundary from "./ClientErrorBoundary";

export default function NexusFooter() {
  return (
    <footer className="rounded-2xl border border-[var(--border-soft)] nexus-panel-surface p-4 shadow-[var(--shadow-panel),var(--shadow-pink)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-pink)] bg-[rgba(255,95,162,0.08)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--pink-soft)]" />
            Nexus Crypto SaaS 2026
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-cyan)] bg-[rgba(125,211,252,0.08)] px-3 py-1 text-xs text-[var(--text-main)]">
            <Activity className="h-3.5 w-3.5 text-[var(--cyan-accent)]" />
            Binance + CoinGecko
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(94,234,212,0.32)] bg-[rgba(94,234,212,0.08)] px-3 py-1 text-xs text-[var(--text-main)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--mint-positive)]" />
            Zenora Health Ready
          </span>
        </div>

        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Dual-theme crypto decision-support dashboard for watching the Top 10 Nexus Universe,
          syncing price, chart, timeframe context, and structured checklist discipline.
        </p>

        <p className="text-xs leading-5 text-[var(--text-soft)]">
          Market data only. Nexus does not execute trades, does not custody funds, and does not
          provide financial or trading recommendations.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <ClientErrorBoundary>
            <VersionBadge />
          </ClientErrorBoundary>
          <ClientErrorBoundary>
            <LogoutButton />
          </ClientErrorBoundary>
        </div>

        <p className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]">
          <Github className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          © 2026 Nexus Crypto / Built for Nexus × Zenora workflow / tungpastry/nexus-crypto
        </p>
      </div>
    </footer>
  );
}
