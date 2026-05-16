import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../lib/auth/api";
import { runTifaChat } from "../../lib/tifa-core/chat";
import { validateTifaChatInput } from "../../lib/tifa-widget/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const input = validateTifaChatInput(body);
    const result = await runTifaChat(req, input);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.error.code === "TIFA_DISABLED" ? 400 : 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TIFA_REQUEST_ERROR",
          message: error instanceof Error ? error.message : "Failed to process tifa request",
        },
      },
      { status: 400 }
    );
  }
}
