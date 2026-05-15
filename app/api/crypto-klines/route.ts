import { NextRequest, NextResponse } from "next/server";
import { getCryptoKlines } from "../../lib/binance";
import { getCachedOrFetch } from "../../lib/serverCache";
import { validateBinanceSymbol, validateBinanceTimeframe } from "../../lib/validators";

const KLINES_CACHE_TTL_MS = 60_000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolValidation = validateBinanceSymbol(searchParams.get("symbol"));
  const tfValidation = validateBinanceTimeframe(searchParams.get("tf"));

  if (!symbolValidation.ok) {
    return NextResponse.json(symbolValidation.response, { status: 400 });
  }

  if (!tfValidation.ok) {
    return NextResponse.json(tfValidation.response, { status: 400 });
  }

  try {
    const limit = tfValidation.tf === "1w" ? 500 : 400;
    const data = await getCachedOrFetch({
      key: `${symbolValidation.symbol}:${tfValidation.tf}:${limit}`,
      ttlMs: KLINES_CACHE_TTL_MS,
      fetcher: () =>
        getCryptoKlines(symbolValidation.symbol, tfValidation.tf, limit),
      staleErrorCode: "KLINES_PROVIDER_STALE",
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch klines";
    return NextResponse.json(
      { error: { code: "KLINES_PROVIDER_ERROR", message } },
      { status: 502 }
    );
  }
}
