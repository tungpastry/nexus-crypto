import { NextResponse } from "next/server";
import axios from "axios";
import { getCryptoKlines, getCryptoPrice } from "../../lib/binance";

async function measure(check: () => Promise<unknown>) {
  const started = Date.now();
  try {
    await check();
    return { status: "ok", latency_ms: Date.now() - started };
  } catch (error) {
    return {
      status: "error",
      latency_ms: Date.now() - started,
      message: error instanceof Error ? error.message : "Unknown provider error",
    };
  }
}

export async function GET() {
  const [binancePrice, binanceKlines, marketSnapshot] = await Promise.all([
    measure(() => getCryptoPrice("BTCUSDT")),
    measure(() => getCryptoKlines("BTCUSDT", "1h", 5)),
    measure(() =>
      axios.get("https://api.coingecko.com/api/v3/ping", {
        timeout: 10_000,
      })
    ),
  ]);

  const checks = {
    binance_price: binancePrice,
    binance_klines: binanceKlines,
    market_snapshot: marketSnapshot,
  };
  const status = Object.values(checks).every((check) => check.status === "ok")
    ? "ok"
    : "degraded";

  return NextResponse.json({
    provider: "nexus_crypto",
    status,
    updated_at: new Date().toISOString(),
    checks,
  });
}
