import type { IpcMain } from "electron";
import { randomUUID } from "node:crypto";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";
import { SqlStaffRepository } from "../../../infrastructure/database/src/repositories/SqlStaffRepository";
import { SqlProductRepository } from "../../../infrastructure/database/src/repositories/SqlProductRepository";
import { SqlInventoryMovementRepository } from "../../../infrastructure/database/src/repositories/SqlInventoryMovementRepository";
import { SqlBuffetOrderRepository } from "../../../infrastructure/database/src/repositories/SqlBuffetOrderRepository";
import { SqlOpenTabRepository } from "../../../infrastructure/database/src/repositories/SqlOpenTabRepository";
import { SqlOpenTabItemRepository } from "../../../infrastructure/database/src/repositories/SqlOpenTabItemRepository";
import { SqlAccountingTransactionRepository } from "../../../infrastructure/database/src/repositories/SqlAccountingTransactionRepository";
import { CreateProductUseCase } from "../../../core/src/application/use-cases/CreateProductUseCase";
import { CreateBuffetOrderUseCase } from "../../../core/src/application/use-cases/CreateBuffetOrderUseCase";
import { getCurrentStaffId } from "../currentSession";

export function registerBuffetHandlers(ipcMain: IpcMain, connection: DatabaseConnection): void {
  const staffRepository = new SqlStaffRepository(connection);
  const productRepository = new SqlProductRepository(connection);
  const inventoryMovementRepository = new SqlInventoryMovementRepository(connection);
  const buffetOrderRepository = new SqlBuffetOrderRepository(connection);
  const openTabRepository = new SqlOpenTabRepository(connection);
  const openTabItemRepository = new SqlOpenTabItemRepository(connection);
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);

  const createProductUseCase = new CreateProductUseCase(productRepository, inventoryMovementRepository);
  const createBuffetOrderUseCase = new CreateBuffetOrderUseCase(
    productRepository,
    inventoryMovementRepository,
    buffetOrderRepository,
    openTabRepository,
    openTabItemRepository,
    accountingTransactionRepository
  );

  function resolveStaffId(): string {
    const staffId = getCurrentStaffId() ?? staffRepository.findAllActive()[0]?.id;
    if (!staffId) {
      throw new Error("NO_STAFF_AVAILABLE");
    }
    return staffId;
  }

  ipcMain.handle("product:listActive", () => {
    return productRepository.findAllActive();
  });

  ipcMain.handle("productCategory:listAll", () => {
    return connection.queryAll<{ id: string; name: string }>(
      "SELECT id, name FROM product_category ORDER BY name ASC"
    );
  });

  ipcMain.handle(
    "product:create",
    (
      _event,
      input: {
        name: string;
        categoryName: string;
        purchasePrice: number;
        salePrice: number;
        initialStock: number;
        lowStockThreshold: number;
      }
    ) => {
      const existingCategory = connection.queryOne<{ id: string }>(
        "SELECT id FROM product_category WHERE name = ?",
        [input.categoryName]
      );
      const categoryId = existingCategory?.id ?? randomUUID();
      if (!existingCategory) {
        connection.execute("INSERT INTO product_category (id, name) VALUES (?, ?)", [
          categoryId,
          input.categoryName,
        ]);
      }

      return createProductUseCase.execute({
        name: input.name,
        categoryId,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        initialStock: input.initialStock,
        lowStockThreshold: input.lowStockThreshold,
      });
    }
  );

  ipcMain.handle(
    "buffet:createOrder",
    (
      _event,
      input: {
        items: { productId: string; quantity: number }[];
        openTabId?: string;
        isPaidImmediately: boolean;
        paymentMethod?: "cash" | "pos" | "card_to_card";
      }
    ) => {
      return createBuffetOrderUseCase.execute({
        ...input,
        staffId: resolveStaffId(),
      });
    }
  );
}
