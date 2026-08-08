export interface BackupHistoryRecord {
  id: string;
  type: "automatic" | "manual";
  filePath: string;
  createdAt: string;
  status: "success" | "failed";
}

export interface BackupHistoryRepository {
  record(entry: BackupHistoryRecord): void;
  listRecent(limit?: number): BackupHistoryRecord[];
  remove(id: string): void;
}
