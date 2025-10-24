import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    // Gọi API Binance lấy giá BTC/USDT
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    return NextResponse.json({ price: res.data.price });
  } catch (error: any) {
    console.error("Error fetching BTC price:", error.message);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
