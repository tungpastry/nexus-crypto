"use client";

import { useEffect, useState } from "react";

type VersionPayload = {
  version?: string;
  short_commit?: string;
  env?: string;
};

export default function VersionBadge() {
  const [version, setVersion] = useState<VersionPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as VersionPayload;
        if (!cancelled) setVersion(payload);
      } catch (error) {
        console.warn("Failed to load Nexus version metadata", error);
      }
    }

    loadVersion();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!version) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/15 bg-black/40 px-3 py-1 font-mono text-xs text-pink-100/45 shadow-[0_0_18px_rgba(236,72,153,0.08)]">
      <span>Nexus v{version.version || "0.1.0"}</span>
      <span className="text-cyan-200/45">/</span>
      <span>{version.short_commit || "unknown"}</span>
      <span className="text-cyan-200/45">/</span>
      <span>{version.env || "unknown"}</span>
    </div>
  );
}
