import { NextRequest } from "next/server";
import { requireApiAuth } from "../../../lib/auth/api";
import {
  finalizeTifaStreamSuccess,
  runTifaChatStream,
} from "../../../lib/tifa-core/chat";
import { sanitizeProviderError } from "../../../lib/tifa-provider-gateway/redaction";
import { getTifaRuntimeConfig } from "../../../lib/tifa-runtime/config";
import { validateTifaChatInput } from "../../../lib/tifa-widget/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function isStreamErrorResult(
  result: Awaited<ReturnType<typeof runTifaChatStream>>
): result is { ok: false; error: { code: string; message: string } } {
  return "ok" in result && result.ok === false;
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

  let input: ReturnType<typeof validateTifaChatInput>;
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
        const result = await runTifaChatStream(req, input);
        if (isStreamErrorResult(result)) {
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

        const provider =
          result.mode === "provider-stream"
            ? getTifaRuntimeConfig().llmProvider
            : "tool-only";
        controller.enqueue(
          encoder.encode(
            sseEvent("start", { provider, model: result.providerModel })
          )
        );
        controller.enqueue(
          encoder.encode(
            sseEvent("tool", {
              intent: result.toolContext.intent,
              has_market: Boolean(result.toolContext.market_context),
              has_asset: Boolean(result.toolContext.asset_analysis_context),
              has_budget: Boolean(result.toolContext.budget_context),
              has_provider_health: Boolean(result.toolContext.provider_health_context),
              has_deep_health: Boolean(result.toolContext.deep_health_context),
              has_gemini_health: Boolean(result.toolContext.gemini_provider_health_context),
              has_ops_summary: Boolean(result.toolContext.ops_summary_context),
            })
          )
        );
        controller.enqueue(encoder.encode(sseEvent("budget", result.budget)));

        let finalAnswer = "";

        if (result.mode === "provider-stream" && result.stream) {
          try {
            for await (const text of result.stream) {
              if (!text) continue;
              finalAnswer += text;
              controller.enqueue(encoder.encode(sseEvent("delta", { text })));
            }
          } catch (streamError) {
            const message = sanitizeProviderError(
              streamError,
              "Provider stream failed"
            );
            controller.enqueue(
              encoder.encode(
                sseEvent("error", {
                  code: "STREAM_PROVIDER_ERROR",
                  message,
                })
              )
            );
            controller.close();
            return;
          }
        } else {
          if (result.streamErrorCode) {
            controller.enqueue(
              encoder.encode(
                sseEvent("error", {
                  code: result.streamErrorCode,
                  message: "Provider stream unavailable. Falling back to tool-only mode.",
                })
              )
            );
          }

          for (const chunk of chunkText(result.answerForFallback)) {
            finalAnswer += chunk;
            controller.enqueue(encoder.encode(sseEvent("delta", { text: chunk })));
            await new Promise((resolve) => setTimeout(resolve, 8));
          }
        }

        if (result.mode === "provider-stream" && result.postflight) {
          await finalizeTifaStreamSuccess({
            requestId: result.requestId,
            model: result.providerModel,
            estimatedCostUsd: result.postflight.estimatedCostUsd,
            monthlySpendBefore: result.postflight.monthlySpendBefore,
            answer: finalAnswer,
            message: input.message,
            context: input.context as Record<string, unknown> | undefined,
          });
        }

        controller.enqueue(
          encoder.encode(sseEvent("done", { provider, model: result.providerModel }))
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sseEvent("error", {
              code: "STREAM_ERROR",
              message: sanitizeProviderError(error, "Streaming failed"),
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
