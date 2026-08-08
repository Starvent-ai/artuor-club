import { randomUUID } from "node:crypto";
import type { TableRepository } from "../../domain/ports/TableRepository";
import type { TableSessionRepository } from "../../domain/ports/TableSessionRepository";
import type { AccountingTransactionRepository } from "../../domain/ports/AccountingTransactionRepository";
import { SessionBillingService } from "../../domain/services/SessionBillingService";

export interface EndTableSessionInput {
  sessionId: string;
  staffId: string;
  paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  hasAttachedItems: boolean;
  now?: Date;
}

export class SessionNotActiveError extends Error {
  constructor() {
    super("SESSION_NOT_ACTIVE");
  }
}

export class TableMissingForSessionError extends Error {
  constructor() {
    super("TABLE_MISSING_FOR_SESSION");
  }
}

export interface EndTableSessionResult {
  billedMinutes: number;
  amount: number;
  transactionRecorded: boolean;
}

export class EndTableSessionUseCase {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly tableSessionRepository: TableSessionRepository,
    private readonly accountingTransactionRepository: AccountingTransactionRepository
  ) {}

  execute(input: EndTableSessionInput): EndTableSessionResult {
    const session = this.tableSessionRepository.findById(input.sessionId);
    if (!session || session.status !== "active") {
      throw new SessionNotActiveError();
    }

    const table = this.tableRepository.findById(session.tableId);
    if (!table) {
      throw new TableMissingForSessionError();
    }

    const now = input.now ?? new Date();
    const startTime = new Date(session.startTime);
    const rawSeconds = Math.max(0, (now.getTime() - startTime.getTime()) / 1000);

    const billingResult = SessionBillingService.calculate(rawSeconds, table.hourlyRate);
    const transactionRecorded = SessionBillingService.shouldRecordAsTransaction(
      billingResult,
      input.hasAttachedItems
    );

    this.tableSessionRepository.closeSession(
      input.sessionId,
      now.toISOString(),
      Math.round(rawSeconds),
      billingResult.billedMinutes,
      billingResult.amount.toToman()
    );

    this.tableRepository.updateStatus(session.tableId, "free");

    if (transactionRecorded) {
      this.accountingTransactionRepository.record({
        id: randomUUID(),
        type: "table_income",
        sourceId: input.sessionId,
        amount: billingResult.amount.toToman(),
        paymentMethod: input.paymentMethod,
        description: null,
        staffId: input.staffId,
        occurredAt: now.toISOString(),
      });
    }

    return {
      billedMinutes: billingResult.billedMinutes,
      amount: billingResult.amount.toToman(),
      transactionRecorded,
    };
  }
}
