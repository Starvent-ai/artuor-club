import type { IpcMain } from "electron";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlCustomerRepository } from "../../../infrastructure/database/src/repositories/SqlCustomerRepository";
import { SqlOpenTabRepository } from "../../../infrastructure/database/src/repositories/SqlOpenTabRepository";
import { SqlPaymentRepository } from "../../../infrastructure/database/src/repositories/SqlPaymentRepository";
import { SqlLedgerAccountRepository } from "../../../infrastructure/database/src/repositories/SqlLedgerAccountRepository";
import { CreateOpenTabUseCase } from "../../../core/src/application/use-cases/CreateOpenTabUseCase";
import { SettleOpenTabUseCase } from "../../../core/src/application/use-cases/SettleOpenTabUseCase";
import { getCurrentStaffId } from "../currentSession";

export function registerOpenTabHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const customerRepository = new SqlCustomerRepository(connection);
  const openTabRepository = new SqlOpenTabRepository(connection);
  const paymentRepository = new SqlPaymentRepository(connection);
  const ledgerAccountRepository = new SqlLedgerAccountRepository(connection);

  const createOpenTabUseCase = new CreateOpenTabUseCase(customerRepository, openTabRepository);
  const settleOpenTabUseCase = new SettleOpenTabUseCase(
    openTabRepository,
    paymentRepository,
    ledgerAccountRepository
  );

  function resolveStaffId(): string {
    const staffId = getCurrentStaffId() ?? staffRepository.findAllActive()[0]?.id;
    if (!staffId) {
      throw new Error("NO_STAFF_AVAILABLE");
    }
    return staffId;
  }

  ipcMain.handle("openTab:list", (_event, namePrefix?: string) => {
    return openTabRepository.listActiveSummaries(namePrefix);
  });

  ipcMain.handle(
    "openTab:create",
    (
      _event,
      input: { customerName: string; phoneNumber?: string; confirmedDespiteSimilarName?: boolean }
    ) => {
      return createOpenTabUseCase.execute({
        customerName: input.customerName,
        phoneNumber: input.phoneNumber ?? null,
        staffId: resolveStaffId(),
        confirmedDespiteSimilarName: input.confirmedDespiteSimilarName,
      });
    }
  );

  ipcMain.handle(
    "openTab:settle",
    (_event, input: { openTabId: string; method: "cash" | "pos" | "card_to_card" | "ledger" }) => {
      return settleOpenTabUseCase.execute({
        openTabId: input.openTabId,
        method: input.method,
        staffId: resolveStaffId(),
      });
    }
  );
}
