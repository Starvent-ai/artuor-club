import { test } from "node:test";
import assert from "node:assert/strict";
import { BackupRetentionService } from "../BackupRetentionService";
import type { BackupHistoryRecord } from "../../ports/BackupHistoryRepository";

function makeEntry(id: string, createdAt: string): BackupHistoryRecord {
  return {
    id,
    type: "automatic",
    filePath: `/backups/${id}.db`,
    createdAt,
    status: "success",
  };
}

test("prunes nothing when the count is within the retention limit", () => {
  const entries = [makeEntry("1", "2026-08-01T00:00:00.000Z"), makeEntry("2", "2026-08-02T00:00:00.000Z")];
  const toPrune = new BackupRetentionService().selectEntriesToPrune(entries, 5);
  assert.equal(toPrune.length, 0);
});

test("keeps the most recent entries and prunes the older overflow", () => {
  const entries = [
    makeEntry("oldest", "2026-08-01T00:00:00.000Z"),
    makeEntry("middle", "2026-08-02T00:00:00.000Z"),
    makeEntry("newest", "2026-08-03T00:00:00.000Z"),
  ];

  const toPrune = new BackupRetentionService().selectEntriesToPrune(entries, 2);
  assert.equal(toPrune.length, 1);
  assert.equal(toPrune[0].id, "oldest");
});

test("does not depend on the input already being sorted", () => {
  const entries = [
    makeEntry("newest", "2026-08-03T00:00:00.000Z"),
    makeEntry("oldest", "2026-08-01T00:00:00.000Z"),
    makeEntry("middle", "2026-08-02T00:00:00.000Z"),
  ];

  const toPrune = new BackupRetentionService().selectEntriesToPrune(entries, 1);
  assert.equal(toPrune.length, 2);
  assert.deepEqual(
    toPrune.map((entry) => entry.id).sort(),
    ["middle", "oldest"]
  );
});
