import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlTableRepository } from "../../../infrastructure/database/src/repositories/SqlTableRepository";
import { SqlTableSessionRepository } from "../../../infrastructure/database/src/repositories/SqlTableSessionRepository";
import { SqlDeviceRepository } from "../../../infrastructure/database/src/repositories/SqlDeviceRepository";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { StartTableSessionUseCase } from "../../../core/src/application/use-cases/StartTableSessionUseCase";
import { EndTableSessionUseCase } from "../../../core/src/application/use-cases/EndTableSessionUseCase";
import { getCurrentStaffId } from "../currentSession";

export function registerTableHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const tableRepository = new SqlTableRepository(connection);
  const tableSessionRepository = new SqlTableSessionRepository(connection);
  const deviceRepository = new SqlDeviceRepository(connection);
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);

  const startTableSessionUseCase = new StartTableSessionUseCase(tableRepository, tableSessionRepository);
  const endTableSessionUseCase = new EndTableSessionUseCase(
    tableRepository,
    tableSessionRepository,
    accountingTransactionRepository
  );

  function resolveStaffId(): string {
    const staffId = getCurrentStaffId() ?? staffRepository.findAllActive()[0]?.id;
    if (!staffId) {
      throw new Error("NO_STAFF_AVAILABLE");
    }
    return staffId;
  }

  ipcMain.handle("home:getScreenData", () => {
    return {
      tables: tableRepository.findAllActive().map((table) => ({
        id: table.id,
        name: table.name,
        status: table.status,
      })),
      devices: deviceRepository.findAllActive().map((device) => ({
        id: device.id,
        name: device.name,
        deviceType: device.deviceType,
        status: device.status,
      })),
    };
  });

  ipcMain.handle("table:toggleSession", (_event, tableId: string) => {
    const staffId = resolveStaffId();
    const table = tableRepository.findById(tableId);
    if (!table) {
      throw new Error("TABLE_NOT_FOUND");
    }
    if (table.status !== "free") {
      throw new Error("TABLE_NOT_FREE");
    }

    startTableSessionUseCase.execute({ tableId, staffId });
  });

  ipcMain.handle(
    "table:endSession",
    (
      _event,
      input: { tableId: string; paymentMethod: "cash" | "pos" | "card_to_card" | "ledger" }
    ) => {
      const staffId = resolveStaffId();
      const activeSession = tableSessionRepository.findActiveByTableId(input.tableId);
      if (!activeSession) {
        throw new Error("ACTIVE_SESSION_NOT_FOUND");
      }

      return endTableSessionUseCase.execute({
        sessionId: activeSession.id,
        staffId,
        paymentMethod: input.paymentMethod,
        hasAttachedItems: false,
      });
    }
  );
}
