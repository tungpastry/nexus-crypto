"use client";

import { useEffect, useState } from "react";
import { CheckCircle, RotateCcw, XCircle } from "lucide-react";
import type { NexusAsset } from "../config/assets";
import type { NexusTimeframe } from "../config/timeframes";
import RetroPanel from "./layout/RetroPanel";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  group: string;
}

interface ManualChecklistProps {
  asset: NexusAsset;
  timeframe: NexusTimeframe;
}

const initialChecklist: ChecklistItem[] = [
  { id: "context", label: "Higher-timeframe context reviewed", checked: false, group: "Context" },
  { id: "pullback", label: "Pullback or retest area marked", checked: false, group: "Setup" },
  { id: "signal", label: "Confirmation candle reviewed", checked: false, group: "Setup" },
  { id: "risk", label: "Risk and invalidation are written down", checked: false, group: "Risk" },
  { id: "news", label: "Major news and event risk checked", checked: false, group: "Risk" },
  { id: "psych", label: "Calm mindset; no FOMO or overtrade impulse", checked: false, group: "Discipline" },
];

export default function ManualChecklist({ asset, timeframe }: ManualChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
  const [progress, setProgress] = useState(0);
  const storageKey = `manualChecklist:${asset.symbol}:${timeframe.binance}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setItems(saved ? JSON.parse(saved) : initialChecklist);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
    const done = items.filter((i) => i.checked).length;
    setProgress(Math.round((done / items.length) * 100));
  }, [items, storageKey]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const resetChecklist = () => {
    setItems(initialChecklist);
  };

  const grouped = items.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <RetroPanel
      title="Manual Discipline Checklist"
      eyebrow={`${asset.symbol} ${timeframe.label} namespace`}
      className="mt-6"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-pink-100/65">
          Stored under <span className="font-mono text-pink-200">{storageKey}</span>
        </p>
        <button
          onClick={resetChecklist}
          className="inline-flex items-center gap-2 rounded-lg border border-pink-500/20 bg-black/40 px-3 py-2 text-xs text-pink-100 transition hover:bg-pink-500/10"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="px-5">
        <div className="h-2 overflow-hidden rounded-full bg-pink-950">
          <div
            className={`h-full transition-all duration-700 ${
              progress === 100 ? "bg-emerald-400" : "bg-pink-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-pink-100/50">Progress: {progress}%</p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        {Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group}>
            <h4 className="mb-2 text-sm font-semibold text-pink-100">{group}</h4>
            <div className="space-y-2">
              {groupItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                    item.checked
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-pink-500/10 bg-black/35 hover:bg-pink-500/10"
                  }`}
                >
                  <span className={item.checked ? "text-sm text-emerald-200" : "text-sm text-pink-50/75"}>
                    {item.label}
                  </span>
                  {item.checked ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-pink-100/30" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </RetroPanel>
  );
}
