import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../lib/auth/api";
import { getCryptoPrice } from "../../lib/binance";
import { getCachedOrFetch } from "../../lib/serverCache";
import { validateBinanceSymbol } from "../../lib/validators";

const PRICE_CACHE_TTL_MS = 5_000;

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const validation = validateBinanceSymbol(searchParams.get("symbol"));

  if (!validation.ok) {
    return NextResponse.json(validation.response, { status: 400 });
  }

  try {
    const data = await getCachedOrFetch({
      key: validation.symbol,
      ttlMs: PRICE_CACHE_TTL_MS,
      fetcher: () => getCryptoPrice(validation.symbol),
      staleErrorCode: "PRICE_PROVIDER_STALE",
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch price";
    return NextResponse.json(
      { error: { code: "PRICE_PROVIDER_ERROR", message } },
      { status: 502 }
    );
  }
}
