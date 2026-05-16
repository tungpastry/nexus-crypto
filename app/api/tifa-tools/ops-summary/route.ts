import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { sanitizeProviderError } from "../../../lib/tifa-provider-gateway/redaction";
import { orchestrateTifaTools } from "../../../lib/tifa-tools/orchestrator";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const result = await orchestrateTifaTools({
      req,
      origin,
      intent: "ops_summary",
      message: "ops executive summary",
      requestedTools: ["ops_summary"],
    });

    const payload = result.outputs.ops_summary;
    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "OPS_SUMMARY_UNAVAILABLE",
            message: result.warnings.join("; ") || "Ops summary unavailable.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "OPS_SUMMARY_ERROR",
          message: sanitizeProviderError(error, "Failed to build ops summary."),
        },
      },
      { status: 500 }
    );
  }
}

