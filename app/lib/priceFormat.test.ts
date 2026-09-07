import { describe, expect, it } from "vitest";
import {
  formatAdaptivePrice,
  formatBinancePrice,
  formatUsdPrice,
  getTickSizeFractionDigits,
} from "./priceFormat";

describe("Binance price formatting", () => {
  it.each([
    ["0.01000000", 2],
    ["0.00010000", 4],
    ["0.00001000", 5],
    ["0.00000001", 8],
    ["1.00000000", 0],
  ])("derives precision from tick size %s", (tickSize, expected) => {
    expect(getTickSizeFractionDigits(tickSize)).toBe(expected);
  });

  it("formats representative Binance pairs at their exact tick precision", () => {
    expect(formatBinancePrice(80_274.43, "0.01000000")).toBe("80,274.43");
    expect(formatBinancePrice(0.3351, "0.00010000")).toBe("0.3351");
    expect(formatBinancePrice(0.09086, "0.00001000")).toBe("0.09086");
    expect(formatBinancePrice(0.00000552, "0.00000001")).toBe("0.00000552");
  });

  it("preserves trailing precision and treats zero as a valid price", () => {
    expect(formatBinancePrice(80_274.4, "0.01000000")).toBe("80,274.40");
    expect(formatBinancePrice(0, "0.01000000")).toBe("0.00");
  });

  it("handles missing and invalid values safely", () => {
    expect(formatBinancePrice(null, "0.01000000")).toBe("--");
    expect(formatBinancePrice(Number.NaN, "0.01000000")).toBe("--");
    expect(getTickSizeFractionDigits("0.00000000")).toBeNull();
    expect(formatAdaptivePrice(0.00000552)).toBe("0.00000552");
    expect(formatUsdPrice(1)).toBe("$1.00");
  });
});
