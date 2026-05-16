import { NextResponse } from "next/server";
import { BINANCE_SYMBOLS } from "../../../config/assets";
import { getCryptoKlines, getCryptoPrice } from "../../../lib/binance";

type DeepCheckStatus = "ok" | "warn" | "error";

type EndpointCheck = {
  status: DeepCheckStatus;
  latency_ms: number;
  message?: string;
  candles?: number;
};

type SymbolCheck = {
  status: "ok" | "error";
  price: EndpointCheck;
  klines: EndpointCheck;
};

async function measurePrice(symbol: string): Promise<EndpointCheck> {
  const started = Date.now();
  try {
    await getCryptoPrice(symbol);
    return { status: "ok", latency_ms: Date.now() - started };
  } catch (error) {
    return {
      status: "error",
      latency_ms: Date.now() - started,
      message: error instanceof Error ? error.message : "Price provider error",
    };
  }
}

async function measureKlines(symbol: string): Promise<EndpointCheck> {
  const started = Date.now();
  try {
    const res = await getCryptoKlines(symbol, "1h", 5);
    return {
      status: "ok",
      latency_ms: Date.now() - started,
      candles: Array.isArray(res.candles) ? res.candles.length : 0,
    };
  } catch (error) {
    return {
      status: "error",
      latency_ms: Date.now() - started,
      message: error instanceof Error ? error.message : "Klines provider error",
    };
  }
}

async function checkSymbol(symbol: string): Promise<[string, SymbolCheck]> {
  const [price, klines] = await Promise.all([
    measurePrice(symbol),
    measureKlines(symbol),
  ]);

  return [
    symbol,
    {
      status:
        price.status === "ok" && klines.status === "ok" ? "ok" : "error",
      price,
      klines,
    },
  ];
}

export async function GET() {
  const started = Date.now();
  const checksEntries = await Promise.all(
    BINANCE_SYMBOLS.map((symbol) => checkSymbol(symbol))
  );
  const checks = Object.fromEntries(checksEntries);
  const symbolChecks = Object.values(checks) as SymbolCheck[];
  const symbolsTotal = BINANCE_SYMBOLS.length;
  const symbolsOk = symbolChecks.filter((item) => item.status === "ok").length;
  const symbolsError = symbolChecks.filter(
    (item) => item.status === "error"
  ).length;
  const symbolsWarn = 0;

  const status =
    symbolsOk === symbolsTotal
      ? "ok"
      : symbolsOk > 0
        ? "degraded"
        : "error";

  return NextResponse.json({
    provider: "nexus_crypto",
    mode: "deep",
    status,
    updated_at: new Date().toISOString(),
    summary: {
      symbols_total: symbolsTotal,
      symbols_ok: symbolsOk,
      symbols_warn: symbolsWarn,
      symbols_error: symbolsError,
      latency_ms: Date.now() - started,
    },
    checks,
  });
}
