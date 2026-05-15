import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "../../lib/auth/api";
import { getCryptoPrice } from "../../lib/binance";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const data = await getCryptoPrice("BTCUSDT");
    return NextResponse.json({ price: data.price, updated_at: data.updated_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching BTC price:", message);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
