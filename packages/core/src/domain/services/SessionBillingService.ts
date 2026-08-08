import { Money } from "../value-objects/Money";
import { TimeRoundingService } from "./TimeRoundingService";

export interface SessionBillingResult {
  billedMinutes: number;
  amount: Money;
  isBelowMinimumThreshold: boolean;
}

export class SessionBillingService {
  private static readonly MINIMUM_BILLABLE_AMOUNT = Money.fromToman(5000);

  static calculate(rawSeconds: number, hourlyRate: number): SessionBillingResult {
    const billedMinutes = TimeRoundingService.computeBilledMinutesFromSeconds(rawSeconds);
    const rawAmount = Money.fromToman((billedMinutes / 60) * hourlyRate);

    const isBelowMinimumThreshold = rawAmount.isLessThan(
      SessionBillingService.MINIMUM_BILLABLE_AMOUNT
    );

    return {
      billedMinutes,
      amount: isBelowMinimumThreshold ? Money.zero() : rawAmount,
      isBelowMinimumThreshold,
    };
  }

  static shouldRecordAsTransaction(
    billingResult: SessionBillingResult,
    hasAttachedItems: boolean
  ): boolean {
    if (!billingResult.isBelowMinimumThreshold) {
      return true;
    }
    return hasAttachedItems;
  }
}
