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
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3">
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
        className="nexus-primary-action pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-pink)] shadow-[var(--shadow-panel),var(--shadow-accent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        aria-label={open ? "Close Tifa assistant" : "Open Tifa assistant"}
      >
        <TifaAvatar size="md" />
      </button>
    </div>
  );
}
