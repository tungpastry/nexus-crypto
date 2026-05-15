export type NexusTimeframe = {
  label: string;
  tradingView: string;
  binance: string;
};

export const NEXUS_TIMEFRAMES: NexusTimeframe[] = [
  { label: "15m", tradingView: "15", binance: "15m" },
  { label: "30m", tradingView: "30", binance: "30m" },
  { label: "1h", tradingView: "60", binance: "1h" },
  { label: "4h", tradingView: "240", binance: "4h" },
  { label: "1D", tradingView: "D", binance: "1d" },
  { label: "1W", tradingView: "W", binance: "1w" },
];

export const BINANCE_TIMEFRAMES = NEXUS_TIMEFRAMES.map((tf) => tf.binance);
export const BINANCE_TIMEFRAME_SET = new Set(BINANCE_TIMEFRAMES);

export function findTimeframeByLabel(label: string) {
  return NEXUS_TIMEFRAMES.find((tf) => tf.label === label);
}

export function findTimeframeByTradingView(tradingView: string) {
  return NEXUS_TIMEFRAMES.find((tf) => tf.tradingView === tradingView);
}

export function findTimeframeByBinance(binance: string) {
  return NEXUS_TIMEFRAMES.find((tf) => tf.binance === binance);
}
