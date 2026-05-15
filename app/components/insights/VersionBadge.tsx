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
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-1 font-mono text-xs text-[var(--text-muted)] shadow-[0_0_18px_rgba(255,95,162,0.1)]">
      <span>Nexus v{version.version || "0.1.0"}</span>
      <span className="text-[rgba(125,211,252,0.55)]">/</span>
      <span>{version.short_commit || "unknown"}</span>
      <span className="text-[rgba(125,211,252,0.55)]">/</span>
      <span>{version.env || "unknown"}</span>
    </div>
  );
}
