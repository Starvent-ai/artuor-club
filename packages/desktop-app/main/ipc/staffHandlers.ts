import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { DetermineEntryScreenUseCase } from "../../../core/src/application/use-cases/DetermineEntryScreenUseCase";
import { CreateStaffUseCase } from "../../../core/src/application/use-cases/CreateStaffUseCase";
import { setCurrentStaffId } from "../currentSession";

export function registerStaffHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const entryScreenUseCase = new DetermineEntryScreenUseCase(staffRepository);
  const createStaffUseCase = new CreateStaffUseCase(staffRepository);

  ipcMain.handle("staff:getEntryScreenData", () => {
    return {
      entryScreen: entryScreenUseCase.execute(),
      staffOptions: staffRepository.findAllActive(),
    };
  });

  ipcMain.handle("staff:setCurrentStaff", (_event, staffId: string) => {
    setCurrentStaffId(staffId);
  });

  ipcMain.handle("staff:create", (_event, input: { fullName: string }) => {
    const staffId = createStaffUseCase.execute({ fullName: input.fullName });
    setCurrentStaffId(staffId);
    return staffId;
  });

  ipcMain.handle("staff:deactivate", (_event, staffId: string) => {
    staffRepository.deactivate(staffId);
  });
}

