import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlStaffRepository } from "../repositories/SqlStaffRepository";
import { DetermineEntryScreenUseCase } from "../../../../core/src/application/use-cases/DetermineEntryScreenUseCase";

function buildMigratedConnection(): NodeSqliteTestConnection {
  const connection = new NodeSqliteTestConnection();
  const runner = new MigrationRunner(connection, join(__dirname, "..", "migrations"));
  runner.run();
  return connection;
}

test("entry screen use case goes to main application on a fresh database", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlStaffRepository(connection);
  const useCase = new DetermineEntryScreenUseCase(repository);

  assert.equal(useCase.execute(), "main_application");
});

test("entry screen use case switches to staff selection once staff are seeded", () => {
  const connection = buildMigratedConnection();
  const now = new Date().toISOString();

  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [randomUUID(), "سارا کریمی", now, now]
  );

  const repository = new SqlStaffRepository(connection);
  const useCase = new DetermineEntryScreenUseCase(repository);

  assert.equal(useCase.execute(), "staff_selection");
  assert.equal(repository.findAllActive().length, 1);
  assert.equal(repository.findAllActive()[0].fullName, "سارا کریمی");
});

test("inactive staff are excluded from active queries", () => {
  const connection = buildMigratedConnection();
  const now = new Date().toISOString();

  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 0, ?, ?, 'local')",
    [randomUUID(), "کارمند غیرفعال", now, now]
  );

  const repository = new SqlStaffRepository(connection);
  assert.equal(repository.countActive(), 0);
  assert.equal(repository.findAllActive().length, 0);
});
