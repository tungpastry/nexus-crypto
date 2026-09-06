"use client";

type OpsIssueListPanelProps = {
  issues: Array<{
    id: string;
    severity: "info" | "warn" | "error";
    title: string;
    detail: string;
    source: "provider_health" | "deep_health" | "gemini_provider" | "budget";
  }>;
  recommendations: string[];
};

function issueClass(severity: "info" | "warn" | "error") {
  if (severity === "error") {
    return "border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.08)] text-[var(--red-negative)]";
  }
  if (severity === "warn") {
    return "border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)] text-[var(--amber-warning)]";
  }
  return "border-[rgba(125,211,252,0.3)] bg-[rgba(125,211,252,0.08)] text-[var(--cyan-accent)]";
}

export default function OpsIssueListPanel({
  issues,
  recommendations,
}: OpsIssueListPanelProps) {
  return (
    <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-soft)]">
        Ops Issues & Recommendations
      </p>

      {issues.length ? (
        <div className="mt-3 grid gap-2">
          {issues.slice(0, 8).map((issue) => (
            <div key={issue.id} className={`rounded-lg border p-2 text-xs ${issueClass(issue.severity)}`}>
              <p className="font-semibold">
                [{issue.source}] {issue.title}
              </p>
              <p className="mt-1">{issue.detail}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--mint-positive)]">No active ops issues detected.</p>
      )}

      <div className="mt-4 space-y-1">
        <p className="text-xs font-semibold text-[var(--text-main)]">Recommended next checks:</p>
        {recommendations.slice(0, 4).map((item) => (
          <p key={item} className="text-xs text-[var(--text-muted)]">
            - {item}
          </p>
        ))}
      </div>
    </section>
  );
}

