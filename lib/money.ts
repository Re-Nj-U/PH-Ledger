/** Exact minor-unit utilities. Charts may convert only after a safe-range check. */
export type CurrencyFormat = {
  currency: string;
  exponent: number;
  locale: string;
};

function scale(exponent: number): bigint {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 3) {
    throw new RangeError("Supported currency precision is 0–3 decimal places.");
  }
  return 10n ** BigInt(exponent);
}

export function minor(value: string): bigint {
  if (!/^-?\d+$/.test(value))
    throw new TypeError("Money must be an integer string.");
  return BigInt(value);
}

export function sumMinor(values: readonly string[]): string {
  return values.reduce((sum, value) => sum + minor(value), 0n).toString();
}

export function subtractMinor(left: string, right: string): string {
  return (minor(left) - minor(right)).toString();
}

export function parseDecimal(value: string, exponent: number): string {
  const factor = scale(exponent);
  if (!/^-?\d+(?:\.\d+)?$/.test(value))
    throw new TypeError("Enter a valid amount.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  if (fraction.length > exponent)
    throw new RangeError(`Use at most ${exponent} decimal places.`);
  const amount =
    BigInt(whole) * factor + BigInt(fraction.padEnd(exponent, "0") || "0");
  return (negative ? -amount : amount).toString();
}

export function formatMoney(value: string, config: CurrencyFormat): string {
  const amount = minor(value);
  const factor = scale(config.exponent);
  const absolute = amount < 0n ? -amount : amount;
  const whole = absolute / factor;
  const fraction = (absolute % factor)
    .toString()
    .padStart(config.exponent, "0");
  const signedWhole = amount < 0n ? (whole === 0n ? -0 : -whole) : whole;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: config.exponent,
    maximumFractionDigits: config.exponent,
  })
    .formatToParts(signedWhole)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
}

export function chartAmount(value: string, exponent: number): number {
  const amount = minor(value);
  if (
    amount > BigInt(Number.MAX_SAFE_INTEGER) ||
    amount < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError("Amount exceeds safe chart precision.");
  }
  return Number(amount) / Number(scale(exponent));
}
