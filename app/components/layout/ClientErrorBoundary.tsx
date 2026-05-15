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
      <section className="relative overflow-hidden rounded-2xl border border-pink-500/25 bg-black/80 p-5 text-pink-50 shadow-[0_0_30px_rgba(255,47,166,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_4px] opacity-25" />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-pink-300/80">
            Nexus client guard
          </p>
          <h2 className="mt-1 text-lg font-semibold">Nexus client panel failed to render</h2>
          {showMessage && (
            <p className="mt-3 rounded-lg border border-pink-500/15 bg-black/50 p-3 font-mono text-xs text-pink-100/70">
              {this.state.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="mt-4 rounded-lg border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-50 transition hover:bg-pink-500/20"
          >
            Reload dashboard
          </button>
        </div>
      </section>
    );
  }
}
