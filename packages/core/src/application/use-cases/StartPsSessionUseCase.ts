import { randomUUID } from "node:crypto";
import type { DeviceRepository } from "../../domain/ports/DeviceRepository";
import type { DeviceControllerRateRepository } from "../../domain/ports/DeviceControllerRateRepository";
import type { PsSessionRepository } from "../../domain/ports/PsSessionRepository";
import type { PsSessionSegmentRepository } from "../../domain/ports/PsSessionSegmentRepository";

export interface StartPsSessionInput {
  deviceId: string;
  staffId: string;
  controllerCount: number;
  openTabId?: string;
  now?: Date;
}

export class DeviceNotFoundError extends Error {
  constructor() {
    super("DEVICE_NOT_FOUND");
  }
}

export class DeviceNotFreeError extends Error {
  constructor() {
    super("DEVICE_NOT_FREE");
  }
}

export class ControllerRateNotConfiguredError extends Error {
  constructor() {
    super("CONTROLLER_RATE_NOT_CONFIGURED");
  }
}

export class StartPsSessionUseCase {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceControllerRateRepository: DeviceControllerRateRepository,
    private readonly psSessionRepository: PsSessionRepository,
    private readonly psSessionSegmentRepository: PsSessionSegmentRepository
  ) {}

  execute(input: StartPsSessionInput): string {
    const device = this.deviceRepository.findById(input.deviceId);
    if (!device) {
      throw new DeviceNotFoundError();
    }
    if (device.status !== "free") {
      throw new DeviceNotFreeError();
    }

    const rate = this.deviceControllerRateRepository.findRate(
      device.deviceType,
      input.controllerCount
    );
    if (!rate) {
      throw new ControllerRateNotConfiguredError();
    }

    const sessionId = randomUUID();
    const now = input.now ?? new Date();
    const nowIso = now.toISOString();

    this.psSessionRepository.create({
      id: sessionId,
      deviceId: input.deviceId,
      openTabId: input.openTabId ?? null,
      staffId: input.staffId,
      startTime: nowIso,
      endTime: null,
      finalAmount: null,
      status: "active",
    });

    this.psSessionSegmentRepository.create({
      id: randomUUID(),
      psSessionId: sessionId,
      controllerCount: input.controllerCount,
      segmentStart: nowIso,
      segmentEnd: null,
      billedMinutes: null,
      segmentAmount: null,
    });

    this.deviceRepository.updateStatus(input.deviceId, "in_use");

    return sessionId;
  }
}
