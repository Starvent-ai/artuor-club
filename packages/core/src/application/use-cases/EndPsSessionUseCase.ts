import { randomUUID } from "node:crypto";
import type { DeviceRepository } from "../../domain/ports/DeviceRepository";
import type { DeviceControllerRateRepository } from "../../domain/ports/DeviceControllerRateRepository";
import type { PsSessionRepository } from "../../domain/ports/PsSessionRepository";
import type { PsSessionSegmentRepository } from "../../domain/ports/PsSessionSegmentRepository";
import type { AccountingTransactionRepository } from "../../domain/ports/AccountingTransactionRepository";
import { PsSegmentBillingService } from "../../domain/services/PsSegmentBillingService";
import { PsSessionBillingService } from "../../domain/services/PsSessionBillingService";
import { Money } from "../../domain/value-objects/Money";
import {
  ActiveSegmentNotFoundError,
  PsSessionNotActiveError,
} from "./ChangePsSessionControllerCountUseCase";
import { ControllerRateNotConfiguredError, DeviceNotFoundError } from "./StartPsSessionUseCase";

export interface EndPsSessionInput {
  sessionId: string;
  staffId: string;
  paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  hasAttachedItems: boolean;
  now?: Date;
}

export interface EndPsSessionResult {
  totalBilledMinutes: number;
  amount: number;
  transactionRecorded: boolean;
}

export class EndPsSessionUseCase {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceControllerRateRepository: DeviceControllerRateRepository,
    private readonly psSessionRepository: PsSessionRepository,
    private readonly psSessionSegmentRepository: PsSessionSegmentRepository,
    private readonly accountingTransactionRepository: AccountingTransactionRepository
  ) {}

  execute(input: EndPsSessionInput): EndPsSessionResult {
    const session = this.psSessionRepository.findById(input.sessionId);
    if (!session || session.status !== "active") {
      throw new PsSessionNotActiveError();
    }

    const device = this.deviceRepository.findById(session.deviceId);
    if (!device) {
      throw new DeviceNotFoundError();
    }

    const activeSegment = this.psSessionSegmentRepository.findActiveByPsSessionId(
      input.sessionId
    );
    if (!activeSegment) {
      throw new ActiveSegmentNotFoundError();
    }

    const now = input.now ?? new Date();

    const currentRate = this.deviceControllerRateRepository.findRate(
      device.deviceType,
      activeSegment.controllerCount
    );
    if (!currentRate) {
      throw new ControllerRateNotConfiguredError();
    }

    const finalSegmentResult = PsSegmentBillingService.calculateSegment({
      controllerCount: activeSegment.controllerCount,
      startedAt: new Date(activeSegment.segmentStart),
      endedAt: now,
      ratePerHourForControllerCount: currentRate.hourlyRate,
    });

    this.psSessionSegmentRepository.closeSegment(
      activeSegment.id,
      now.toISOString(),
      finalSegmentResult.billedMinutes,
      finalSegmentResult.amount.toToman()
    );

    const allSegments = this.psSessionSegmentRepository.findAllByPsSessionId(input.sessionId);

    const segmentAmounts = allSegments.map((segment) =>
      Money.fromToman(segment.segmentAmount ?? 0)
    );
    const segmentBilledMinutes = allSegments.map((segment) => segment.billedMinutes ?? 0);

    const sessionBillingResult = PsSessionBillingService.summarize(
      segmentAmounts,
      segmentBilledMinutes
    );
    const transactionRecorded = PsSessionBillingService.shouldRecordAsTransaction(
      sessionBillingResult,
      input.hasAttachedItems
    );

    this.psSessionRepository.closeSession(
      input.sessionId,
      now.toISOString(),
      sessionBillingResult.amount.toToman()
    );

    this.deviceRepository.updateStatus(session.deviceId, "free");

    if (transactionRecorded) {
      this.accountingTransactionRepository.record({
        id: randomUUID(),
        type: "ps_income",
        sourceId: input.sessionId,
        amount: sessionBillingResult.amount.toToman(),
        paymentMethod: input.paymentMethod,
        description: null,
        staffId: input.staffId,
        occurredAt: now.toISOString(),
      });
    }

    return {
      totalBilledMinutes: sessionBillingResult.totalBilledMinutes,
      amount: sessionBillingResult.amount.toToman(),
      transactionRecorded,
    };
  }
}
