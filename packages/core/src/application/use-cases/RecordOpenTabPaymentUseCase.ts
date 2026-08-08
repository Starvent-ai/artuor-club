import { randomUUID } from "node:crypto";
import type { OpenTabRepository } from "../../domain/ports/OpenTabRepository";
import type { PaymentRepository } from "../../domain/ports/PaymentRepository";
import { OpenTabNotActiveError } from "./AttachItemToOpenTabUseCase";

export interface RecordOpenTabPaymentInput {
  openTabId: string;
  amount: number;
  method: "cash" | "pos" | "card_to_card";
  staffId: string;
  now?: Date;
}

export class RecordOpenTabPaymentUseCase {
  constructor(
    private readonly openTabRepository: OpenTabRepository,
    private readonly paymentRepository: PaymentRepository
  ) {}

  execute(input: RecordOpenTabPaymentInput): void {
    const openTab = this.openTabRepository.findById(input.openTabId);
    if (!openTab || openTab.status !== "active") {
      throw new OpenTabNotActiveError();
    }

    const now = input.now ?? new Date();

    this.paymentRepository.create({
      id: randomUUID(),
      targetType: "open_tab",
      targetId: input.openTabId,
      amount: input.amount,
      method: input.method,
      paidAt: now.toISOString(),
      staffId: input.staffId,
    });

    const newPaidAmount = openTab.paidAmount + input.amount;
    this.openTabRepository.updateAmounts(input.openTabId, openTab.totalAmount, newPaidAmount);
  }
}
