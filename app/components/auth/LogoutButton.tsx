"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMePayload = {
  authenticated?: boolean;
  auth_enabled?: boolean;
};

export default function LogoutButton() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthState() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as AuthMePayload;
        if (!cancelled) {
          setVisible(Boolean(payload.auth_enabled && payload.authenticated));
        }
      } catch {
        if (!cancelled) setVisible(false);
      }
    }

    loadAuthState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-1 font-mono text-xs text-[var(--text-muted)] transition hover:border-[rgba(125,211,252,0.4)] hover:text-[var(--cyan-accent)] disabled:opacity-60"
    >
      {loading ? "Leaving" : "Logout"}
    </button>
  );
}
