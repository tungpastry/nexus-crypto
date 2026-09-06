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
      className={`relative overflow-hidden rounded-2xl border border-[var(--border-soft)] nexus-panel-surface shadow-[var(--shadow-panel),var(--shadow-pink)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 nexus-scanlines bg-[length:100%_4px] opacity-20" />
      <div className="relative">
        {(title || eyebrow) && (
          <div className="border-b border-[var(--line-subtle)] bg-[var(--bg-panel)] px-5 py-4">
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
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
