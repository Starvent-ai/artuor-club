import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlDeviceRepository } from "../../../infrastructure/database/src/repositories/SqlDeviceRepository";
import { SqlDeviceControllerRateRepository } from "../../../infrastructure/database/src/repositories/SqlDeviceControllerRateRepository";
import { SqlPsSessionRepository } from "../../../infrastructure/database/src/repositories/SqlPsSessionRepository";
import { SqlPsSessionSegmentRepository } from "../../../infrastructure/database/src/repositories/SqlPsSessionSegmentRepository";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { SqlOpenTabRepository } from "../../../infrastructure/database/src/repositories/SqlOpenTabRepository";
import { SqlOpenTabItemRepository } from "../../../infrastructure/database/src/repositories/SqlOpenTabItemRepository";
import { SqlAuditLogRepository } from "../../../infrastructure/database/src/repositories/SqlAuditLogRepository";
import { StartPsSessionUseCase } from "../../../core/src/application/use-cases/StartPsSessionUseCase";
import { ChangePsSessionControllerCountUseCase } from "../../../core/src/application/use-cases/ChangePsSessionControllerCountUseCase";
import { EndPsSessionUseCase } from "../../../core/src/application/use-cases/EndPsSessionUseCase";
import { CreateDeviceUseCase } from "../../../core/src/application/use-cases/CreateDeviceUseCase";
import { SetDeviceControllerRateUseCase } from "../../../core/src/application/use-cases/SetDeviceControllerRateUseCase";
import { randomUUID } from "node:crypto";
import { getCurrentStaffId } from "../currentSession";

export function registerPsHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const deviceRepository = new SqlDeviceRepository(connection);
  const rateRepository = new SqlDeviceControllerRateRepository(connection);
  const sessionRepository = new SqlPsSessionRepository(connection);
  const segmentRepository = new SqlPsSessionSegmentRepository(connection);
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);
  const openTabRepository = new SqlOpenTabRepository(connection);
  const openTabItemRepository = new SqlOpenTabItemRepository(connection);
  const auditLogRepository = new SqlAuditLogRepository(connection);

  const startPsSessionUseCase = new StartPsSessionUseCase(
    deviceRepository,
    rateRepository,
    sessionRepository,
    segmentRepository
  );
  const changeControllerCountUseCase = new ChangePsSessionControllerCountUseCase(
    deviceRepository,
    rateRepository,
    sessionRepository,
    segmentRepository
  );
  const endPsSessionUseCase = new EndPsSessionUseCase(
    deviceRepository,
    rateRepository,
    sessionRepository,
    segmentRepository,
    accountingTransactionRepository,
    openTabRepository,
    openTabItemRepository
  );
  const createDeviceUseCase = new CreateDeviceUseCase(deviceRepository);
  const setDeviceControllerRateUseCase = new SetDeviceControllerRateUseCase(rateRepository);

  function resolveStaffId(): string {
    const staffId = getCurrentStaffId() ?? staffRepository.findAllActive()[0]?.id;
    if (!staffId) {
      throw new Error("NO_STAFF_AVAILABLE");
    }
    return staffId;
  }

  ipcMain.handle("ps:getActiveSession", (_event, deviceId: string) => {
    const session = sessionRepository.findActiveByDeviceId(deviceId);
    if (!session) {
      return null;
    }
    const activeSegment = segmentRepository.findActiveByPsSessionId(session.id);
    return {
      sessionId: session.id,
      controllerCount: activeSegment?.controllerCount ?? null,
      openTabId: session.openTabId,
    };
  });

  ipcMain.handle(
    "ps:startSession",
    (_event, input: { deviceId: string; controllerCount: number; openTabId?: string }) => {
      const staffId = resolveStaffId();
      return startPsSessionUseCase.execute({
        deviceId: input.deviceId,
        staffId,
        controllerCount: input.controllerCount,
        openTabId: input.openTabId,
      });
    }
  );

  ipcMain.handle(
    "ps:changeControllerCount",
    (_event, input: { sessionId: string; newControllerCount: number }) => {
      changeControllerCountUseCase.execute(input);
    }
  );

  ipcMain.handle(
    "ps:endSession",
    (
      _event,
      input: { deviceId: string; paymentMethod?: "cash" | "pos" | "card_to_card" | "ledger" }
    ) => {
      const staffId = resolveStaffId();
      const session = sessionRepository.findActiveByDeviceId(input.deviceId);
      if (!session) {
        throw new Error("ACTIVE_SESSION_NOT_FOUND");
      }
      const hasAttachedItems = session.openTabId
        ? openTabItemRepository
            .findByOpenTabId(session.openTabId)
            .some((item) => item.sourceType !== "ps_session" || item.sourceId !== session.id)
        : false;
      return endPsSessionUseCase.execute({
        sessionId: session.id,
        staffId,
        paymentMethod: input.paymentMethod,
        hasAttachedItems,
      });
    }
  );

  ipcMain.handle("device:listActive", () => {
    return deviceRepository.findAllActive();
  });

  ipcMain.handle(
    "device:create",
    (_event, input: { name: string; deviceType: "ps4" | "ps5"; maxControllers?: number }) => {
      const actingStaffId = getCurrentStaffId();
      const deviceId = createDeviceUseCase.execute(input);
      auditLogRepository.record({
        id: randomUUID(),
        entityType: "device",
        entityId: deviceId,
        action: "create",
        oldValue: null,
        newValue: JSON.stringify(input),
        staffId: actingStaffId,
        occurredAt: new Date().toISOString(),
      });
      return deviceId;
    }
  );

  ipcMain.handle("device:deactivate", (_event, deviceId: string) => {
    const actingStaffId = getCurrentStaffId();
    deviceRepository.deactivate(deviceId);
    auditLogRepository.record({
      id: randomUUID(),
      entityType: "device",
      entityId: deviceId,
      action: "delete",
      oldValue: null,
      newValue: null,
      staffId: actingStaffId,
      occurredAt: new Date().toISOString(),
    });
  });

  ipcMain.handle("deviceControllerRate:listByType", (_event, deviceType: "ps4" | "ps5") => {
    return rateRepository.findAllByDeviceType(deviceType);
  });

  ipcMain.handle(
    "deviceControllerRate:set",
    (_event, input: { deviceType: "ps4" | "ps5"; controllerCount: number; hourlyRate: number }) => {
      const actingStaffId = getCurrentStaffId();
      const before = rateRepository.findRate(input.deviceType, input.controllerCount);
      setDeviceControllerRateUseCase.execute(input);
      auditLogRepository.record({
        id: randomUUID(),
        entityType: "device_controller_rate",
        entityId: `${input.deviceType}:${input.controllerCount}`,
        action: before ? "update" : "create",
        oldValue: before ? JSON.stringify({ hourlyRate: before.hourlyRate }) : null,
        newValue: JSON.stringify({ hourlyRate: input.hourlyRate }),
        staffId: actingStaffId,
        occurredAt: new Date().toISOString(),
      });
    }
  );
}
