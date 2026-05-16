"use client";

import { useState } from "react";

type CoinIconProps = {
  src?: string;
  symbol: string;
  name: string;
  size?: "sm" | "lg";
};

const SIZE_CLASS = {
  sm: {
    outer:
      "h-7 w-7 border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)]",
    image: "h-5 w-5",
    text: "text-[9px]",
  },
  lg: {
    outer:
      "h-14 w-14 sm:h-16 sm:w-16 border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)]",
    image: "h-10 w-10 sm:h-11 sm:w-11",
    text: "text-xs",
  },
} as const;

export default function CoinIcon({ src, symbol, name, size = "sm" }: CoinIconProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZE_CLASS[size];

  if (!src || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border font-bold text-[var(--text-main)] ${sizeClass.outer} ${sizeClass.text}`}
        aria-label={`${name} logo fallback`}
        title={name}
      >
        {symbol.slice(0, 4)}
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border ${sizeClass.outer}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        title={name}
        loading="lazy"
        className={`${sizeClass.image} rounded-full object-contain`}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
