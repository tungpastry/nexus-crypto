"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  group: string;
}

interface ManualChecklistProps {
  tf: string;
}

const initialChecklist: ChecklistItem[] = [
  { id: "trend", label: "H4 xu hướng giảm", checked: false, group: "Trend & Setup" },
  { id: "ma20", label: "Giá dưới MA20 (M30 + H1)", checked: false, group: "Position" },
  { id: "pullback", label: "Giá test vùng cản + MA20", checked: false, group: "Pullback" },
  { id: "signal", label: "Có Long Wick / Engulfing xác nhận", checked: false, group: "Signal Candle" },
  { id: "rr", label: "RR tối thiểu 1:1", checked: false, group: "Risk/Reward" },
  { id: "psych", label: "Tâm lý bình tĩnh, không FOMO", checked: false, group: "Psychology" },
];

export default function ManualChecklist({ tf }: ManualChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
  const [progress, setProgress] = useState(0);

  // ✅ Load trạng thái từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("manualChecklist");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // ✅ Lưu lại khi thay đổi
  useEffect(() => {
    localStorage.setItem("manualChecklist", JSON.stringify(items));
    const done = items.filter((i) => i.checked).length;
    setProgress(Math.round((done / items.length) * 100));
  }, [items]);

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

  // ✅ Group các item theo category
  const grouped = items.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-gray-900 text-white p-5 rounded-2xl mt-6 max-w-3xl mx-auto shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-200">
          📝 Manual Checklist <span className="text-sm text-gray-400">({tf.toUpperCase()})</span>
        </h3>
        <button
          onClick={resetChecklist}
          className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition"
        >
          Reset
        </button>
      </div>

      {/* Thanh tiến trình */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-700 ${
            progress === 100 ? "bg-emerald-400" : "bg-amber-400"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mb-3">Progress: {progress}%</p>

      {/* ✅ Hiển thị theo nhóm */}
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="mb-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-1">{group}</h4>
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg border transition ${
                  item.checked
                    ? "bg-emerald-900/40 border-emerald-500"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-700/50"
                }`}
              >
                <span
                  className={`text-sm ${
                    item.checked ? "text-emerald-300" : "text-gray-300"
                  }`}
                >
                  {item.label}
                </span>
                {item.checked ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
