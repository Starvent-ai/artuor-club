import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlAuditLogRepository } from "../../../infrastructure/database/src/repositories/SqlAuditLogRepository";
import { DetermineEntryScreenUseCase } from "../../../core/src/application/use-cases/DetermineEntryScreenUseCase";
import { CreateStaffUseCase } from "../../../core/src/application/use-cases/CreateStaffUseCase";
import { randomUUID } from "node:crypto";
import { getCurrentStaffId, setCurrentStaffId } from "../currentSession";

export function registerStaffHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const auditLogRepository = new SqlAuditLogRepository(connection);
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
    const actingStaffId = getCurrentStaffId();
    const staffId = createStaffUseCase.execute({ fullName: input.fullName });
    setCurrentStaffId(staffId);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "staff",
      entityId: staffId,
      action: "create",
      oldValue: null,
      newValue: JSON.stringify(input),
      staffId: actingStaffId,
      occurredAt: new Date().toISOString(),
    });
    return staffId;
  });

  ipcMain.handle("staff:deactivate", (_event, staffId: string) => {
    const actingStaffId = getCurrentStaffId();
    staffRepository.deactivate(staffId);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "staff",
      entityId: staffId,
      action: "delete",
      oldValue: null,
      newValue: null,
      staffId: actingStaffId,
      occurredAt: new Date().toISOString(),
    });
  });
}

