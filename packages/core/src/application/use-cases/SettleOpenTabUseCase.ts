import type { OpenTabRepository } from "../../domain/ports/OpenTabRepository";
import type { PaymentRepository } from "../../domain/ports/PaymentRepository";
import type { LedgerAccountRepository } from "../../domain/ports/LedgerAccountRepository";
import { OpenTabNotActiveError } from "./AttachItemToOpenTabUseCase";
import { RecordOpenTabPaymentUseCase } from "./RecordOpenTabPaymentUseCase";
import { ConvertOpenTabToLedgerUseCase } from "./ConvertOpenTabToLedgerUseCase";

export interface SettleOpenTabInput {
  openTabId: string;
  method: "cash" | "pos" | "card_to_card" | "ledger";
  staffId: string;
  now?: Date;
}

export type SettleOpenTabResult =
  | { outcome: "settled" }
  | { outcome: "converted_to_ledger"; ledgerAccountId: string };

export class SettleOpenTabUseCase {
  constructor(
    private readonly openTabRepository: OpenTabRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly ledgerAccountRepository: LedgerAccountRepository
  ) {}

  execute(input: SettleOpenTabInput): SettleOpenTabResult {
    const openTab = this.openTabRepository.findById(input.openTabId);
    if (!openTab || openTab.status !== "active") {
      throw new OpenTabNotActiveError();
    }

    const now = input.now ?? new Date();

    if (input.method === "ledger") {
      const convertUseCase = new ConvertOpenTabToLedgerUseCase(
        this.openTabRepository,
        this.ledgerAccountRepository
      );
      const ledgerAccountId = convertUseCase.execute({ openTabId: input.openTabId, now });
      return { outcome: "converted_to_ledger", ledgerAccountId };
    }

    const remainingAmount = openTab.totalAmount - openTab.paidAmount;
    if (remainingAmount > 0) {
      const paymentUseCase = new RecordOpenTabPaymentUseCase(
        this.openTabRepository,
        this.paymentRepository
      );
      paymentUseCase.execute({
        openTabId: input.openTabId,
        amount: remainingAmount,
        method: input.method,
        staffId: input.staffId,
        now,
      });
    }

    this.openTabRepository.updateStatus(input.openTabId, "settled", now.toISOString());

    return { outcome: "settled" };
  }
}
