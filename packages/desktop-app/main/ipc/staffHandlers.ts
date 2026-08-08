import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { DetermineEntryScreenUseCase } from "../../../core/src/application/use-cases/DetermineEntryScreenUseCase";
import { setCurrentStaffId } from "../currentSession";

export function registerStaffHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const entryScreenUseCase = new DetermineEntryScreenUseCase(staffRepository);

  ipcMain.handle("staff:getEntryScreenData", () => {
    return {
      entryScreen: entryScreenUseCase.execute(),
      staffOptions: staffRepository.findAllActive(),
    };
  });

  ipcMain.handle("staff:setCurrentStaff", (_event, staffId: string) => {
    setCurrentStaffId(staffId);
  });
}

