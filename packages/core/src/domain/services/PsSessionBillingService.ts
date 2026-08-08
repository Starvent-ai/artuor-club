import { Money } from "../value-objects/Money";

export interface PsSessionBillingResult {
  totalBilledMinutes: number;
  amount: Money;
  isBelowMinimumThreshold: boolean;
}

export class PsSessionBillingService {
  private static readonly MINIMUM_BILLABLE_AMOUNT = Money.fromToman(5000);

  static summarize(segmentAmounts: Money[], segmentBilledMinutes: number[]): PsSessionBillingResult {
    const totalBilledMinutes = segmentBilledMinutes.reduce((total, current) => total + current, 0);
    const rawTotal = segmentAmounts.reduce((total, current) => total.add(current), Money.zero());

    const isBelowMinimumThreshold = rawTotal.isLessThan(
      PsSessionBillingService.MINIMUM_BILLABLE_AMOUNT
    );

    return {
      totalBilledMinutes,
      amount: isBelowMinimumThreshold ? Money.zero() : rawTotal,
      isBelowMinimumThreshold,
    };
  }

  static shouldRecordAsTransaction(result: PsSessionBillingResult, hasAttachedItems: boolean): boolean {
    if (!result.isBelowMinimumThreshold) {
      return true;
    }
    return hasAttachedItems;
  }
}
