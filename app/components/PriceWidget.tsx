"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PriceWidget() {
  const [price, setPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [pulse, setPulse] = useState(false);
  const [trail, setTrail] = useState<{ value: number; color: string } | null>(null);

  // ✅ Lấy giá BTC từ API nội bộ
  const fetchPrice = async () => {
    try {
      const res = await axios.get("/api/btc-price");
      const newPrice = parseFloat(res.data.price);

      if (price !== null && newPrice !== price) {
        const newDirection = newPrice > price ? "up" : "down";
        setDirection(newDirection);
        setPrevPrice(price);
        setPulse(true);

        // Tạo hiệu ứng đuôi mờ theo hướng giá
        setTrail({
          value: price,
          color: newDirection === "up" ? "rgba(16,185,129,0.5)" : "rgba(248,113,113,0.5)",
        });

        setTimeout(() => {
          setPulse(false);
          setTrail(null);
        }, 1000);
      }

      setPrice(newPrice);
    } catch (err) {
      console.error("Error fetching BTC price:", err);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number | null) =>
    p ? `$${p.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Loading...";

  // 🎨 Viền glow động theo xu hướng
  const ringColor =
    direction === "up"
      ? "ring-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
      : direction === "down"
      ? "ring-red-500/50 shadow-[0_0_12px_rgba(248,113,113,0.25)]"
      : "ring-slate-700/40 shadow-[0_0_10px_rgba(100,116,139,0.15)]";

  return (
    <motion.div
      className={`relative bg-gradient-to-b from-gray-900 to-black text-white p-5 rounded-2xl border border-slate-800
        ring-2 ${ringColor} transition-all duration-700 w-full max-w-md mx-auto flex items-center justify-between overflow-hidden`}
      animate={{
        scale: pulse ? 1.04 : 1,
        opacity: pulse ? 1 : 0.98,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Hiệu ứng fade trail */}
      {trail && (
        <motion.div
          key={trail.value}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 blur-xl"
          style={{
            background: `radial-gradient(circle at center, ${trail.color} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Giá BTC */}
      <div className="flex flex-col z-10">
        <h2 className="text-sm font-semibold text-slate-400 tracking-wide">BTC / USDT</h2>

        <AnimatePresence mode="wait">
          <motion.p
            key={price}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`text-4xl font-extrabold leading-snug ${
              direction === "up"
                ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                : direction === "down"
                ? "text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]"
                : "text-slate-200"
            }`}
          >
            {formatPrice(price)}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Icon hướng giá + glow */}
      <motion.div
        animate={{
          scale: pulse ? 1.2 : 1,
          rotate: pulse ? (direction === "up" ? 8 : -8) : 0,
        }}
        transition={{ duration: 0.4 }}
        className="z-10"
      >
        {direction === "up" && (
          <TrendingUp
            size={38}
            className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]"
          />
        )}
        {direction === "down" && (
          <TrendingDown
            size={38}
            className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.7)]"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
