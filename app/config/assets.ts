export type NexusAssetCategory =
  | "major"
  | "stablecoin"
  | "exchange"
  | "altcoin"
  | "meme";

export type NexusAsset = {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  category: NexusAssetCategory;
  coingeckoId: string;
  binanceSymbol?: string;
  tradingViewSymbol?: string;
  quote?: "USDT" | "USD";
  enablePrice: boolean;
  enableChart: boolean;
  enableMA: boolean;
  enableChecklist: boolean;
  note?: string;
};

export const NEXUS_ASSETS: NexusAsset[] = [
  {
    id: "bitcoin",
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    category: "major",
    coingeckoId: "bitcoin",
    binanceSymbol: "BTCUSDT",
    tradingViewSymbol: "BINANCE:BTCUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
  {
    id: "ethereum",
    rank: 2,
    name: "Ethereum",
    symbol: "ETH",
    category: "major",
    coingeckoId: "ethereum",
    binanceSymbol: "ETHUSDT",
    tradingViewSymbol: "BINANCE:ETHUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
  {
    id: "tether",
    rank: 3,
    name: "Tether",
    symbol: "USDT",
    category: "stablecoin",
    coingeckoId: "tether",
    enablePrice: true,
    enableChart: false,
    enableMA: false,
    enableChecklist: false,
    note: "Stablecoin: market data only; Nexus MA checklist is disabled.",
  },
  {
    id: "bnb",
    rank: 4,
    name: "BNB",
    symbol: "BNB",
    category: "exchange",
    coingeckoId: "binancecoin",
    binanceSymbol: "BNBUSDT",
    tradingViewSymbol: "BINANCE:BNBUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
  {
    id: "xrp",
    rank: 5,
    name: "XRP",
    symbol: "XRP",
    category: "altcoin",
    coingeckoId: "ripple",
    binanceSymbol: "XRPUSDT",
    tradingViewSymbol: "BINANCE:XRPUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
  {
    id: "usd-coin",
    rank: 6,
    name: "USDC",
    symbol: "USDC",
    category: "stablecoin",
    coingeckoId: "usd-coin",
    enablePrice: true,
    enableChart: false,
    enableMA: false,
    enableChecklist: false,
    note: "Stablecoin: market data only.",
  },
  {
    id: "solana",
    rank: 7,
    name: "Solana",
    symbol: "SOL",
    category: "altcoin",
    coingeckoId: "solana",
    binanceSymbol: "SOLUSDT",
    tradingViewSymbol: "BINANCE:SOLUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
  {
    id: "tron",
    rank: 8,
    name: "TRON",
    symbol: "TRX",
    category: "altcoin",
    coingeckoId: "tron",
    binanceSymbol: "TRXUSDT",
    tradingViewSymbol: "BINANCE:TRXUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
  {
    id: "shiba-inu",
    rank: 9,
    name: "Shiba Inu",
    symbol: "SHIB",
    category: "meme",
    coingeckoId: "shiba-inu",
    binanceSymbol: "SHIBUSDT",
    tradingViewSymbol: "BINANCE:SHIBUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
    note: "Meme coin high-volatility asset.",
  },
  {
    id: "dogecoin",
    rank: 10,
    name: "Dogecoin",
    symbol: "DOGE",
    category: "meme",
    coingeckoId: "dogecoin",
    binanceSymbol: "DOGEUSDT",
    tradingViewSymbol: "BINANCE:DOGEUSDT",
    quote: "USDT",
    enablePrice: true,
    enableChart: true,
    enableMA: true,
    enableChecklist: true,
  },
];

export const BINANCE_SYMBOLS = NEXUS_ASSETS.flatMap((asset) =>
  asset.binanceSymbol ? [asset.binanceSymbol] : []
);

export const BINANCE_SYMBOL_SET = new Set(BINANCE_SYMBOLS);

export function findAssetById(id: string) {
  return NEXUS_ASSETS.find((asset) => asset.id === id);
}

export function findAssetByBinanceSymbol(symbol: string) {
  return NEXUS_ASSETS.find((asset) => asset.binanceSymbol === symbol);
}
