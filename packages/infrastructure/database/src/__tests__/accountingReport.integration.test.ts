import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlAccountingTransactionRepository } from "../repositories/SqlAccountingTransactionRepository";
import { SqlStaffRepository } from "../repositories/SqlStaffRepository";
import { GetDailyReportUseCase } from "../../../../core/src/application/use-cases/GetDailyReportUseCase";
import { SearchAccountingTransactionsUseCase } from "../../../../core/src/application/use-cases/SearchAccountingTransactionsUseCase";

function buildMigratedConnection(): NodeSqliteTestConnection {
  const connection = new NodeSqliteTestConnection();
  const runner = new MigrationRunner(connection, join(__dirname, "..", "migrations"));
  runner.run();
  return connection;
}

function seedStaff(connection: NodeSqliteTestConnection, fullName: string): string {
  const staffId = randomUUID();
  const now = new Date().toISOString();
  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [staffId, fullName, now, now]
  );
  return staffId;
}

test("findBetween only returns transactions inside the given range", () => {
  const connection = buildMigratedConnection();
  const staffId = seedStaff(connection, "کارمند تست");
  const repository = new SqlAccountingTransactionRepository(connection);

  repository.record({
    id: randomUUID(),
    type: "table_income",
    sourceId: null,
    amount: 12000,
    paymentMethod: "cash",
    description: null,
    staffId,
    occurredAt: "2026-08-01T08:00:00.000Z",
  });
  repository.record({
    id: randomUUID(),
    type: "table_income",
    sourceId: null,
    amount: 15000,
    paymentMethod: "cash",
    description: null,
    staffId,
    occurredAt: "2026-08-03T08:00:00.000Z",
  });

  const results = repository.findBetween("2026-08-01T00:00:00.000Z", "2026-08-02T00:00:00.000Z");
  assert.equal(results.length, 1);
  assert.equal(results[0].amount, 12000);
});

test("daily report use case aggregates real recorded transactions with staff names", () => {
  const connection = buildMigratedConnection();
  const staffId = seedStaff(connection, "محمد قاسمی");
  const transactionRepository = new SqlAccountingTransactionRepository(connection);
  const staffRepository = new SqlStaffRepository(connection);

  transactionRepository.record({
    id: randomUUID(),
    type: "table_income",
    sourceId: null,
    amount: 40000,
    paymentMethod: "cash",
    description: null,
    staffId,
    occurredAt: "2026-08-05T09:00:00.000Z",
  });
  transactionRepository.record({
    id: randomUUID(),
    type: "expense",
    sourceId: null,
    amount: 10000,
    paymentMethod: "cash",
    description: "خرید نوشیدنی",
    staffId,
    occurredAt: "2026-08-05T12:00:00.000Z",
  });

  const useCase = new GetDailyReportUseCase(transactionRepository, staffRepository);
  const report = useCase.execute({
    rangeStart: new Date("2026-08-05T00:00:00.000Z"),
    rangeEnd: new Date("2026-08-06T00:00:00.000Z"),
  });

  assert.equal(report.summary.totalIncome, 40000);
  assert.equal(report.summary.totalExpense, 10000);
  assert.equal(report.summary.netAmount, 30000);
  assert.equal(report.transactions.length, 2);
  assert.equal(report.transactions[0].staffFullName, "محمد قاسمی");
});

test("search filters real recorded transactions by staff, type, and payment method", () => {
  const connection = buildMigratedConnection();
  const staffOne = seedStaff(connection, "پرسنل یک");
  const staffTwo = seedStaff(connection, "پرسنل دو");
  const transactionRepository = new SqlAccountingTransactionRepository(connection);
  const staffRepository = new SqlStaffRepository(connection);

  transactionRepository.record({
    id: randomUUID(),
    type: "table_income",
    sourceId: null,
    amount: 30000,
    paymentMethod: "cash",
    description: null,
    staffId: staffOne,
    occurredAt: "2026-08-10T09:00:00.000Z",
  });
  transactionRepository.record({
    id: randomUUID(),
    type: "ps_income",
    sourceId: null,
    amount: 50000,
    paymentMethod: "pos",
    description: null,
    staffId: staffTwo,
    occurredAt: "2026-08-10T10:00:00.000Z",
  });
  transactionRepository.record({
    id: randomUUID(),
    type: "expense",
    sourceId: null,
    amount: 8000,
    paymentMethod: "cash",
    description: "خرید",
    staffId: staffOne,
    occurredAt: "2026-08-11T09:00:00.000Z",
  });

  const useCase = new SearchAccountingTransactionsUseCase(transactionRepository, staffRepository);

  const byStaff = useCase.execute({ staffId: staffOne });
  assert.equal(byStaff.transactions.length, 2);

  const byType = useCase.execute({ type: "ps_income" });
  assert.equal(byType.transactions.length, 1);
  assert.equal(byType.transactions[0].staffFullName, "پرسنل دو");

  const byPaymentMethod = useCase.execute({ paymentMethod: "cash" });
  assert.equal(byPaymentMethod.transactions.length, 2);

  const combined = useCase.execute({
    staffId: staffOne,
    rangeStart: new Date("2026-08-11T00:00:00.000Z"),
    rangeEnd: new Date("2026-08-12T00:00:00.000Z"),
  });
  assert.equal(combined.transactions.length, 1);
  assert.equal(combined.transactions[0].type, "expense");
});
