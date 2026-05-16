import { NextRequest } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import { runTifaChat } from "../../../lib/tifa-core/chat";
import { validateTifaChatInput } from "../../../lib/tifa-widget/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function chunkText(text: string, size = 72) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) {
    const body = await auth.response.text();
    return new Response(sseEvent("error", { code: "AUTH_REQUIRED", message: body }), {
      status: 401,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  let input;
  try {
    const body = await req.json();
    input = validateTifaChatInput(body);
  } catch (error) {
    return new Response(
      sseEvent("error", {
        code: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Invalid request body",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const result = await runTifaChat(req, input);
        if (!result.ok) {
          controller.enqueue(
            encoder.encode(
              sseEvent("error", {
                code: result.error.code,
                message: result.error.message,
              })
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            sseEvent("start", { provider: result.provider, model: result.model })
          )
        );
        controller.enqueue(
          encoder.encode(
            sseEvent("tool", {
              intent: result.tool_context.intent,
              has_market: Boolean(result.tool_context.market_context),
              has_asset: Boolean(result.tool_context.asset_analysis_context),
              has_budget: Boolean(result.tool_context.budget_context),
              has_provider_health: Boolean(result.tool_context.provider_health_context),
            })
          )
        );
        controller.enqueue(encoder.encode(sseEvent("budget", result.budget)));

        for (const chunk of chunkText(result.answer)) {
          controller.enqueue(encoder.encode(sseEvent("delta", { text: chunk })));
          await new Promise((resolve) => setTimeout(resolve, 8));
        }

        controller.enqueue(
          encoder.encode(sseEvent("done", { provider: result.provider, model: result.model }))
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sseEvent("error", {
              code: "STREAM_ERROR",
              message: error instanceof Error ? error.message : "Streaming failed",
            })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
