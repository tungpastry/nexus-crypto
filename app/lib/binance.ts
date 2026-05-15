import axios from "axios";

export type NexusCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const BINANCE_BASE_URL = "https://api.binance.com/api/v3";

export async function getCryptoPrice(symbol: string) {
  const res = await axios.get(`${BINANCE_BASE_URL}/ticker/price`, {
    params: { symbol },
    timeout: 10_000,
  });

  return {
    provider: "binance",
    symbol,
    price: String(res.data.price),
    updated_at: new Date().toISOString(),
  };
}

export async function getCryptoKlines(symbol: string, tf: string, limit = 400) {
  const res = await axios.get(`${BINANCE_BASE_URL}/klines`, {
    params: { symbol, interval: tf, limit },
    timeout: 10_000,
  });

  const candles: NexusCandle[] = res.data.map((candle: unknown[]) => ({
    time: Number(candle[0]),
    open: Number(candle[1]),
    high: Number(candle[2]),
    low: Number(candle[3]),
    close: Number(candle[4]),
    volume: Number(candle[5]),
  }));

  return {
    provider: "binance",
    symbol,
    tf,
    updated_at: new Date().toISOString(),
    candles,
  };
}
