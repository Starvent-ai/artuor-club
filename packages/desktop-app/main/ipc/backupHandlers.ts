import { app, dialog, type IpcMain } from "electron";
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlBackupHistoryRepository } from "../../../infrastructure/database/src/repositories/SqlBackupHistoryRepository";
import { RecordBackupUseCase } from "../../../core/src/application/use-cases/RecordBackupUseCase";
import { ListBackupHistoryUseCase } from "../../../core/src/application/use-cases/ListBackupHistoryUseCase";
import { BackupRetentionService } from "../../../core/src/domain/services/BackupRetentionService";

const AUTOMATIC_BACKUP_INTERVAL_MS = 10 * 60 * 1000;
const AUTOMATIC_BACKUP_KEEP_COUNT = 20;

export function registerBackupHandlers(
  ipcMain: IpcMain,
  connection: DatabaseConnection,
  databaseFilePath: string
): void {
  const backupHistoryRepository = new SqlBackupHistoryRepository(connection);
  const recordBackupUseCase = new RecordBackupUseCase(backupHistoryRepository);
  const listBackupHistoryUseCase = new ListBackupHistoryUseCase(backupHistoryRepository);
  const backupRetentionService = new BackupRetentionService();

  const automaticBackupsDirectory = join(app.getPath("userData"), "backups");

  function ensureAutomaticBackupsDirectory(): void {
    if (!existsSync(automaticBackupsDirectory)) {
      mkdirSync(automaticBackupsDirectory, { recursive: true });
    }
  }

  function copyDatabaseTo(destinationPath: string): void {
    connection.execute("PRAGMA wal_checkpoint(FULL)");
    copyFileSync(databaseFilePath, destinationPath);
  }

  function pruneAutomaticBackups(): void {
    const automaticEntries = listBackupHistoryUseCase
      .execute(200)
      .filter((entry) => entry.type === "automatic");

    const entriesToPrune = backupRetentionService.selectEntriesToPrune(
      automaticEntries,
      AUTOMATIC_BACKUP_KEEP_COUNT
    );

    for (const entry of entriesToPrune) {
      try {
        unlinkSync(entry.filePath);
      } catch {
        // فایل ممکن است از قبل حذف شده باشد، نادیده گرفته می‌شود
      }
      backupHistoryRepository.remove(entry.id);
    }
  }

  function performAutomaticBackup(): void {
    ensureAutomaticBackupsDirectory();
    const filePath = join(automaticBackupsDirectory, `auto-${Date.now()}.db`);

    try {
      copyDatabaseTo(filePath);
      recordBackupUseCase.execute({ type: "automatic", filePath, status: "success" });
      pruneAutomaticBackups();
    } catch {
      recordBackupUseCase.execute({ type: "automatic", filePath, status: "failed" });
    }
  }

  setInterval(performAutomaticBackup, AUTOMATIC_BACKUP_INTERVAL_MS).unref();

  app.on("before-quit", () => {
    performAutomaticBackup();
  });

  ipcMain.handle("backup:listHistory", () => {
    return listBackupHistoryUseCase.execute();
  });

  ipcMain.handle("backup:createManual", async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: `arthur-club-backup-${Date.now()}.db`,
      filters: [{ name: "Arthur Club Backup", extensions: ["db"] }],
    });

    if (result.canceled || !result.filePath) {
      return { status: "cancelled" as const };
    }

    try {
      copyDatabaseTo(result.filePath);
      recordBackupUseCase.execute({
        type: "manual",
        filePath: result.filePath,
        status: "success",
      });
      return { status: "success" as const, filePath: result.filePath };
    } catch {
      recordBackupUseCase.execute({
        type: "manual",
        filePath: result.filePath,
        status: "failed",
      });
      return { status: "failed" as const };
    }
  });

  ipcMain.handle("backup:restore", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Arthur Club Backup", extensions: ["db"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { status: "cancelled" as const };
    }

    copyFileSync(result.filePaths[0], databaseFilePath);
    app.relaunch();
    app.exit();
    return { status: "success" as const };
  });
}
