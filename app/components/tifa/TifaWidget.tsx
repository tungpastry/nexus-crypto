"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { TifaPageContext } from "../../lib/tifa-core/types";
import TifaAvatar from "./TifaAvatar";
import TifaChatPanel from "./TifaChatPanel";

type TifaWidgetProps = {
  page: "home" | "asset" | "ops";
  context?: TifaPageContext;
};

export default function TifaWidget({ page, context }: TifaWidgetProps) {
  const [open, setOpen] = useState(false);

  const panelSizeClass = useMemo(() => "h-[72vh] w-[min(420px,calc(100vw-1.5rem))] sm:h-[620px] sm:w-[420px]", []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="tifa-panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`pointer-events-auto ${panelSizeClass}`}
          >
            <TifaChatPanel page={page} context={context} onClose={() => setOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-pink)] bg-[linear-gradient(135deg,rgba(255,95,162,0.95),rgba(244,114,182,0.8))] text-[var(--text-main)] shadow-[0_16px_34px_rgba(0,0,0,0.36),0_0_30px_rgba(255,95,162,0.34)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)]"
        aria-label={open ? "Close Tifa assistant" : "Open Tifa assistant"}
      >
        <TifaAvatar size="md" />
      </button>
    </div>
  );
}
