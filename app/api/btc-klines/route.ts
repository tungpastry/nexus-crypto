import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../lib/auth/api";
import { getCryptoKlines } from "../../lib/binance";
import { validateBinanceTimeframe } from "../../lib/validators";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const tfValidation = validateBinanceTimeframe(searchParams.get("tf"));

  if (!tfValidation.ok) {
    return NextResponse.json(tfValidation.response, { status: 400 });
  }

  try {
    const data = await getCryptoKlines("BTCUSDT", tfValidation.tf);
    const candles = data.candles.map(({ time, open, high, low, close }) => ({
      time,
      open,
      high,
      low,
      close,
    }));
    return NextResponse.json(candles);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch klines";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
