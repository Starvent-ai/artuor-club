import { randomUUID } from "node:crypto";
import type { OpenTabRepository } from "../../domain/ports/OpenTabRepository";
import type { LedgerAccountRepository } from "../../domain/ports/LedgerAccountRepository";
import { OpenTabNotActiveError } from "./AttachItemToOpenTabUseCase";

export interface ConvertOpenTabToLedgerInput {
  openTabId: string;
  now?: Date;
}

export class ConvertOpenTabToLedgerUseCase {
  constructor(
    private readonly openTabRepository: OpenTabRepository,
    private readonly ledgerAccountRepository: LedgerAccountRepository
  ) {}

  execute(input: ConvertOpenTabToLedgerInput): string {
    const openTab = this.openTabRepository.findById(input.openTabId);
    if (!openTab || openTab.status !== "active") {
      throw new OpenTabNotActiveError();
    }

    const remainingAmount = openTab.totalAmount - openTab.paidAmount;
    const now = input.now ?? new Date();
    const ledgerAccountId = randomUUID();

    this.ledgerAccountRepository.create({
      id: ledgerAccountId,
      customerId: openTab.customerId,
      sourceType: "converted_from_open_tab",
      sourceOpenTabId: input.openTabId,
      status: "open",
      totalAmount: remainingAmount,
      paidAmount: 0,
      openedAt: now.toISOString(),
      settledAt: null,
    });

    this.openTabRepository.updateStatus(input.openTabId, "converted_to_ledger", now.toISOString());

    return ledgerAccountId;
  }
}
