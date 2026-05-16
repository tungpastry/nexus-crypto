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
  iconUrl: string;
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
    iconUrl: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
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
    iconUrl: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
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
