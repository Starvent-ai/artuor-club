import { randomUUID } from "node:crypto";
import type { LedgerAccountRepository } from "../../domain/ports/LedgerAccountRepository";
import type { PaymentRepository } from "../../domain/ports/PaymentRepository";

export interface RecordLedgerPaymentInput {
  ledgerAccountId: string;
  amount: number;
  method: "cash" | "pos" | "card_to_card";
  staffId: string;
  now?: Date;
}

export class LedgerAccountNotOpenError extends Error {
  constructor() {
    super("LEDGER_ACCOUNT_NOT_OPEN");
  }
}

export class LedgerMethodNotAllowedForLedgerSettlementError extends Error {
  constructor() {
    super("LEDGER_METHOD_NOT_ALLOWED_FOR_LEDGER_SETTLEMENT");
  }
}

export class RecordLedgerPaymentUseCase {
  constructor(
    private readonly ledgerAccountRepository: LedgerAccountRepository,
    private readonly paymentRepository: PaymentRepository
  ) {}

  execute(input: RecordLedgerPaymentInput): void {
    if ((input.method as string) === "ledger") {
      throw new LedgerMethodNotAllowedForLedgerSettlementError();
    }

    const ledgerAccount = this.ledgerAccountRepository.findById(input.ledgerAccountId);
    if (!ledgerAccount || ledgerAccount.status !== "open") {
      throw new LedgerAccountNotOpenError();
    }

    const now = input.now ?? new Date();

    this.paymentRepository.create({
      id: randomUUID(),
      targetType: "ledger_account",
      targetId: input.ledgerAccountId,
      amount: input.amount,
      method: input.method,
      paidAt: now.toISOString(),
      staffId: input.staffId,
    });

    const newPaidAmount = ledgerAccount.paidAmount + input.amount;
    this.ledgerAccountRepository.updateAmounts(
      input.ledgerAccountId,
      ledgerAccount.totalAmount,
      newPaidAmount
    );

    if (newPaidAmount >= ledgerAccount.totalAmount) {
      this.ledgerAccountRepository.updateStatus(input.ledgerAccountId, "settled", now.toISOString());
    }
  }
}
