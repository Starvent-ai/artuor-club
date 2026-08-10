import { test } from "node:test";
import assert from "node:assert/strict";
import { GetDailyReportUseCase } from "../GetDailyReportUseCase";
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

  create(record: StaffRecord): void {
    this.staff.push(record);
  }

  deactivate(id: string): void {
    const member = this.staff.find((item) => item.id === id);
    if (member) {
      member.isActive = false;
    }
  }
}

test("only includes transactions within the requested date range", () => {
  const transactionRepository = new InMemoryAccountingTransactionRepository();
  transactionRepository.record({
    id: "1",
    type: "table_income",
    sourceId: null,
    amount: 10000,
    paymentMethod: "cash",
    description: null,
    staffId: "staff-1",
    occurredAt: "2026-08-01T10:00:00.000Z",
  });
  transactionRepository.record({
    id: "2",
    type: "table_income",
    sourceId: null,
    amount: 20000,
    paymentMethod: "cash",
    description: null,
    staffId: "staff-1",
    occurredAt: "2026-08-02T10:00:00.000Z",
  });

  const staffRepository = new InMemoryStaffRepository([
    { id: "staff-1", fullName: "علی رضایی", isActive: true },
  ]);

  const report = new GetDailyReportUseCase(transactionRepository, staffRepository).execute({
    rangeStart: new Date("2026-08-01T00:00:00.000Z"),
    rangeEnd: new Date("2026-08-02T00:00:00.000Z"),
  });

  assert.equal(report.transactions.length, 1);
  assert.equal(report.transactions[0].id, "1");
  assert.equal(report.summary.totalIncome, 10000);
});

test("resolves the staff full name for each transaction line", () => {
  const transactionRepository = new InMemoryAccountingTransactionRepository();
  transactionRepository.record({
    id: "1",
    type: "buffet_income",
    sourceId: null,
    amount: 5000,
    paymentMethod: "pos",
    description: null,
    staffId: "staff-1",
    occurredAt: "2026-08-01T10:00:00.000Z",
  });

  const staffRepository = new InMemoryStaffRepository([
    { id: "staff-1", fullName: "سارا کریمی", isActive: true },
  ]);

  const report = new GetDailyReportUseCase(transactionRepository, staffRepository).execute({
    rangeStart: new Date("2026-08-01T00:00:00.000Z"),
    rangeEnd: new Date("2026-08-02T00:00:00.000Z"),
  });

  assert.equal(report.transactions[0].staffFullName, "سارا کریمی");
});

test("falls back to a placeholder name when the staff member no longer exists", () => {
  const transactionRepository = new InMemoryAccountingTransactionRepository();
  transactionRepository.record({
    id: "1",
    type: "expense",
    sourceId: null,
    amount: 5000,
    paymentMethod: "cash",
    description: "خرید لوازم",
    staffId: "unknown-staff",
    occurredAt: "2026-08-01T10:00:00.000Z",
  });

  const staffRepository = new InMemoryStaffRepository([]);

  const report = new GetDailyReportUseCase(transactionRepository, staffRepository).execute({
    rangeStart: new Date("2026-08-01T00:00:00.000Z"),
    rangeEnd: new Date("2026-08-02T00:00:00.000Z"),
  });

  assert.equal(report.transactions[0].staffFullName, "-");
});
