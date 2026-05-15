import { BINANCE_SYMBOLS, BINANCE_SYMBOL_SET } from "../config/assets";
import { BINANCE_TIMEFRAMES, BINANCE_TIMEFRAME_SET } from "../config/timeframes";

export function validateBinanceSymbol(symbol: string | null) {
  const normalized = (symbol || "BTCUSDT").toUpperCase();
  if (BINANCE_SYMBOL_SET.has(normalized)) {
    return { ok: true as const, symbol: normalized };
  }

  return {
    ok: false as const,
    response: {
      error: {
        code: "UNSUPPORTED_SYMBOL",
        message: "Symbol is not allowed",
        allowed: BINANCE_SYMBOLS,
      },
    },
  };
}

export function validateBinanceTimeframe(tf: string | null) {
  const normalized = tf || "1h";
  if (BINANCE_TIMEFRAME_SET.has(normalized)) {
    return { ok: true as const, tf: normalized };
  }

  return {
    ok: false as const,
    response: {
      error: {
        code: "UNSUPPORTED_TIMEFRAME",
        message: "Timeframe is not allowed",
        allowed: BINANCE_TIMEFRAMES,
      },
    },
  };
}
