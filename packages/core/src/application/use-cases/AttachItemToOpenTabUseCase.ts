import { randomUUID } from "node:crypto";
import type { OpenTabRepository } from "../../domain/ports/OpenTabRepository";
import type { OpenTabItemRepository } from "../../domain/ports/OpenTabItemRepository";

export interface AttachItemToOpenTabInput {
  openTabId: string;
  sourceType: "table_session" | "ps_session" | "buffet_order";
  sourceId: string;
  amount: number;
  now?: Date;
}

export class OpenTabNotActiveError extends Error {
  constructor() {
    super("OPEN_TAB_NOT_ACTIVE");
  }
}

export class AttachItemToOpenTabUseCase {
  constructor(
    private readonly openTabRepository: OpenTabRepository,
    private readonly openTabItemRepository: OpenTabItemRepository
  ) {}

  execute(input: AttachItemToOpenTabInput): void {
    const openTab = this.openTabRepository.findById(input.openTabId);
    if (!openTab || openTab.status !== "active") {
      throw new OpenTabNotActiveError();
    }

    this.openTabItemRepository.create({
      id: randomUUID(),
      openTabId: input.openTabId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      amount: input.amount,
      createdAt: (input.now ?? new Date()).toISOString(),
    });

    const newTotal = openTab.totalAmount + input.amount;
    this.openTabRepository.updateAmounts(input.openTabId, newTotal, openTab.paidAmount);
  }
}
