import type { BackupHistoryRecord } from "../ports/BackupHistoryRepository";

export class BackupRetentionService {
  selectEntriesToPrune(
    automaticEntries: BackupHistoryRecord[],
    keepCount: number
  ): BackupHistoryRecord[] {
    const sortedMostRecentFirst = [...automaticEntries].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    );

    if (sortedMostRecentFirst.length <= keepCount) {
      return [];
    }

    return sortedMostRecentFirst.slice(keepCount);
  }
}
