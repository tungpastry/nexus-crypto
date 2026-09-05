"use client";

type TifaQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

type TifaQuickActionsProps = {
  actions: TifaQuickAction[];
  onPick: (prompt: string) => void;
  disabled?: boolean;
};

export default function TifaQuickActions({
  actions,
  onPick,
  disabled = false,
}: TifaQuickActionsProps) {
  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(action.prompt)}
          title={action.prompt}
          className="rounded-full border border-[var(--border-soft)] bg-black px-2.5 py-1 text-[11px] text-[var(--text-main)] transition hover:border-[var(--border-cyan)] hover:bg-[rgba(125,211,252,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(125,211,252,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
