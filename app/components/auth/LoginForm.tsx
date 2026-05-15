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
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-pink-500/20 bg-black/60 p-5 shadow-[0_0_32px_rgba(236,72,153,0.14)]"
    >
      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.22em] text-pink-100/55">
        Username
        <input
          className="rounded-lg border border-pink-500/20 bg-[#09010f] px-3 py-3 text-sm normal-case tracking-normal text-pink-50 outline-none transition focus:border-cyan-300/70"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.22em] text-pink-100/55">
        Password
        <input
          className="rounded-lg border border-pink-500/20 bg-[#09010f] px-3 py-3 text-sm normal-case tracking-normal text-pink-50 outline-none transition focus:border-cyan-300/70"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-950/30 px-3 py-2 text-xs text-red-100/80">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-pink-300/40 bg-pink-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-pink-50 transition hover:border-cyan-300/60 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Checking" : "Enter Nexus"}
      </button>
    </form>
  );
}
