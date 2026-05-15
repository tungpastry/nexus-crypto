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
      className={`relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] shadow-[0_18px_50px_rgba(0,0,0,0.35),0_0_35px_rgba(255,95,162,0.08)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20" />
      <div className="relative">
        {(title || eyebrow) && (
          <div className="border-b border-white/10 px-5 py-4">
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-soft)]">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="mt-1 text-lg font-semibold text-[var(--text-main)]">{title}</h2>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
