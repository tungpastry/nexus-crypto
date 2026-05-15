import Link from "next/link";
import LoginForm from "../components/auth/LoginForm";
import { getAuthConfig } from "../lib/auth/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const authConfig = getAuthConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050008] px-4 py-10 text-white">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.36em] text-pink-300/75">
            LAN Local Access
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-pink-50 sm:text-5xl">
            Nexus Crypto
          </h1>
          <p className="mt-2 text-lg font-semibold text-cyan-100/80">
            Local Command Login
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-pink-100/55">
            LAN Local access for Nexus dashboard.
          </p>
        </div>

        {!authConfig.enabled ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-black/60 p-5 text-sm text-emerald-100/75">
            Local auth is disabled.{" "}
            <Link className="text-cyan-200 underline decoration-cyan-300/40" href="/">
              Open dashboard
            </Link>
            .
          </div>
        ) : authConfig.configured ? (
          <LoginForm />
        ) : (
          <div className="rounded-2xl border border-red-400/20 bg-red-950/30 p-5 text-sm text-red-100/80">
            Auth is enabled but the server is missing local auth environment configuration.
          </div>
        )}
      </section>
    </main>
  );
}
