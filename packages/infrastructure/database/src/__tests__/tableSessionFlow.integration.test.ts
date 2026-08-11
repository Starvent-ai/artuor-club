import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlTableRepository } from "../repositories/SqlTableRepository";
import { SqlTableSessionRepository } from "../repositories/SqlTableSessionRepository";
import { SqlAccountingTransactionRepository } from "../repositories/SqlAccountingTransactionRepository";
import { SqlCustomerRepository } from "../repositories/SqlCustomerRepository";
import { SqlOpenTabRepository } from "../repositories/SqlOpenTabRepository";
import { SqlOpenTabItemRepository } from "../repositories/SqlOpenTabItemRepository";
import {
  StartTableSessionUseCase,
  TableNotFreeError,
} from "../../../../core/src/application/use-cases/StartTableSessionUseCase";
import { EndTableSessionUseCase } from "../../../../core/src/application/use-cases/EndTableSessionUseCase";
import { CreateOpenTabUseCase } from "../../../../core/src/application/use-cases/CreateOpenTabUseCase";

function setupScenario() {
  const connection = new NodeSqliteTestConnection();
  new MigrationRunner(connection, join(__dirname, "..", "migrations")).run();

  const now = new Date().toISOString();
  const staffId = randomUUID();
  const tableTypeId = randomUUID();
  const tableId = randomUUID();

  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [staffId, "پرسنل تست", now, now]
  );
  connection.execute(
    "INSERT INTO table_type (id, name, hourly_rate, is_active) VALUES (?, 'بیلیارد', 60000, 1)",
    [tableTypeId]
  );
  connection.execute(
    "INSERT INTO billiard_table (id, name, table_type_id, status, is_active, created_at, updated_at) VALUES (?, 'میز ۱', ?, 'free', 1, ?, ?)",
    [tableId, tableTypeId, now, now]
  );

  const tableRepository = new SqlTableRepository(connection);
  const sessionRepository = new SqlTableSessionRepository(connection);
  const transactionRepository = new SqlAccountingTransactionRepository(connection);
  const customerRepository = new SqlCustomerRepository(connection);
  const openTabRepository = new SqlOpenTabRepository(connection);
  const openTabItemRepository = new SqlOpenTabItemRepository(connection);

  return {
    connection,
    staffId,
    tableId,
    tableRepository,
    sessionRepository,
    transactionRepository,
    openTabRepository,
    openTabItemRepository,
    createOpenTabUseCase: new CreateOpenTabUseCase(customerRepository, openTabRepository),
    startUseCase: new StartTableSessionUseCase(tableRepository, sessionRepository),
    endUseCase: new EndTableSessionUseCase(tableRepository, sessionRepository, transactionRepository),
    endUseCaseWithOpenTabSupport: new EndTableSessionUseCase(
      tableRepository,
      sessionRepository,
      transactionRepository,
      openTabRepository,
      openTabItemRepository
    ),
  };
}

test("starting a session marks the table as in_use", () => {
  const scenario = setupScenario();
  scenario.startUseCase.execute({ tableId: scenario.tableId, staffId: scenario.staffId });

  const table = scenario.tableRepository.findById(scenario.tableId);
  assert.equal(table?.status, "in_use");
});

test("cannot start a session on a table that is already in use", () => {
  const scenario = setupScenario();
  scenario.startUseCase.execute({ tableId: scenario.tableId, staffId: scenario.staffId });

  assert.throws(() => {
    scenario.startUseCase.execute({ tableId: scenario.tableId, staffId: scenario.staffId });
  }, TableNotFreeError);
});

test("ending a session above the minimum threshold records income and frees the table", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    tableId: scenario.tableId,
    staffId: scenario.staffId,
    now: startTime,
  });

  const endTime = new Date(startTime.getTime() + 16 * 60 * 1000);
  const result = scenario.endUseCase.execute({
    sessionId,
    staffId: scenario.staffId,
    paymentMethod: "cash",
    hasAttachedItems: false,
    now: endTime,
  });

  assert.equal(result.billedMinutes, 15);
  assert.equal(result.amount, 15000);
  assert.equal(result.transactionRecorded, true);

  const table = scenario.tableRepository.findById(scenario.tableId);
  assert.equal(table?.status, "free");

  const transactions = scenario.connection.queryAll<{ amount: number }>(
    "SELECT amount FROM accounting_transaction WHERE source_id = ?",
    [sessionId]
  );
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 15000);
});

test("ending a very short session below 5000 toman with no attached items records nothing", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    tableId: scenario.tableId,
    staffId: scenario.staffId,
    now: startTime,
  });

  const endTime = new Date(startTime.getTime() + 1 * 60 * 1000);
  const result = scenario.endUseCase.execute({
    sessionId,
    staffId: scenario.staffId,
    paymentMethod: "cash",
    hasAttachedItems: false,
    now: endTime,
  });

  assert.equal(result.amount, 0);
  assert.equal(result.transactionRecorded, false);

  const transactions = scenario.connection.queryAll<{ amount: number }>(
    "SELECT amount FROM accounting_transaction WHERE source_id = ?",
    [sessionId]
  );
  assert.equal(transactions.length, 0);
});

test("ending a very short session below 5000 toman with attached buffet items still records the transaction", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    tableId: scenario.tableId,
    staffId: scenario.staffId,
    now: startTime,
  });

  const endTime = new Date(startTime.getTime() + 1 * 60 * 1000);
  const result = scenario.endUseCase.execute({
    sessionId,
    staffId: scenario.staffId,
    paymentMethod: "cash",
    hasAttachedItems: true,
    now: endTime,
  });

  assert.equal(result.amount, 0);
  assert.equal(result.transactionRecorded, true);
});

test("after ending a session the same table can be started again", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    tableId: scenario.tableId,
    staffId: scenario.staffId,
    now: startTime,
  });

  scenario.endUseCase.execute({
    sessionId,
    staffId: scenario.staffId,
    paymentMethod: "cash",
    hasAttachedItems: false,
    now: new Date(startTime.getTime() + 20 * 60 * 1000),
  });

  const secondSessionId = scenario.startUseCase.execute({
    tableId: scenario.tableId,
    staffId: scenario.staffId,
  });

  assert.notEqual(secondSessionId, sessionId);
  assert.equal(scenario.tableRepository.findById(scenario.tableId)?.status, "in_use");
});

test("ending a session started against an open tab attaches it as an item instead of recording immediate income", () => {
  const scenario = setupScenario();

  const createResult = scenario.createOpenTabUseCase.execute({
    customerName: "بابک رستمی",
    staffId: scenario.staffId,
  });
  if (createResult.status !== "created") return;

  const startTime = new Date();
  const sessionId = scenario.startUseCase.execute({
    tableId: scenario.tableId,
    staffId: scenario.staffId,
    openTabId: createResult.openTabId,
    now: startTime,
  });

  const result = scenario.endUseCaseWithOpenTabSupport.execute({
    sessionId,
    staffId: scenario.staffId,
    hasAttachedItems: false,
    now: new Date(startTime.getTime() + 20 * 60 * 1000),
  });

  assert.equal(result.transactionRecorded, false);
  assert.equal(scenario.transactionRepository.search({}).length, 0);

  const items = scenario.openTabItemRepository.findByOpenTabId(createResult.openTabId);
  assert.equal(items.length, 1);
  assert.equal(items[0].sourceType, "table_session");
  assert.equal(items[0].amount, result.amount);

  const updatedTab = scenario.openTabRepository.findById(createResult.openTabId);
  assert.equal(updatedTab?.totalAmount, result.amount);
});
