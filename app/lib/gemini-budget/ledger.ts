import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type {
  GeminiBudgetLedgerEntry,
  GeminiBudgetMonthlyTotals,
  GeminiBudgetPolicy,
} from "./types";

const CSV_HEADER =
  "month_utc,timestamp_utc,request_id,status,reason,model,estimated_cost_usd,total_cost_usd,input_tokens,output_tokens,monthly_spend_before,monthly_spend_after";

function resolvePath(filePath: string) {
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function currentMonthUtc(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

export function getCurrentMonthUtc() {
  return currentMonthUtc();
}

export async function ensureLedgerFiles(policy: GeminiBudgetPolicy) {
  const ledgerPath = resolvePath(policy.ledgerFile);
  const statePath = resolvePath(policy.stateFile);
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  await mkdir(path.dirname(statePath), { recursive: true });

  try {
    await readFile(ledgerPath, "utf8");
  } catch {
    await writeFile(ledgerPath, `${CSV_HEADER}\n`, "utf8");
  }

  try {
    await readFile(statePath, "utf8");
  } catch {
    await writeFile(
      statePath,
      JSON.stringify(
        {
          current_month: currentMonthUtc(),
          monthly_spend_usd: 0,
          monthly_requests: 0,
          updated_at: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

export async function readMonthlyTotals(
  policy: GeminiBudgetPolicy,
  month = currentMonthUtc()
): Promise<GeminiBudgetMonthlyTotals> {
  const ledgerPath = resolvePath(policy.ledgerFile);
  const raw = await readFile(ledgerPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  if (!lines.length) {
    return { month, monthlySpendUsd: 0, monthlyRequests: 0 };
  }

  const rows = lines.slice(1);
  let monthlySpendUsd = 0;
  let monthlyRequests = 0;

  for (const row of rows) {
    const cols = splitCsvLine(row);
    if (cols[0] !== month) continue;
    monthlyRequests += 1;
    const spendAfter = Number.parseFloat(cols[11] ?? "0");
    if (Number.isFinite(spendAfter) && spendAfter > monthlySpendUsd) {
      monthlySpendUsd = spendAfter;
    }
  }

  return { month, monthlySpendUsd, monthlyRequests };
}

export async function appendLedgerEntry(
  policy: GeminiBudgetPolicy,
  entry: GeminiBudgetLedgerEntry
) {
  const ledgerPath = resolvePath(policy.ledgerFile);
  const row = [
    entry.month_utc,
    entry.timestamp_utc,
    entry.request_id,
    entry.status,
    entry.reason,
    entry.model,
    entry.estimated_cost_usd.toFixed(6),
    entry.total_cost_usd.toFixed(6),
    String(entry.input_tokens),
    String(entry.output_tokens),
    entry.monthly_spend_before.toFixed(6),
    entry.monthly_spend_after.toFixed(6),
  ]
    .map(escapeCsv)
    .join(",");

  await appendFile(ledgerPath, `${row}\n`, "utf8");
  await writeBudgetState(policy, {
    current_month: entry.month_utc,
    monthly_spend_usd: entry.monthly_spend_after,
    monthly_requests: undefined,
    updated_at: entry.timestamp_utc,
    last_request_id: entry.request_id,
    last_status: entry.status,
    last_reason: entry.reason,
  });
}

type BudgetStatePatch = {
  current_month: string;
  monthly_spend_usd: number;
  monthly_requests?: number;
  updated_at: string;
  last_request_id: string;
  last_status: string;
  last_reason: string;
};

export async function writeBudgetState(
  policy: GeminiBudgetPolicy,
  patch: Partial<BudgetStatePatch>
) {
  const statePath = resolvePath(policy.stateFile);
  let base: Record<string, unknown> = {};
  try {
    const raw = await readFile(statePath, "utf8");
    base = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    base = {};
  }
  const next = {
    ...base,
    ...patch,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  };
  await writeFile(statePath, JSON.stringify(next, null, 2), "utf8");
}
