import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMoney,
  parseDecimal,
  sumMinor,
  chartAmount,
} from "../../lib/money.ts";

const usd = { currency: "USD", exponent: 2, locale: "en-US" };

test("money formatting preserves cents beyond JavaScript safe integer range", () => {
  assert.equal(
    formatMoney("900719925474099312", usd),
    "$9,007,199,254,740,993.12",
  );
  assert.equal(sumMinor(["900719925474099312", "1"]), "900719925474099313");
  assert.throws(() => chartAmount("900719925474099312", 2), RangeError);
});

test("zero- and three-decimal currencies and negative subunit amounts stay exact", () => {
  assert.equal(formatMoney("-1", usd), "-$0.01");
  assert.equal(parseDecimal("1200", 0), "1200");
  assert.equal(parseDecimal("12.345", 3), "12345");
  assert.equal(
    formatMoney("12345", { currency: "KWD", exponent: 3, locale: "en-US" }),
    "KWD 12.345",
  );
  assert.equal(
    formatMoney("1200", { currency: "JPY", exponent: 0, locale: "en-US" }),
    "¥1,200",
  );
});

test("input does not silently round or accept ambiguous/unsafe notation", () => {
  assert.throws(() => parseDecimal("12.345", 2), RangeError);
  assert.throws(() => parseDecimal("1e3", 2), TypeError);
  assert.throws(() => parseDecimal("1,200", 2), TypeError);
  assert.throws(() => parseDecimal("1.1", 0), RangeError);
  assert.equal(parseDecimal("0.10", 2), "10");
});
