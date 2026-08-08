import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  BackupHistoryRecord,
  BackupHistoryRepository,
} from "../../../../core/src/domain/ports/BackupHistoryRepository";

interface BackupHistoryRow {
  id: string;
  type: "automatic" | "manual";
  file_path: string;
  created_at: string;
  status: "success" | "failed";
}

function toRecord(row: BackupHistoryRow): BackupHistoryRecord {
  return {
    id: row.id,
    type: row.type,
    filePath: row.file_path,
    createdAt: row.created_at,
    status: row.status,
  };
}

export class SqlBackupHistoryRepository implements BackupHistoryRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  record(entry: BackupHistoryRecord): void {
    this.connection.execute(
      `INSERT INTO backup_history (id, type, file_path, created_at, status)
       VALUES (?, ?, ?, ?, ?)`,
      [entry.id, entry.type, entry.filePath, entry.createdAt, entry.status]
    );
  }

  listRecent(limit = 20): BackupHistoryRecord[] {
    const rows = this.connection.queryAll<BackupHistoryRow>(
      "SELECT * FROM backup_history ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return rows.map(toRecord);
  }

  remove(id: string): void {
    this.connection.execute("DELETE FROM backup_history WHERE id = ?", [id]);
  }
}
