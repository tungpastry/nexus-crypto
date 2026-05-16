import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { getAssetAnalysisContext } from "../../../lib/tifa-nexus/assetAnalysisContext";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("assetId")?.trim() || undefined;
  const timeframe = searchParams.get("tf")?.trim() || undefined;

  if (!assetId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ASSET_ID_REQUIRED",
          message: "assetId query param is required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const context = await getAssetAnalysisContext(assetId, timeframe);
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ASSET_ANALYSIS_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to build asset analysis context",
        },
      },
      { status: 400 }
    );
  }
}
