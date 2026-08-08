import { test } from "node:test";
import assert from "node:assert/strict";
import { AccountingSummaryService } from "../AccountingSummaryService";
import type { AccountingTransactionRecord } from "../../ports/AccountingTransactionRepository";

function makeTransaction(
  overrides: Partial<AccountingTransactionRecord>
): AccountingTransactionRecord {
  return {
    id: "1",
    type: "table_income",
    sourceId: null,
    amount: 1000,
    paymentMethod: "cash",
    description: null,
    staffId: "staff-1",
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

test("returns all zeros for an empty transaction list", () => {
  const summary = new AccountingSummaryService().summarize([]);
  assert.equal(summary.totalIncome, 0);
  assert.equal(summary.totalExpense, 0);
  assert.equal(summary.netAmount, 0);
  assert.equal(summary.transactionCount, 0);
});

test("aggregates income by type and subtracts expenses from the net amount", () => {
  const summary = new AccountingSummaryService().summarize([
    makeTransaction({ type: "table_income", amount: 50000 }),
    makeTransaction({ type: "ps_income", amount: 30000 }),
    makeTransaction({ type: "buffet_income", amount: 20000 }),
    makeTransaction({ type: "expense", amount: 15000 }),
  ]);

  assert.equal(summary.tableIncome, 50000);
  assert.equal(summary.psIncome, 30000);
  assert.equal(summary.buffetIncome, 20000);
  assert.equal(summary.totalIncome, 100000);
  assert.equal(summary.totalExpense, 15000);
  assert.equal(summary.netAmount, 85000);
  assert.equal(summary.transactionCount, 4);
});

test("aggregates totals by payment method across income and expense", () => {
  const summary = new AccountingSummaryService().summarize([
    makeTransaction({ paymentMethod: "cash", amount: 10000 }),
    makeTransaction({ paymentMethod: "pos", amount: 20000 }),
    makeTransaction({ paymentMethod: "card_to_card", amount: 30000 }),
    makeTransaction({ paymentMethod: "ledger", amount: 40000 }),
  ]);

  assert.equal(summary.cashTotal, 10000);
  assert.equal(summary.posTotal, 20000);
  assert.equal(summary.cardToCardTotal, 30000);
  assert.equal(summary.ledgerTotal, 40000);
});
