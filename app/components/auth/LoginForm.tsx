"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Login failed. Check your local credentials.");
        return;
      }

      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.replace(next || "/");
      router.refresh();
    } catch {
      setError("Login unavailable. Check the local server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_35px_rgba(255,95,162,0.08)]"
    >
      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
        Username
        <input
          className="rounded-lg border border-[rgba(255,255,255,0.16)] bg-[rgba(0,0,0,0.35)] px-3 py-3 text-sm normal-case tracking-normal text-[var(--text-main)] outline-none transition focus:border-[rgba(125,211,252,0.7)]"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
        Password
        <input
          className="rounded-lg border border-[rgba(255,255,255,0.16)] bg-[rgba(0,0,0,0.35)] px-3 py-3 text-sm normal-case tracking-normal text-[var(--text-main)] outline-none transition focus:border-[rgba(125,211,252,0.7)]"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.12)] px-3 py-2 text-xs text-[var(--red-negative)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-[rgba(255,95,162,0.35)] bg-[linear-gradient(135deg,#ff5fa2,#ff8fbd)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#120712] shadow-[0_0_24px_rgba(255,95,162,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(255,95,162,0.42)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Checking" : "Enter Nexus"}
      </button>
    </form>
  );
}
