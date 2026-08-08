import { randomUUID } from "node:crypto";
import type { TableRepository } from "../../domain/ports/TableRepository";
import type { TableSessionRepository } from "../../domain/ports/TableSessionRepository";

export interface StartTableSessionInput {
  tableId: string;
  staffId: string;
  openTabId?: string;
  now?: Date;
}

export class TableNotFreeError extends Error {
  constructor() {
    super("TABLE_NOT_FREE");
  }
}

export class TableNotFoundError extends Error {
  constructor() {
    super("TABLE_NOT_FOUND");
  }
}

export class StartTableSessionUseCase {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly tableSessionRepository: TableSessionRepository
  ) {}

  execute(input: StartTableSessionInput): string {
    const table = this.tableRepository.findById(input.tableId);
    if (!table) {
      throw new TableNotFoundError();
    }
    if (table.status !== "free") {
      throw new TableNotFreeError();
    }

    const sessionId = randomUUID();
    const now = input.now ?? new Date();

    this.tableSessionRepository.create({
      id: sessionId,
      tableId: input.tableId,
      openTabId: input.openTabId ?? null,
      staffId: input.staffId,
      startTime: now.toISOString(),
      endTime: null,
      rawSeconds: null,
      billedMinutes: null,
      finalAmount: null,
      status: "active",
    });

    this.tableRepository.updateStatus(input.tableId, "in_use");

    return sessionId;
  }
}
