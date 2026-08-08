import { randomUUID } from "node:crypto";
import type { DeviceRepository } from "../../domain/ports/DeviceRepository";
import type { DeviceControllerRateRepository } from "../../domain/ports/DeviceControllerRateRepository";
import type { PsSessionRepository } from "../../domain/ports/PsSessionRepository";
import type { PsSessionSegmentRepository } from "../../domain/ports/PsSessionSegmentRepository";
import { PsSegmentBillingService } from "../../domain/services/PsSegmentBillingService";
import { ControllerRateNotConfiguredError, DeviceNotFoundError } from "./StartPsSessionUseCase";

export interface ChangePsSessionControllerCountInput {
  sessionId: string;
  newControllerCount: number;
  now?: Date;
}

export class PsSessionNotActiveError extends Error {
  constructor() {
    super("PS_SESSION_NOT_ACTIVE");
  }
}

export class ActiveSegmentNotFoundError extends Error {
  constructor() {
    super("ACTIVE_SEGMENT_NOT_FOUND");
  }
}

export class ChangePsSessionControllerCountUseCase {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceControllerRateRepository: DeviceControllerRateRepository,
    private readonly psSessionRepository: PsSessionRepository,
    private readonly psSessionSegmentRepository: PsSessionSegmentRepository
  ) {}

  execute(input: ChangePsSessionControllerCountInput): void {
    const session = this.psSessionRepository.findById(input.sessionId);
    if (!session || session.status !== "active") {
      throw new PsSessionNotActiveError();
    }

    const device = this.deviceRepository.findById(session.deviceId);
    if (!device) {
      throw new DeviceNotFoundError();
    }

    const activeSegment = this.psSessionSegmentRepository.findActiveByPsSessionId(input.sessionId);
    if (!activeSegment) {
      throw new ActiveSegmentNotFoundError();
    }

    if (activeSegment.controllerCount === input.newControllerCount) {
      return;
    }

    const now = input.now ?? new Date();

    const currentRate = this.deviceControllerRateRepository.findRate(
      device.deviceType,
      activeSegment.controllerCount
    );
    if (!currentRate) {
      throw new ControllerRateNotConfiguredError();
    }

    const segmentResult = PsSegmentBillingService.calculateSegment({
      controllerCount: activeSegment.controllerCount,
      startedAt: new Date(activeSegment.segmentStart),
      endedAt: now,
      ratePerHourForControllerCount: currentRate.hourlyRate,
    });

    this.psSessionSegmentRepository.closeSegment(
      activeSegment.id,
      now.toISOString(),
      segmentResult.billedMinutes,
      segmentResult.amount.toToman()
    );

    const newRate = this.deviceControllerRateRepository.findRate(
      device.deviceType,
      input.newControllerCount
    );
    if (!newRate) {
      throw new ControllerRateNotConfiguredError();
    }

    this.psSessionSegmentRepository.create({
      id: randomUUID(),
      psSessionId: input.sessionId,
      controllerCount: input.newControllerCount,
      segmentStart: now.toISOString(),
      segmentEnd: null,
      billedMinutes: null,
      segmentAmount: null,
    });
  }
}
