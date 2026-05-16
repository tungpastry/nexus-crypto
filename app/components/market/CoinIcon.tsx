"use client";

import { useState } from "react";

type CoinIconProps = {
  src?: string;
  symbol: string;
  name: string;
};

export default function CoinIcon({ src, symbol, name }: CoinIconProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] text-[9px] font-bold text-[var(--text-main)]"
        aria-label={`${name} logo fallback`}
        title={name}
      >
        {symbol.slice(0, 4)}
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        title={name}
        loading="lazy"
        className="h-5 w-5 rounded-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
