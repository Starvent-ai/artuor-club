import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlOpenTabRepository } from "../repositories/SqlOpenTabRepository";

function buildMigratedConnection(): NodeSqliteTestConnection {
  const connection = new NodeSqliteTestConnection();
  const runner = new MigrationRunner(connection, join(__dirname, "..", "migrations"));
  runner.run();
  return connection;
}

function seedStaffAndCustomer(connection: NodeSqliteTestConnection) {
  const staffId = randomUUID();
  const customerId = randomUUID();
  const now = new Date().toISOString();

  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [staffId, "علی محمدی", now, now]
  );
  connection.execute(
    "INSERT INTO customer (id, full_name, phone_number, created_at) VALUES (?, ?, NULL, ?)",
    [customerId, "رضا احمدی", now]
  );

  return { staffId, customerId };
}

test("migrations create all core tables without error", () => {
  const connection = buildMigratedConnection();
  const tables = connection.queryAll<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  const tableNames = tables.map((t) => t.name);

  for (const expected of [
    "staff",
    "billiard_table",
    "table_session",
    "device",
    "ps_session",
    "ps_session_segment",
    "customer",
    "open_tab",
    "open_tab_item",
    "payment",
    "ledger_account",
    "product",
    "buffet_order",
    "accounting_transaction",
    "audit_log",
  ]) {
    assert.ok(tableNames.includes(expected), `missing table: ${expected}`);
  }
});

test("open tab repository enforces one active tab per customer at application layer", () => {
  const connection = buildMigratedConnection();
  const { staffId, customerId } = seedStaffAndCustomer(connection);
  const repository = new SqlOpenTabRepository(connection);
  const now = new Date().toISOString();

  repository.create({
    id: randomUUID(),
    customerId,
    status: "active",
    openedAt: now,
    closedAt: null,
    totalAmount: 0,
    paidAmount: 0,
    staffId,
  });

  assert.throws(() => {
    repository.create({
      id: randomUUID(),
      customerId,
      status: "active",
      openedAt: now,
      closedAt: null,
      totalAmount: 0,
      paidAmount: 0,
      staffId,
    });
  }, /DUPLICATE_ACTIVE_OPEN_TAB/);
});

test("database unique index also rejects duplicate active tab as a second safety net", () => {
  const connection = buildMigratedConnection();
  const { staffId, customerId } = seedStaffAndCustomer(connection);
  const now = new Date().toISOString();

  connection.execute(
    `INSERT INTO open_tab (id, customer_id, status, opened_at, closed_at, total_amount, paid_amount, staff_id)
     VALUES (?, ?, 'active', ?, NULL, 0, 0, ?)`,
    [randomUUID(), customerId, now, staffId]
  );

  assert.throws(() => {
    connection.execute(
      `INSERT INTO open_tab (id, customer_id, status, opened_at, closed_at, total_amount, paid_amount, staff_id)
       VALUES (?, ?, 'active', ?, NULL, 0, 0, ?)`,
      [randomUUID(), customerId, now, staffId]
    );
  });
});

test("closing a tab and reopening a new active tab for same customer is allowed", () => {
  const connection = buildMigratedConnection();
  const { staffId, customerId } = seedStaffAndCustomer(connection);
  const repository = new SqlOpenTabRepository(connection);
  const now = new Date().toISOString();
  const firstTabId = randomUUID();

  repository.create({
    id: firstTabId,
    customerId,
    status: "active",
    openedAt: now,
    closedAt: null,
    totalAmount: 10000,
    paidAmount: 10000,
    staffId,
  });

  repository.updateStatus(firstTabId, "settled", now);

  repository.create({
    id: randomUUID(),
    customerId,
    status: "active",
    openedAt: now,
    closedAt: null,
    totalAmount: 0,
    paidAmount: 0,
    staffId,
  });

  const active = repository.findActiveByCustomerId(customerId);
  assert.ok(active);
  assert.notEqual(active?.id, firstTabId);
});

test("table session unique active index prevents two active sessions on same table", () => {
  const connection = buildMigratedConnection();
  const { staffId } = seedStaffAndCustomer(connection);
  const now = new Date().toISOString();
  const tableTypeId = randomUUID();
  const tableId = randomUUID();

  connection.execute(
    "INSERT INTO table_type (id, name, hourly_rate, is_active) VALUES (?, 'بیلیارد', 60000, 1)",
    [tableTypeId]
  );
  connection.execute(
    "INSERT INTO billiard_table (id, name, table_type_id, status, is_active, created_at, updated_at) VALUES (?, 'میز ۱', ?, 'in_use', 1, ?, ?)",
    [tableId, tableTypeId, now, now]
  );
  connection.execute(
    "INSERT INTO table_session (id, table_id, staff_id, start_time, status) VALUES (?, ?, ?, ?, 'active')",
    [randomUUID(), tableId, staffId, now]
  );

  assert.throws(() => {
    connection.execute(
      "INSERT INTO table_session (id, table_id, staff_id, start_time, status) VALUES (?, ?, ?, ?, 'active')",
      [randomUUID(), tableId, staffId, now]
    );
  });
});
