import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { resolveTifaIntent } from "../../../lib/tifa-nexus/intent";
import { sanitizeProviderError } from "../../../lib/tifa-provider-gateway/redaction";
import { isSupportedTool } from "../../../lib/tifa-tools/registry";
import { orchestrateTifaTools } from "../../../lib/tifa-tools/orchestrator";
import type { TifaToolName } from "../../../lib/tifa-tools/types";

export const runtime = "nodejs";

function normalizeTools(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const tools = value
    .filter((item): item is string => typeof item === "string")
    .filter((item) => isSupportedTool(item))
    .map((item) => item as TifaToolName);
  return tools.length ? tools : undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const message = (url.searchParams.get("message") || "ops summary").trim();
    const page = url.searchParams.get("page") || undefined;
    const assetId = url.searchParams.get("assetId") || undefined;
    const timeframe = url.searchParams.get("tf") || undefined;
    const tool = url.searchParams.get("tool");

    const requestedTools =
      tool && isSupportedTool(tool) ? ([tool] as TifaToolName[]) : undefined;
    const intent = resolveTifaIntent(message, { page, assetId, timeframe });
    const result = await orchestrateTifaTools({
      req,
      origin: url.origin,
      intent,
      message,
      context: { page, assetId, timeframe },
      requestedTools,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ORCHESTRATE_ERROR",
          message: sanitizeProviderError(error, "Failed to orchestrate tools."),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      message?: string;
      intent?: string;
      context?: { page?: string; assetId?: string; timeframe?: string };
      tools?: string[];
    };
    const origin = new URL(req.url).origin;
    const message = (body.message || "").trim() || "ops summary";
    const context = body.context || {};
    const intent =
      body.intent &&
      [
        "market_snapshot",
        "asset_analysis",
        "stablecoin_explain",
        "budget_status",
        "provider_health",
        "deep_health",
        "ops_summary",
        "system_explain",
        "unknown",
      ].includes(body.intent)
        ? (body.intent as ReturnType<typeof resolveTifaIntent>)
        : resolveTifaIntent(message, context);
    const requestedTools = normalizeTools(body.tools);

    const result = await orchestrateTifaTools({
      req,
      origin,
      intent,
      message,
      context,
      requestedTools,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ORCHESTRATE_REQUEST_ERROR",
          message: sanitizeProviderError(error, "Invalid orchestration request."),
        },
      },
      { status: 400 }
    );
  }
}

