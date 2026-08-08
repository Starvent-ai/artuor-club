import { test } from "node:test";
import assert from "node:assert/strict";
import { PsSessionBillingService } from "../PsSessionBillingService";
import { Money } from "../../value-objects/Money";

test("sums segment amounts and minutes when total is above the minimum threshold", () => {
  const result = PsSessionBillingService.summarize(
    [Money.fromToman(4000), Money.fromToman(3000)],
    [30, 25]
  );

  assert.equal(result.amount.toToman(), 7000);
  assert.equal(result.totalBilledMinutes, 55);
  assert.equal(result.isBelowMinimumThreshold, false);
});

test("zeroes out the amount when the total is below the minimum threshold", () => {
  const result = PsSessionBillingService.summarize([Money.fromToman(2000)], [10]);

  assert.equal(result.amount.toToman(), 0);
  assert.equal(result.isBelowMinimumThreshold, true);
});

test("records a below-threshold session only when items were attached", () => {
  const belowThreshold = PsSessionBillingService.summarize([Money.fromToman(1000)], [5]);
  assert.equal(PsSessionBillingService.shouldRecordAsTransaction(belowThreshold, false), false);
  assert.equal(PsSessionBillingService.shouldRecordAsTransaction(belowThreshold, true), true);
});

test("always records a session that meets the minimum threshold", () => {
  const aboveThreshold = PsSessionBillingService.summarize([Money.fromToman(10000)], [60]);
  assert.equal(PsSessionBillingService.shouldRecordAsTransaction(aboveThreshold, false), true);
});
