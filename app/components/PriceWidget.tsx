"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NexusAsset } from "../config/assets";
import DataFreshnessBadge from "./market/DataFreshnessBadge";

type PriceWidgetProps = {
  asset: NexusAsset;
};

export default function PriceWidget({ asset }: PriceWidgetProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [pulse, setPulse] = useState(false);
  const [trail, setTrail] = useState<{ value: number; color: string } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!asset.binanceSymbol) {
      setPrice(null);
      setDirection(null);
      setUpdatedAt(null);
      setError("Market snapshot only");
      return;
    }

    try {
      const res = await axios.get("/api/crypto-price", {
        params: { symbol: asset.binanceSymbol },
      });
      const newPrice = parseFloat(res.data.price);

      if (price !== null && newPrice !== price) {
        const newDirection = newPrice > price ? "up" : "down";
        setDirection(newDirection);
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
      setUpdatedAt(res.data.updated_at);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${asset.symbol} price:`, err);
      setError("Price feed unavailable");
    }
  }, [asset.binanceSymbol, asset.symbol, price]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const formatPrice = (p: number | null) =>
    p ? `$${p.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Loading...";

  const ringColor =
    direction === "up"
      ? "ring-[rgba(94,234,212,0.55)] shadow-[0_0_12px_rgba(94,234,212,0.28)]"
      : direction === "down"
      ? "ring-[rgba(251,113,133,0.55)] shadow-[0_0_12px_rgba(251,113,133,0.28)]"
      : "ring-[rgba(255,255,255,0.16)] shadow-[0_0_10px_rgba(255,255,255,0.12)]";

  return (
    <motion.div
      className={`relative mx-auto flex w-full max-w-md items-center justify-between overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-5 text-[var(--text-main)] ring-2 ${ringColor} transition-all duration-700`}
      animate={{
        scale: pulse ? 1.04 : 1,
        opacity: pulse ? 1 : 0.98,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
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

      <div className="z-10 flex flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-[var(--text-muted)]">
            {asset.symbol} {asset.quote ? `/ ${asset.quote}` : ""}
          </h2>
          <DataFreshnessBadge updatedAt={updatedAt} />
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={price}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`text-4xl font-extrabold leading-snug ${
              direction === "up"
                ? "text-[var(--mint-positive)] drop-shadow-[0_0_6px_rgba(94,234,212,0.7)]"
                : direction === "down"
                ? "text-[var(--red-negative)] drop-shadow-[0_0_6px_rgba(251,113,133,0.7)]"
                : "text-[var(--text-main)]"
            }`}
          >
            {asset.binanceSymbol ? formatPrice(price) : "Market data only"}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {error || `${asset.name} price via Nexus crypto-price`}
        </p>
      </div>

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
            className="text-[var(--mint-positive)] drop-shadow-[0_0_8px_rgba(94,234,212,0.7)]"
          />
        )}
        {direction === "down" && (
          <TrendingDown
            size={38}
            className="text-[var(--red-negative)] drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]"
          />
        )}
        {!direction && <Shield size={34} className="text-[var(--pink-soft)]" />}
      </motion.div>
    </motion.div>
  );
}
