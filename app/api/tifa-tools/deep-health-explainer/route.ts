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
      intent: "deep_health",
      message: "deep provider health summary",
      requestedTools: ["deep_health_explainer"],
    });

    const payload = result.outputs.deep_health_explainer;
    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DEEP_HEALTH_EXPLAINER_UNAVAILABLE",
            message: result.warnings.join("; ") || "Deep health explainer unavailable.",
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
          code: "DEEP_HEALTH_EXPLAINER_ERROR",
          message: sanitizeProviderError(error, "Failed to build deep health explainer."),
        },
      },
      { status: 500 }
    );
  }
}

