import { randomUUID } from "node:crypto";
import type { BackupHistoryRepository } from "../../domain/ports/BackupHistoryRepository";

export interface RecordBackupInput {
  type: "automatic" | "manual";
  filePath: string;
  status: "success" | "failed";
  now?: Date;
}

export class RecordBackupUseCase {
  constructor(private readonly backupHistoryRepository: BackupHistoryRepository) {}

  execute(input: RecordBackupInput): string {
    const id = randomUUID();

    this.backupHistoryRepository.record({
      id,
      type: input.type,
      filePath: input.filePath,
      status: input.status,
      createdAt: (input.now ?? new Date()).toISOString(),
    });

    return id;
  }
}
