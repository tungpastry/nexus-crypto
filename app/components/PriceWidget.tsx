"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PriceWidget() {
  const [price, setPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  // Hàm fetch dữ liệu từ API nội bộ
  const fetchPrice = async () => {
    try {
      const res = await axios.get("/api/btc-price");
      const newPrice = parseFloat(res.data.price);
      if (price !== null && newPrice !== price) {
        setDirection(newPrice > price ? "up" : "down");
        setPrevPrice(price);
      }
      setPrice(newPrice);
    } catch (err) {
      console.error("Error fetching BTC price:", err);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000); // cập nhật mỗi 5s
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number | null) =>
    p ? `$${p.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Loading...";

  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between w-full max-w-md mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-slate-400">BTC / USDT</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={price}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`text-3xl font-bold ${
              direction === "up" ? "text-green-400" : direction === "down" ? "text-red-400" : "text-white"
            }`}
          >
            {formatPrice(price)}
          </motion.p>
        </AnimatePresence>
      </div>

      {direction === "up" && <TrendingUp size={32} className="text-green-400" />}
      {direction === "down" && <TrendingDown size={32} className="text-red-400" />}
    </div>
  );
}
