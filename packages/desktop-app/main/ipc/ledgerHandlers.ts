import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlLedgerAccountRepository } from "../../../infrastructure/database/src/repositories/SqlLedgerAccountRepository";
import { SqlPaymentRepository } from "../../../infrastructure/database/src/repositories/SqlPaymentRepository";
import { RecordLedgerPaymentUseCase } from "../../../core/src/application/use-cases/RecordLedgerPaymentUseCase";
import { getCurrentStaffId } from "../currentSession";

export function registerLedgerHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const ledgerAccountRepository = new SqlLedgerAccountRepository(connection);
  const paymentRepository = new SqlPaymentRepository(connection);

  const recordLedgerPaymentUseCase = new RecordLedgerPaymentUseCase(
    ledgerAccountRepository,
    paymentRepository
  );

  function resolveStaffId(): string {
    const staffId = getCurrentStaffId() ?? staffRepository.findAllActive()[0]?.id;
    if (!staffId) {
      throw new Error("NO_STAFF_AVAILABLE");
    }
    return staffId;
  }

  ipcMain.handle("ledger:list", (_event, namePrefix?: string) => {
    return ledgerAccountRepository.listOpenSummaries(namePrefix);
  });

  ipcMain.handle(
    "ledger:recordPayment",
    (_event, input: { ledgerAccountId: string; amount: number; method: "cash" | "pos" | "card_to_card" }) => {
      recordLedgerPaymentUseCase.execute({
        ledgerAccountId: input.ledgerAccountId,
        amount: input.amount,
        method: input.method,
        staffId: resolveStaffId(),
      });
    }
  );
}
