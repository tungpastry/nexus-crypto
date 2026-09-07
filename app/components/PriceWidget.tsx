"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NexusAsset } from "../config/assets";
import { getMarketOnlyReason } from "../lib/assetCapabilities";
import { formatBinancePrice, formatUsdPrice } from "../lib/priceFormat";
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
  const priceRef = useRef<number | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!asset.binanceSymbol) {
      try {
        const res = await axios.get("/api/market-snapshot");
        const market = res.data.assets?.find((item: { id?: string }) => item.id === asset.id);
        const newPrice = typeof market?.price === "number" ? market.price : null;
        const previousPrice = priceRef.current;
        setDirection(
          previousPrice !== null && newPrice !== null && newPrice !== previousPrice
            ? newPrice > previousPrice
              ? "up"
              : "down"
            : null
        );
        priceRef.current = newPrice;
        setPrice(newPrice);
        setUpdatedAt(res.data.updated_at ?? null);
        setError(newPrice === null ? "CoinGecko price unavailable" : null);
      } catch (err) {
        console.error(`Error fetching ${asset.symbol} market snapshot:`, err);
        setError("Market snapshot unavailable");
      }
      return;
    }

    try {
      const res = await axios.get("/api/crypto-price", {
        params: { symbol: asset.binanceSymbol },
      });
      const newPrice = parseFloat(res.data.price);

      const previousPrice = priceRef.current;
      if (previousPrice !== null && newPrice !== previousPrice) {
        const newDirection = newPrice > previousPrice ? "up" : "down";
        setDirection(newDirection);
        setPulse(true);

        // Tạo hiệu ứng đuôi mờ theo hướng giá
        setTrail({
          value: previousPrice,
          color: newDirection === "up" ? "rgba(16,185,129,0.5)" : "rgba(248,113,113,0.5)",
        });

        setTimeout(() => {
          setPulse(false);
          setTrail(null);
        }, 1000);
      }

      priceRef.current = newPrice;
      setPrice(newPrice);
      setUpdatedAt(res.data.updated_at);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${asset.symbol} price:`, err);
      setError("Price feed unavailable");
    }
  }, [asset.binanceSymbol, asset.id, asset.symbol]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, asset.binanceSymbol ? 5_000 : 60_000);
    return () => clearInterval(interval);
  }, [asset.binanceSymbol, fetchPrice]);

  const formattedPrice =
    price === null
      ? "Loading..."
      : asset.binanceSymbol
        ? formatBinancePrice(price, asset.binancePriceTickSize)
        : formatUsdPrice(price);

  const ringColor =
    direction === "up"
      ? "ring-[rgba(94,234,212,0.52)] shadow-[0_0_14px_rgba(94,234,212,0.24)]"
      : direction === "down"
      ? "ring-[rgba(251,113,133,0.5)] shadow-[0_0_14px_rgba(251,113,133,0.22)]"
      : "ring-[rgba(253,224,71,0.42)] shadow-[0_0_12px_rgba(253,224,71,0.2)]";

  return (
    <motion.div
      className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-[var(--border-soft)] nexus-card-surface p-5 text-[var(--text-main)] ring-2 ${ringColor} shadow-[var(--shadow-panel)] transition-all duration-700`}
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
          <motion.div
            key={price}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={`flex flex-wrap items-baseline gap-2 text-4xl font-extrabold leading-snug ${
              direction === "up"
                ? "text-[var(--mint-positive)] drop-shadow-[0_0_6px_rgba(94,234,212,0.7)]"
                : direction === "down"
                ? "text-[var(--red-negative)] drop-shadow-[0_0_6px_rgba(251,113,133,0.55)]"
                : "text-[var(--yellow-accent)]"
            }`}
          >
            <span>{formattedPrice}</span>
            {price !== null && asset.binanceSymbol && (
              <span className="font-mono text-sm font-semibold text-[var(--text-muted)]">
                {asset.quote || "USDT"}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {error ||
            (asset.binanceSymbol
              ? "Live Binance crypto-price feed"
              : "CoinGecko snapshot · refreshes every 60 seconds")}
        </p>
        {!asset.binanceSymbol && (
          <p className="mt-1 max-w-sm text-[10px] leading-4 text-[var(--text-soft)]">
            {getMarketOnlyReason(asset)}
          </p>
        )}
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
            className="text-[var(--red-negative)] drop-shadow-[0_0_8px_rgba(251,113,133,0.55)]"
          />
        )}
        {!direction && <Shield size={34} className="text-[var(--pink-soft)]" />}
      </motion.div>
    </motion.div>
  );
}
