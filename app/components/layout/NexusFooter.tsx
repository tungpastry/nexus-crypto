import { Activity, Github, ShieldCheck, Sparkles } from "lucide-react";
import LogoutButton from "../auth/LogoutButton";
import VersionBadge from "../insights/VersionBadge";
import ClientErrorBoundary from "./ClientErrorBoundary";

export default function NexusFooter() {
  return (
    <footer className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_35px_rgba(255,95,162,0.08)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--pink-soft)]" />
            Nexus Crypto SaaS 2026
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs text-[var(--text-muted)]">
            <Activity className="h-3.5 w-3.5 text-[var(--cyan-accent)]" />
            Binance + CoinGecko
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs text-[var(--text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--mint-positive)]" />
            Zenora Health Ready
          </span>
        </div>

        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Retro black-pink crypto decision-support dashboard for watching the Top 10 Nexus
          Universe, syncing price, chart, timeframe context, and structured checklist discipline.
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
