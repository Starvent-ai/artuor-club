import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlProductRepository } from "../repositories/SqlProductRepository";
import { SqlInventoryMovementRepository } from "../repositories/SqlInventoryMovementRepository";
import { SqlBuffetOrderRepository } from "../repositories/SqlBuffetOrderRepository";
import { SqlOpenTabRepository } from "../repositories/SqlOpenTabRepository";
import { SqlOpenTabItemRepository } from "../repositories/SqlOpenTabItemRepository";
import { SqlAccountingTransactionRepository } from "../repositories/SqlAccountingTransactionRepository";
import { SqlCustomerRepository } from "../repositories/SqlCustomerRepository";
import { CreateProductUseCase } from "../../../../core/src/application/use-cases/CreateProductUseCase";
import {
  CreateBuffetOrderUseCase,
  InsufficientStockError,
  OrderRequiresTabOrImmediatePaymentError,
} from "../../../../core/src/application/use-cases/CreateBuffetOrderUseCase";
import { CreateOpenTabUseCase } from "../../../../core/src/application/use-cases/CreateOpenTabUseCase";

function setupScenario() {
  const connection = new NodeSqliteTestConnection();
  new MigrationRunner(connection, join(__dirname, "..", "migrations")).run();

  const now = new Date().toISOString();
  const staffId = randomUUID();
  const categoryId = randomUUID();
  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [staffId, "پرسنل تست", now, now]
  );
  connection.execute("INSERT INTO product_category (id, name) VALUES (?, 'نوشیدنی')", [categoryId]);

  const productRepository = new SqlProductRepository(connection);
  const inventoryMovementRepository = new SqlInventoryMovementRepository(connection);
  const buffetOrderRepository = new SqlBuffetOrderRepository(connection);
  const openTabRepository = new SqlOpenTabRepository(connection);
  const openTabItemRepository = new SqlOpenTabItemRepository(connection);
  const accountingTransactionRepository = new SqlAccountingTransactionRepository(connection);
  const customerRepository = new SqlCustomerRepository(connection);

  return {
    connection,
    staffId,
    categoryId,
    productRepository,
    openTabRepository,
    createProductUseCase: new CreateProductUseCase(productRepository, inventoryMovementRepository),
    createOpenTabUseCase: new CreateOpenTabUseCase(customerRepository, openTabRepository),
    createBuffetOrderUseCase: new CreateBuffetOrderUseCase(
      productRepository,
      inventoryMovementRepository,
      buffetOrderRepository,
      openTabRepository,
      openTabItemRepository,
      accountingTransactionRepository
    ),
    accountingTransactionRepository,
  };
}

test("creating a product records initial stock via inventory movement", () => {
  const scenario = setupScenario();
  const productId = scenario.createProductUseCase.execute({
    name: "نوشابه",
    categoryId: scenario.categoryId,
    purchasePrice: 8000,
    salePrice: 15000,
    initialStock: 50,
    lowStockThreshold: 10,
  });

  const product = scenario.productRepository.findById(productId);
  assert.equal(product?.stockQuantity, 50);
});

test("attaching a buffet order to an open tab decreases stock and increases tab total", () => {
  const scenario = setupScenario();
  const productId = scenario.createProductUseCase.execute({
    name: "چیپس",
    categoryId: scenario.categoryId,
    purchasePrice: 5000,
    salePrice: 12000,
    initialStock: 20,
    lowStockThreshold: 5,
  });

  const tab = scenario.createOpenTabUseCase.execute({
    customerName: "کیوان مرادی",
    staffId: scenario.staffId,
  });
  assert.equal(tab.status, "created");
  if (tab.status !== "created") return;

  const result = scenario.createBuffetOrderUseCase.execute({
    items: [{ productId, quantity: 3 }],
    openTabId: tab.openTabId,
    isPaidImmediately: false,
    staffId: scenario.staffId,
  });

  assert.equal(result.totalAmount, 36000);

  const product = scenario.productRepository.findById(productId);
  assert.equal(product?.stockQuantity, 17);

  const openTab = scenario.openTabRepository.findById(tab.openTabId);
  assert.equal(openTab?.totalAmount, 36000);
});

test("stock dropping to or below the low stock threshold is reported back", () => {
  const scenario = setupScenario();
  const productId = scenario.createProductUseCase.execute({
    name: "آب معدنی",
    categoryId: scenario.categoryId,
    purchasePrice: 3000,
    salePrice: 6000,
    initialStock: 5,
    lowStockThreshold: 3,
  });

  const tab = scenario.createOpenTabUseCase.execute({
    customerName: "پریسا احمدی",
    staffId: scenario.staffId,
  });
  if (tab.status !== "created") return;

  const result = scenario.createBuffetOrderUseCase.execute({
    items: [{ productId, quantity: 3 }],
    openTabId: tab.openTabId,
    isPaidImmediately: false,
    staffId: scenario.staffId,
  });

  assert.deepEqual(result.lowStockProductIds, [productId]);
});

test("ordering more than available stock is rejected and nothing is written", () => {
  const scenario = setupScenario();
  const productId = scenario.createProductUseCase.execute({
    name: "بستنی",
    categoryId: scenario.categoryId,
    purchasePrice: 4000,
    salePrice: 9000,
    initialStock: 2,
    lowStockThreshold: 1,
  });

  const tab = scenario.createOpenTabUseCase.execute({
    customerName: "فرهاد نجفی",
    staffId: scenario.staffId,
  });
  if (tab.status !== "created") return;

  assert.throws(() => {
    scenario.createBuffetOrderUseCase.execute({
      items: [{ productId, quantity: 5 }],
      openTabId: tab.openTabId,
      isPaidImmediately: false,
      staffId: scenario.staffId,
    });
  }, InsufficientStockError);

  const product = scenario.productRepository.findById(productId);
  assert.equal(product?.stockQuantity, 2);

  const openTab = scenario.openTabRepository.findById(tab.openTabId);
  assert.equal(openTab?.totalAmount, 0);
});

test("an immediate sale with no open tab records accounting income directly", () => {
  const scenario = setupScenario();
  const productId = scenario.createProductUseCase.execute({
    name: "قهوه",
    categoryId: scenario.categoryId,
    purchasePrice: 10000,
    salePrice: 25000,
    initialStock: 10,
    lowStockThreshold: 2,
  });

  const result = scenario.createBuffetOrderUseCase.execute({
    items: [{ productId, quantity: 1 }],
    isPaidImmediately: true,
    paymentMethod: "cash",
    staffId: scenario.staffId,
  });

  const transactions = scenario.accountingTransactionRepository.record;
  const rows = scenario.connection.queryAll<{ amount: number; type: string }>(
    "SELECT amount, type FROM accounting_transaction WHERE source_id = ?",
    [result.buffetOrderId]
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 25000);
  assert.equal(rows[0].type, "buffet_income");
});

test("a buffet order with neither an open tab nor immediate payment is rejected", () => {
  const scenario = setupScenario();
  const productId = scenario.createProductUseCase.execute({
    name: "کیک",
    categoryId: scenario.categoryId,
    purchasePrice: 7000,
    salePrice: 14000,
    initialStock: 10,
    lowStockThreshold: 2,
  });

  assert.throws(() => {
    scenario.createBuffetOrderUseCase.execute({
      items: [{ productId, quantity: 1 }],
      isPaidImmediately: false,
      staffId: scenario.staffId,
    });
  }, OrderRequiresTabOrImmediatePaymentError);
});
