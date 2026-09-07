"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ClientErrorBoundaryProps = {
  children: ReactNode;
};

type ClientErrorBoundaryState = {
  error: Error | null;
};

export default class ClientErrorBoundary extends Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Nexus client panel failed to render", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const showMessage = process.env.NODE_ENV === "development";

    return (
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] nexus-panel-surface p-5 text-[var(--text-main)] shadow-[var(--error-shadow)]">
        <div className="pointer-events-none absolute inset-0 nexus-scanlines bg-[length:100%_4px] opacity-20" />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-soft)]">
            Nexus client guard
          </p>
          <h2 className="mt-1 text-lg font-semibold">Nexus client panel failed to render</h2>
          {showMessage && (
            <p className="mt-3 rounded-lg border border-[var(--border-soft)] nexus-input-surface p-3 font-mono text-xs text-[var(--text-muted)]">
              {this.state.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="mt-4 rounded-lg border border-[var(--brand-border-hover)] bg-[var(--error-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--error-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Reload dashboard
          </button>
        </div>
      </section>
    );
  }
}
