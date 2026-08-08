import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { GetDailyReportUseCase } from "../../../core/src/application/use-cases/GetDailyReportUseCase";

export function registerReportHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);
  const staffRepository = new SqlStaffRepository(connection);
  const getDailyReportUseCase = new GetDailyReportUseCase(
    accountingTransactionRepository,
    staffRepository
  );

  ipcMain.handle(
    "report:getDailyReport",
    (_event, input: { rangeStart: string; rangeEnd: string }) => {
      return getDailyReportUseCase.execute({
        rangeStart: new Date(input.rangeStart),
        rangeEnd: new Date(input.rangeEnd),
      });
    }
  );
}
