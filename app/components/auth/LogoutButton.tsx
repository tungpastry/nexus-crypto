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
      className="rounded-full border border-pink-500/15 bg-black/40 px-3 py-1 font-mono text-xs text-pink-100/45 transition hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-60"
    >
      {loading ? "Leaving" : "Logout"}
    </button>
  );
}
