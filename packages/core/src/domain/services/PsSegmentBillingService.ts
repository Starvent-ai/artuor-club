import { Money } from "../value-objects/Money";
import { TimeRoundingService } from "./TimeRoundingService";

export interface PsSegmentInput {
  controllerCount: number;
  startedAt: Date;
  endedAt: Date;
  ratePerHourForControllerCount: number;
}

export interface PsSegmentResult {
  controllerCount: number;
  billedMinutes: number;
  amount: Money;
}

export class PsSegmentBillingService {
  static calculateSegment(segment: PsSegmentInput): PsSegmentResult {
    const rawSeconds = (segment.endedAt.getTime() - segment.startedAt.getTime()) / 1000;
    if (rawSeconds < 0) {
      throw new Error("INVALID_SEGMENT_RANGE");
    }

    const billedMinutes = TimeRoundingService.computeBilledMinutesFromSeconds(rawSeconds);
    const amount = Money.fromToman((billedMinutes / 60) * segment.ratePerHourForControllerCount);

    return {
      controllerCount: segment.controllerCount,
      billedMinutes,
      amount,
    };
  }

  static calculateTotal(segments: PsSegmentInput[]): Money {
    return segments
      .map((segment) => PsSegmentBillingService.calculateSegment(segment).amount)
      .reduce((total, current) => total.add(current), Money.zero());
  }
}
