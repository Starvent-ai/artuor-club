import { test } from "node:test";
import assert from "node:assert/strict";
import { SearchAccountingTransactionsUseCase } from "../SearchAccountingTransactionsUseCase";
import type {
  AccountingTransactionFilter,
  AccountingTransactionRecord,
  AccountingTransactionRepository,
} from "../../../domain/ports/AccountingTransactionRepository";
import type { StaffRecord, StaffRepository } from "../../../domain/ports/StaffRepository";

class InMemoryAccountingTransactionRepository implements AccountingTransactionRepository {
  private transactions: AccountingTransactionRecord[] = [];

  record(transaction: AccountingTransactionRecord): void {
    this.transactions.push(transaction);
  }

  findBetween(startIso: string, endIso: string): AccountingTransactionRecord[] {
    return this.transactions.filter(
      (transaction) => transaction.occurredAt >= startIso && transaction.occurredAt < endIso
    );
  }

  search(filter: AccountingTransactionFilter): AccountingTransactionRecord[] {
    return this.transactions.filter((transaction) => {
      if (filter.startIso && transaction.occurredAt < filter.startIso) return false;
      if (filter.endIso && transaction.occurredAt >= filter.endIso) return false;
      if (filter.staffId && transaction.staffId !== filter.staffId) return false;
      if (filter.type && transaction.type !== filter.type) return false;
      if (filter.paymentMethod && transaction.paymentMethod !== filter.paymentMethod) return false;
      return true;
    });
  }
}

class InMemoryStaffRepository implements StaffRepository {
  constructor(private readonly staff: StaffRecord[]) {}

  countActive(): number {
    return this.staff.filter((member) => member.isActive).length;
  }

  findAllActive(): StaffRecord[] {
    return this.staff.filter((member) => member.isActive);
  }

  findById(id: string): StaffRecord | undefined {
    return this.staff.find((member) => member.id === id);
  }
}

function seedTransactions(repository: InMemoryAccountingTransactionRepository) {
  repository.record({
    id: "1",
    type: "table_income",
    sourceId: null,
    amount: 10000,
    paymentMethod: "cash",
    description: null,
    staffId: "staff-1",
    occurredAt: "2026-08-01T10:00:00.000Z",
  });
  repository.record({
    id: "2",
    type: "ps_income",
    sourceId: null,
    amount: 20000,
    paymentMethod: "pos",
    description: null,
    staffId: "staff-2",
    occurredAt: "2026-08-02T10:00:00.000Z",
  });
  repository.record({
    id: "3",
    type: "expense",
    sourceId: null,
    amount: 5000,
    paymentMethod: "cash",
    description: "خرید",
    staffId: "staff-1",
    occurredAt: "2026-08-03T10:00:00.000Z",
  });
}

test("returns every transaction when no filters are provided", () => {
  const repository = new InMemoryAccountingTransactionRepository();
  seedTransactions(repository);
  const staffRepository = new InMemoryStaffRepository([
    { id: "staff-1", fullName: "علی", isActive: true },
    { id: "staff-2", fullName: "سارا", isActive: true },
  ]);

  const result = new SearchAccountingTransactionsUseCase(repository, staffRepository).execute({});
  assert.equal(result.transactions.length, 3);
});

test("filters by staff id", () => {
  const repository = new InMemoryAccountingTransactionRepository();
  seedTransactions(repository);
  const staffRepository = new InMemoryStaffRepository([
    { id: "staff-1", fullName: "علی", isActive: true },
    { id: "staff-2", fullName: "سارا", isActive: true },
  ]);

  const result = new SearchAccountingTransactionsUseCase(repository, staffRepository).execute({
    staffId: "staff-2",
  });

  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0].staffFullName, "سارا");
});

test("filters by transaction type", () => {
  const repository = new InMemoryAccountingTransactionRepository();
  seedTransactions(repository);
  const staffRepository = new InMemoryStaffRepository([]);

  const result = new SearchAccountingTransactionsUseCase(repository, staffRepository).execute({
    type: "expense",
  });

  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0].id, "3");
  assert.equal(result.summary.totalExpense, 5000);
});

test("filters by payment method and date range together", () => {
  const repository = new InMemoryAccountingTransactionRepository();
  seedTransactions(repository);
  const staffRepository = new InMemoryStaffRepository([]);

  const result = new SearchAccountingTransactionsUseCase(repository, staffRepository).execute({
    paymentMethod: "cash",
    rangeStart: new Date("2026-08-02T00:00:00.000Z"),
    rangeEnd: new Date("2026-08-04T00:00:00.000Z"),
  });

  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0].id, "3");
});
