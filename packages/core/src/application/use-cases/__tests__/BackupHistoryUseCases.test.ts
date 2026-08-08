import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  BackupHistoryRecord,
  BackupHistoryRepository,
} from "../../../domain/ports/BackupHistoryRepository";
import { RecordBackupUseCase } from "../RecordBackupUseCase";
import { ListBackupHistoryUseCase } from "../ListBackupHistoryUseCase";

class InMemoryBackupHistoryRepository implements BackupHistoryRepository {
  private entries: BackupHistoryRecord[] = [];

  record(entry: BackupHistoryRecord): void {
    this.entries.push(entry);
  }

  listRecent(limit = 20): BackupHistoryRecord[] {
    return [...this.entries]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }
}

test("records a manual backup entry and returns its generated id", () => {
  const repository = new InMemoryBackupHistoryRepository();
  const useCase = new RecordBackupUseCase(repository);

  const id = useCase.execute({
    type: "manual",
    filePath: "/backups/arthur-club-2026.db",
    status: "success",
  });

  const entries = new ListBackupHistoryUseCase(repository).execute();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, id);
  assert.equal(entries[0].status, "success");
});

test("records failed backups distinctly from successful ones", () => {
  const repository = new InMemoryBackupHistoryRepository();
  const useCase = new RecordBackupUseCase(repository);

  useCase.execute({ type: "manual", filePath: "/backups/a.db", status: "success" });
  useCase.execute({ type: "manual", filePath: "/backups/b.db", status: "failed" });

  const entries = new ListBackupHistoryUseCase(repository).execute();
  assert.equal(entries.filter((entry) => entry.status === "failed").length, 1);
  assert.equal(entries.filter((entry) => entry.status === "success").length, 1);
});

test("lists the most recent backups first and respects the limit", () => {
  const repository = new InMemoryBackupHistoryRepository();
  const useCase = new RecordBackupUseCase(repository);

  useCase.execute({
    type: "manual",
    filePath: "/backups/old.db",
    status: "success",
    now: new Date("2026-08-01T00:00:00.000Z"),
  });
  useCase.execute({
    type: "automatic",
    filePath: "/backups/new.db",
    status: "success",
    now: new Date("2026-08-05T00:00:00.000Z"),
  });

  const entries = new ListBackupHistoryUseCase(repository).execute(1);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].filePath, "/backups/new.db");
});
