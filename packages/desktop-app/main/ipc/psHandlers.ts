import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlDeviceRepository } from "../../../infrastructure/database/src/repositories/SqlDeviceRepository";
import { SqlDeviceControllerRateRepository } from "../../../infrastructure/database/src/repositories/SqlDeviceControllerRateRepository";
import { SqlPsSessionRepository } from "../../../infrastructure/database/src/repositories/SqlPsSessionRepository";
import { SqlPsSessionSegmentRepository } from "../../../infrastructure/database/src/repositories/SqlPsSessionSegmentRepository";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { StartPsSessionUseCase } from "../../../core/src/application/use-cases/StartPsSessionUseCase";
import { ChangePsSessionControllerCountUseCase } from "../../../core/src/application/use-cases/ChangePsSessionControllerCountUseCase";
import { EndPsSessionUseCase } from "../../../core/src/application/use-cases/EndPsSessionUseCase";
import { CreateDeviceUseCase } from "../../../core/src/application/use-cases/CreateDeviceUseCase";
import { SetDeviceControllerRateUseCase } from "../../../core/src/application/use-cases/SetDeviceControllerRateUseCase";
import { getCurrentStaffId } from "../currentSession";

export function registerPsHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const deviceRepository = new SqlDeviceRepository(connection);
  const rateRepository = new SqlDeviceControllerRateRepository(connection);
  const sessionRepository = new SqlPsSessionRepository(connection);
  const segmentRepository = new SqlPsSessionSegmentRepository(connection);
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);

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
    accountingTransactionRepository
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
    };
  });

  ipcMain.handle(
    "ps:startSession",
    (_event, input: { deviceId: string; controllerCount: number }) => {
      const staffId = resolveStaffId();
      return startPsSessionUseCase.execute({
        deviceId: input.deviceId,
        staffId,
        controllerCount: input.controllerCount,
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
      input: { deviceId: string; paymentMethod: "cash" | "pos" | "card_to_card" | "ledger" }
    ) => {
      const staffId = resolveStaffId();
      const session = sessionRepository.findActiveByDeviceId(input.deviceId);
      if (!session) {
        throw new Error("ACTIVE_SESSION_NOT_FOUND");
      }
      return endPsSessionUseCase.execute({
        sessionId: session.id,
        staffId,
        paymentMethod: input.paymentMethod,
        hasAttachedItems: false,
      });
    }
  );

  ipcMain.handle("device:listActive", () => {
    return deviceRepository.findAllActive();
  });

  ipcMain.handle(
    "device:create",
    (_event, input: { name: string; deviceType: "ps4" | "ps5"; maxControllers?: number }) => {
      return createDeviceUseCase.execute(input);
    }
  );

  ipcMain.handle("device:deactivate", (_event, deviceId: string) => {
    deviceRepository.deactivate(deviceId);
  });

  ipcMain.handle("deviceControllerRate:listByType", (_event, deviceType: "ps4" | "ps5") => {
    return rateRepository.findAllByDeviceType(deviceType);
  });

  ipcMain.handle(
    "deviceControllerRate:set",
    (_event, input: { deviceType: "ps4" | "ps5"; controllerCount: number; hourlyRate: number }) => {
      setDeviceControllerRateUseCase.execute(input);
    }
  );
}
