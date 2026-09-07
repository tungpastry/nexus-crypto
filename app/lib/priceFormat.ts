const MAX_FRACTION_DIGITS = 20;

export function getTickSizeFractionDigits(tickSize?: string) {
  if (!tickSize || !/^\d+(?:\.\d+)?$/.test(tickSize)) return null;
  if (!Number.isFinite(Number(tickSize)) || Number(tickSize) <= 0) return null;

  const fraction = tickSize.split(".")[1] || "";
  const digits = fraction.replace(/0+$/, "").length;
  return digits <= MAX_FRACTION_DIGITS ? digits : null;
}

function formatWithDigits(value: number, minimum: number, maximum: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: minimum,
    maximumFractionDigits: maximum,
  });
}

export function formatBinancePrice(value: number | null, tickSize?: string) {
  if (value === null || !Number.isFinite(value)) return "--";

  const digits = getTickSizeFractionDigits(tickSize);
  if (digits === null) return formatAdaptivePrice(value);
  return formatWithDigits(value, digits, digits);
}

export function formatAdaptivePrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";

  const absolute = Math.abs(value);
  const digits = absolute >= 1 ? 2 : absolute >= 0.01 ? 4 : absolute >= 0.0001 ? 6 : 8;
  return formatWithDigits(value, Math.min(2, digits), digits);
}

export function formatUsdPrice(value: number | null) {
  const formatted = formatAdaptivePrice(value);
  return formatted === "--" ? formatted : `$${formatted}`;
}
