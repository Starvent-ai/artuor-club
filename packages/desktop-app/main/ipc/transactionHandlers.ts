import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SearchAccountingTransactionsUseCase } from "../../../core/src/application/use-cases/SearchAccountingTransactionsUseCase";

export function registerTransactionHandlers(
  ipcMain: IpcMain,
  connection: DatabaseConnection
): void {
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);
  const staffRepository = new SqlStaffRepository(connection);
  const searchAccountingTransactionsUseCase = new SearchAccountingTransactionsUseCase(
    accountingTransactionRepository,
    staffRepository
  );

  ipcMain.handle(
    "transaction:search",
    (
      _event,
      input: {
        rangeStart?: string;
        rangeEnd?: string;
        staffId?: string;
        type?: "table_income" | "ps_income" | "buffet_income" | "expense";
        paymentMethod?: "cash" | "pos" | "card_to_card" | "ledger";
      }
    ) => {
      return searchAccountingTransactionsUseCase.execute({
        rangeStart: input.rangeStart ? new Date(input.rangeStart) : undefined,
        rangeEnd: input.rangeEnd ? new Date(input.rangeEnd) : undefined,
        staffId: input.staffId,
        type: input.type,
        paymentMethod: input.paymentMethod,
      });
    }
  );

  ipcMain.handle("staff:listAllActive", () => {
    return staffRepository.findAllActive();
  });
}
