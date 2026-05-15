import { NextRequest, NextResponse } from "next/server";
import { getCryptoPrice } from "../../lib/binance";
import { validateBinanceSymbol } from "../../lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validation = validateBinanceSymbol(searchParams.get("symbol"));

  if (!validation.ok) {
    return NextResponse.json(validation.response, { status: 400 });
  }

  try {
    const data = await getCryptoPrice(validation.symbol);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch price";
    return NextResponse.json(
      { error: { code: "PRICE_PROVIDER_ERROR", message } },
      { status: 502 }
    );
  }
}
