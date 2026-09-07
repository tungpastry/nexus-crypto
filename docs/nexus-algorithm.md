# Nexus Algorithm v1.1

## Scope

The Nexus Algorithm turns Binance OHLCV candles into an explainable Decision Matrix. It is a workflow aid, not an order engine or a prediction system. It does not issue buy/sell commands and does not replace trader judgment.

The implementation is in `app/lib/nexusAlgorithm.ts`.

## Inputs

`buildNexusSignal(asset, timeframe, candles, updatedAt, options?)` receives:

- one Binance-enabled catalog asset.
- one configured timeframe.
- OHLCV candles.
- source update time.
- optional higher-timeframe direction/signal context.

Existing callers can omit the optional context. Market-only assets do not invoke the algorithm.

## Core Metrics

### Moving averages

- MA20: average of the latest 20 closes.
- MA50: average of the latest 50 closes.
- MA200: average of the latest 200 closes.

Bull alignment requires `price > MA20 > MA50 > MA200`. Bear alignment is the inverse. Any other structure is neutral/sideway.

### ATR14

True range for each candle is:

```text
max(
  high - low,
  abs(high - previousClose),
  abs(low - previousClose)
)
```

ATR14 is the average of the latest 14 true ranges. At least 15 candles are required. `atrPercent = atr14 / close * 100`.

Volatility regimes:

- `Unknown`: insufficient data, invalid ATR, or non-positive price.
- `Low`: ATR% below 1.
- `Normal`: ATR% from 1 through 4.
- `High`: ATR% above 4.

### Volume confirmation

`volumeRatio = latestVolume / averageVolume20`.

- `pass`: directional context and ratio at least 1.05.
- `warn`: directional context and ratio at least 0.8.
- `fail`: directional context and ratio below 0.8.
- `neutral`: neutral direction or insufficient volume.

### Support and resistance context

The latest 50 candles provide minimum low and maximum high boundaries. Price is near support/resistance when its distance is within one ATR or 1.5 percent. Otherwise it is midrange.

The rule favors bull context near support and bear context near resistance. Opposing edge locations fail; midrange warns; unavailable or neutral context stays neutral.

### Higher-timeframe agreement

Higher-timeframe context is optional:

- same directional bull/bear context: `pass`.
- either side neutral: `warn`.
- opposing bull/bear directions: `fail`.
- omitted context: `neutral`.

## Rules And Score

The maximum score is 100:

| Rule | Max |
| --- | ---: |
| Trend alignment | 20 |
| MA position | 15 |
| Latest candle momentum | 12 |
| Candle body confirmation | 10 |
| Risk/MA20 distance | 10 |
| ATR volatility | 10 |
| Volume confirmation | 8 |
| Support/resistance context | 8 |
| Higher-timeframe agreement | 4 |
| Data freshness | 3 |

Rule scoring is deterministic:

- `pass`: full rule score.
- `warn` or `neutral`: half, rounded.
- `fail`: zero.

The total is capped at 100.

## Direction, Setup, And Risk

- Direction: `bull`, `bear`, or `neutral`.
- Trend: `UPTREND`, `DOWNTREND`, or `SIDEWAY`.
- Bias: directional bias, neutral, or high-risk chop.
- Setup: continuation, pullback continuation, compression, or no setup.
- Risk: high when price is more than 7 percent from MA20; otherwise medium for neutral structure and low for directional structure.

These labels describe current candle context. They are not recommendations.

## Workflow State

States are evaluated in this order:

1. `No Trade`: score below 45, high risk, or high volatility with no setup.
2. `Confirmed`: score at least 80, directional context, momentum pass, volume pass/warn, non-high risk, and non-high volatility.
3. `Ready`: score at least 65, directional context, non-high risk, and a recognized setup.
4. `Watch`: all remaining usable contexts.

The names represent operator workflow states only.

## Display Semantics

- Live ticker price and matrix price can differ.
- The matrix uses the latest Binance candle close and labels it `Kline Close`.
- Kline close, MA20/50/200, and ATR14 use the asset's committed Binance tick-size precision.
- ATR%, volatility, and volume ratio retain their own percentage/ratio formatting.
- Matrix data refreshes on the candle workflow cadence, currently 60 seconds.

## Limitations

- Simple moving averages lag price.
- Support/resistance uses a basic 50-candle range, not a full market-structure model.
- Higher-timeframe agreement is neutral unless a caller supplies context.
- Volume and volatility thresholds are static across assets/timeframes.
- No fees, slippage, liquidity depth, position sizing, backtest, or execution model is included.
- Provider and stale-cache quality still affect the resulting context.

## Testing

`app/lib/nexusAlgorithm.test.ts` covers deterministic trend, score bounds, ATR, volatility, volume, support/resistance, and workflow states. Price formatting has separate unit coverage in `app/lib/priceFormat.test.ts`.
