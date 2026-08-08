import type {
  BackupHistoryRecord,
  BackupHistoryRepository,
} from "../../domain/ports/BackupHistoryRepository";

export class ListBackupHistoryUseCase {
  constructor(private readonly backupHistoryRepository: BackupHistoryRepository) {}

  execute(limit?: number): BackupHistoryRecord[] {
    return this.backupHistoryRepository.listRecent(limit);
  }
}
