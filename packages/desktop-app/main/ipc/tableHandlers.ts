import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlTableRepository } from "../../../infrastructure/database/src/repositories/SqlTableRepository";
import { SqlTableSessionRepository } from "../../../infrastructure/database/src/repositories/SqlTableSessionRepository";
import { SqlDeviceRepository } from "../../../infrastructure/database/src/repositories/SqlDeviceRepository";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { SqlTableTypeRepository } from "../../../infrastructure/database/src/repositories/SqlTableTypeRepository";
import { SqlOpenTabItemRepository } from "../../../infrastructure/database/src/repositories/SqlOpenTabItemRepository";
import { SqlAuditLogRepository } from "../../../infrastructure/database/src/repositories/SqlAuditLogRepository";
import { StartTableSessionUseCase } from "../../../core/src/application/use-cases/StartTableSessionUseCase";
import { EndTableSessionUseCase } from "../../../core/src/application/use-cases/EndTableSessionUseCase";
import { CreateTableTypeUseCase } from "../../../core/src/application/use-cases/CreateTableTypeUseCase";
import { CreateTableUseCase } from "../../../core/src/application/use-cases/CreateTableUseCase";
import { randomUUID } from "node:crypto";
import { getCurrentStaffId } from "../currentSession";

export function registerTableHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const tableRepository = new SqlTableRepository(connection);
  const tableSessionRepository = new SqlTableSessionRepository(connection);
  const deviceRepository = new SqlDeviceRepository(connection);
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);
  const tableTypeRepository = new SqlTableTypeRepository(connection);
  const openTabItemRepository = new SqlOpenTabItemRepository(connection);
  const auditLogRepository = new SqlAuditLogRepository(connection);

  const startTableSessionUseCase = new StartTableSessionUseCase(tableRepository, tableSessionRepository);
  const endTableSessionUseCase = new EndTableSessionUseCase(
    tableRepository,
    tableSessionRepository,
    accountingTransactionRepository
  );
  const createTableTypeUseCase = new CreateTableTypeUseCase(tableTypeRepository);
  const createTableUseCase = new CreateTableUseCase(tableRepository);

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

      const hasAttachedItems = activeSession.openTabId
        ? openTabItemRepository
            .findByOpenTabId(activeSession.openTabId)
            .some((item) => item.sourceType !== "table_session" || item.sourceId !== activeSession.id)
        : false;

      return endTableSessionUseCase.execute({
        sessionId: activeSession.id,
        staffId,
        paymentMethod: input.paymentMethod,
        hasAttachedItems,
      });
    }
  );

  ipcMain.handle("table:listActive", () => {
    return tableRepository.findAllActive();
  });

  ipcMain.handle("tableType:listActive", () => {
    return tableTypeRepository.findAllActive();
  });

  ipcMain.handle("tableType:create", (_event, input: { name: string; hourlyRate: number }) => {
    const staffId = getCurrentStaffId();
    const tableTypeId = createTableTypeUseCase.execute(input);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "table_type",
      entityId: tableTypeId,
      action: "create",
      oldValue: null,
      newValue: JSON.stringify(input),
      staffId,
      occurredAt: new Date().toISOString(),
    });
    return tableTypeId;
  });

  ipcMain.handle("tableType:updateRate", (_event, input: { id: string; hourlyRate: number }) => {
    const staffId = getCurrentStaffId();
    const before = tableTypeRepository.findById(input.id);
    tableTypeRepository.updateRate(input.id, input.hourlyRate);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "table_type",
      entityId: input.id,
      action: "update",
      oldValue: before ? JSON.stringify({ hourlyRate: before.hourlyRate }) : null,
      newValue: JSON.stringify({ hourlyRate: input.hourlyRate }),
      staffId,
      occurredAt: new Date().toISOString(),
    });
  });

  ipcMain.handle("table:create", (_event, input: { name: string; tableTypeId: string }) => {
    const staffId = getCurrentStaffId();
    const tableId = createTableUseCase.execute(input);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "billiard_table",
      entityId: tableId,
      action: "create",
      oldValue: null,
      newValue: JSON.stringify(input),
      staffId,
      occurredAt: new Date().toISOString(),
    });
    return tableId;
  });

  ipcMain.handle("table:deactivate", (_event, tableId: string) => {
    const staffId = getCurrentStaffId();
    tableRepository.deactivate(tableId);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "billiard_table",
      entityId: tableId,
      action: "delete",
      oldValue: null,
      newValue: null,
      staffId,
      occurredAt: new Date().toISOString(),
    });
  });
}
