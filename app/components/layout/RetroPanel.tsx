import type { ReactNode } from "react";

type RetroPanelProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
};

export default function RetroPanel({
  children,
  className = "",
  title,
  eyebrow,
}: RetroPanelProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-pink-500/20 bg-black/70 shadow-[0_0_30px_rgba(255,47,166,0.12)] backdrop-blur ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_4px] opacity-25" />
      <div className="relative">
        {(title || eyebrow) && (
          <div className="border-b border-pink-500/10 px-5 py-4">
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-pink-300/80">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="mt-1 text-lg font-semibold text-pink-50">{title}</h2>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
