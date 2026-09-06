import Link from "next/link";
import LoginForm from "../components/auth/LoginForm";
import ThemeSwitcher from "../components/theme/ThemeSwitcher";
import { getAuthConfig } from "../lib/auth/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const authConfig = getAuthConfig();

  return (
    <main className="nexus-page-background flex min-h-screen items-center justify-center px-4 py-10 text-[var(--text-main)]">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex w-full justify-end">
          <ThemeSwitcher />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.36em] text-[var(--text-soft)]">
            LAN Local Access
          </p>
          <h1 className="nexus-title-gradient mt-3 bg-clip-text text-4xl font-black tracking-normal text-transparent sm:text-5xl">
            Nexus Crypto
          </h1>
          <p className="mt-2 text-lg font-semibold text-[var(--cyan-accent)]">
            Local Command Login
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
            LAN Local access for Nexus dashboard.
          </p>
        </div>

        {!authConfig.enabled ? (
          <div className="rounded-2xl border border-[rgba(94,234,212,0.3)] bg-[rgba(94,234,212,0.08)] p-5 text-sm text-[var(--mint-positive)]">
            Local auth is disabled.{" "}
            <Link className="text-[var(--cyan-accent)] underline decoration-[rgba(125,211,252,0.4)]" href="/">
              Open dashboard
            </Link>
            .
          </div>
        ) : authConfig.configured ? (
          <LoginForm />
        ) : (
          <div className="rounded-2xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.12)] p-5 text-sm text-[var(--red-negative)]">
            Auth is enabled but the server is missing local auth environment configuration.
          </div>
        )}
      </section>
    </main>
  );
}
