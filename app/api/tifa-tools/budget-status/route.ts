import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { getGeminiBudgetStatus } from "../../../lib/gemini-budget/status";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const status = await getGeminiBudgetStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BUDGET_STATUS_ERROR",
          message: error instanceof Error ? error.message : "Failed to read budget status",
        },
      },
      { status: 500 }
    );
  }
}
