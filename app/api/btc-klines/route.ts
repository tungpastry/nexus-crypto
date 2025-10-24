import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tf = searchParams.get("tf") || "1h"; // mặc định 1h
  const limit = tf === "1M" ? 500 : 400;

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${tf}&limit=${limit}`;
    const res = await axios.get(url);
    const candles = res.data.map((c: any) => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
    }));
    return NextResponse.json(candles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
