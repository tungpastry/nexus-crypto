import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { getMarketContext } from "../../../lib/tifa-nexus/marketContext";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const context = await getMarketContext(origin, req);
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MARKET_CONTEXT_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to build market context",
        },
      },
      { status: 502 }
    );
  }
}
