import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { orchestrateTifaTools } from "../../../lib/tifa-tools/orchestrator";
import { sanitizeProviderError } from "../../../lib/tifa-provider-gateway/redaction";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const result = await orchestrateTifaTools({
      req,
      origin,
      intent: "provider_health",
      message: "provider health summary",
      requestedTools: ["provider_health_explainer"],
    });

    const payload = result.outputs.provider_health_explainer;
    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_HEALTH_EXPLAINER_UNAVAILABLE",
            message: result.warnings.join("; ") || "Provider health explainer unavailable.",
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
          code: "PROVIDER_HEALTH_EXPLAINER_ERROR",
          message: sanitizeProviderError(error, "Failed to build provider health explainer."),
        },
      },
      { status: 500 }
    );
  }
}

