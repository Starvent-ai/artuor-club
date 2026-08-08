import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionBillingService } from "../SessionBillingService";

test("amount below 5000 toman is shown as zero", () => {
  const result = SessionBillingService.calculate(60, 60000);
  assert.equal(result.billedMinutes, 0);
  assert.equal(result.isBelowMinimumThreshold, true);
  assert.equal(result.amount.toToman(), 0);
});

test("amount exactly at 5000 toman is not treated as below threshold", () => {
  const result = SessionBillingService.calculate(3 * 60, 60000);
  assert.equal(result.billedMinutes, 5);
  assert.equal(result.isBelowMinimumThreshold, false);
  assert.equal(result.amount.toToman(), 5000);
});

test("amount at or above 5000 toman is billed normally", () => {
  const result = SessionBillingService.calculate(16 * 60, 60000);
  assert.equal(result.billedMinutes, 15);
  assert.equal(result.isBelowMinimumThreshold, false);
  assert.equal(result.amount.toToman(), 15000);
});

test("transaction is recorded when below threshold but items are attached", () => {
  const result = SessionBillingService.calculate(60, 60000);
  assert.equal(
    SessionBillingService.shouldRecordAsTransaction(result, true),
    true
  );
  assert.equal(
    SessionBillingService.shouldRecordAsTransaction(result, false),
    false
  );
});

test("transaction is always recorded when above threshold", () => {
  const result = SessionBillingService.calculate(30 * 60, 60000);
  assert.equal(
    SessionBillingService.shouldRecordAsTransaction(result, false),
    true
  );
});
