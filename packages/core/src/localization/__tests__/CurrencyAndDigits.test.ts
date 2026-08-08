import { test } from "node:test";
import assert from "node:assert/strict";
import { toPersianDigits, toLatinDigits } from "../PersianDigits";
import { formatTomanWithSeparators } from "../CurrencyFormatter";

test("converts latin digits to persian digits", () => {
  assert.equal(toPersianDigits(1403), "۱۴۰۳");
  assert.equal(toPersianDigits("2026"), "۲۰۲۶");
});

test("converts persian digits back to latin digits", () => {
  assert.equal(toLatinDigits("۱۴۰۳"), "1403");
});

test("formats toman amount with thousand separators and persian digits", () => {
  const formatted = formatTomanWithSeparators(1500000);
  assert.equal(formatted, `${toPersianDigits("1,500,000")} تومان`);
});

test("formats zero and negative amounts correctly", () => {
  assert.equal(formatTomanWithSeparators(0), "۰ تومان");
  assert.ok(formatTomanWithSeparators(-5000).startsWith("-"));
});

test("rounds fractional amounts before formatting", () => {
  const formatted = formatTomanWithSeparators(1999.6);
  assert.equal(formatted, `${toPersianDigits("2,000")} تومان`);
});
