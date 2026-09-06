"use client";

import Image from "next/image";
import { useState } from "react";

type TifaAvatarSize = "sm" | "md" | "lg";

type TifaAvatarProps = {
  size?: TifaAvatarSize;
  className?: string;
  alt?: string;
};

const AVATAR_SRC = "/tifa-avatar.jpg";

const SIZE_CLASS: Record<TifaAvatarSize, { outer: string; image: string; text: string }> = {
  sm: {
    outer: "h-8 w-8",
    image: "h-8 w-8",
    text: "text-[10px]",
  },
  md: {
    outer: "h-10 w-10",
    image: "h-10 w-10",
    text: "text-xs",
  },
  lg: {
    outer: "h-12 w-12",
    image: "h-12 w-12",
    text: "text-sm",
  },
};

export default function TifaAvatar({ size = "md", className = "", alt = "Tifa assistant avatar" }: TifaAvatarProps) {
  const [failed, setFailed] = useState(false);
  const currentSize = SIZE_CLASS[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--bg-card)] shadow-[0_0_18px_rgba(255,95,162,0.2)] ${currentSize.outer} ${className}`}
      aria-label={alt}
      title="TifaWidget Assistant"
    >
      {failed ? (
        <span className={`font-bold text-[var(--text-main)] ${currentSize.text}`}>T</span>
      ) : (
        <Image
          src={AVATAR_SRC}
          alt={alt}
          width={64}
          height={64}
          className={`rounded-full object-cover ${currentSize.image}`}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
