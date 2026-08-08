import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlBackupHistoryRepository } from "../repositories/SqlBackupHistoryRepository";
import { RecordBackupUseCase } from "../../../../core/src/application/use-cases/RecordBackupUseCase";
import { ListBackupHistoryUseCase } from "../../../../core/src/application/use-cases/ListBackupHistoryUseCase";

function buildMigratedConnection(): NodeSqliteTestConnection {
  const connection = new NodeSqliteTestConnection();
  const runner = new MigrationRunner(connection, join(__dirname, "..", "migrations"));
  runner.run();
  return connection;
}

test("recorded backup entries persist and are listed most recent first", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlBackupHistoryRepository(connection);
  const recordUseCase = new RecordBackupUseCase(repository);

  recordUseCase.execute({
    type: "manual",
    filePath: "/backups/first.db",
    status: "success",
    now: new Date("2026-08-01T00:00:00.000Z"),
  });
  recordUseCase.execute({
    type: "automatic",
    filePath: "/backups/second.db",
    status: "success",
    now: new Date("2026-08-02T00:00:00.000Z"),
  });

  const entries = new ListBackupHistoryUseCase(repository).execute();
  assert.equal(entries.length, 2);
  assert.equal(entries[0].filePath, "/backups/second.db");
  assert.equal(entries[1].filePath, "/backups/first.db");
});

test("listRecent respects the provided limit", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlBackupHistoryRepository(connection);
  const recordUseCase = new RecordBackupUseCase(repository);

  for (let i = 0; i < 5; i += 1) {
    recordUseCase.execute({
      type: "manual",
      filePath: `/backups/${i}.db`,
      status: "success",
      now: new Date(2026, 7, i + 1),
    });
  }

  const entries = repository.listRecent(2);
  assert.equal(entries.length, 2);
});

test("remove deletes a backup history entry permanently", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlBackupHistoryRepository(connection);
  const id = new RecordBackupUseCase(repository).execute({
    type: "automatic",
    filePath: "/backups/auto.db",
    status: "success",
  });

  repository.remove(id);

  const entries = repository.listRecent();
  assert.equal(entries.length, 0);
});
