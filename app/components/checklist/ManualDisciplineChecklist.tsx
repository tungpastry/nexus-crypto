"use client";

import { useEffect, useState } from "react";
import { CheckCircle, RotateCcw, XCircle } from "lucide-react";
import type { NexusAsset } from "../../config/assets";
import type { NexusTimeframe } from "../../config/timeframes";
import { safeReadJson, safeWriteJson } from "../../lib/clientStorage";
import RetroPanel from "../layout/RetroPanel";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  group: string;
}

type ManualDisciplineChecklistProps = {
  asset: NexusAsset;
  timeframe: NexusTimeframe;
};

const initialChecklist: ChecklistItem[] = [
  { id: "calm_mindset", label: "Calm mindset", checked: false, group: "Discipline" },
  { id: "no_fomo", label: "No FOMO", checked: false, group: "Discipline" },
  { id: "no_overtrade", label: "No overtrade", checked: false, group: "Discipline" },
  { id: "news_checked", label: "Major news checked", checked: false, group: "Risk" },
  { id: "plan_confirmed", label: "Plan confirmed", checked: false, group: "Plan" },
  {
    id: "invalidation_confirmed",
    label: "Invalidation level confirmed",
    checked: false,
    group: "Plan",
  },
  { id: "risk_accepted", label: "Risk accepted", checked: false, group: "Risk" },
];

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    typeof item.checked === "boolean" &&
    typeof item.group === "string"
  );
}

function isChecklistItems(value: unknown): value is ChecklistItem[] {
  return Array.isArray(value) && value.every(isChecklistItem);
}

export default function ManualDisciplineChecklist({
  asset,
  timeframe,
}: ManualDisciplineChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const storageKey = `manualDisciplineChecklist:${asset.symbol}:${timeframe.binance}`;
  const progress = Math.round(
    (items.filter((item) => item.checked).length / items.length) * 100
  );

  useEffect(() => {
    setItems(safeReadJson<ChecklistItem[]>(storageKey, initialChecklist, isChecklistItems));
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    safeWriteJson(storageKey, items);
  }, [items, loadedStorageKey, storageKey]);

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
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-pink-100/65">
          Stored under <span className="font-mono text-pink-200">{storageKey}</span>
        </p>
        <button
          type="button"
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

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1">
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
                  <span
                    className={
                      item.checked ? "text-sm text-emerald-200" : "text-sm text-pink-50/75"
                    }
                  >
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
