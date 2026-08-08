import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlCustomerRepository } from "../repositories/SqlCustomerRepository";
import { SqlOpenTabRepository } from "../repositories/SqlOpenTabRepository";
import { SqlOpenTabItemRepository } from "../repositories/SqlOpenTabItemRepository";
import { SqlPaymentRepository } from "../repositories/SqlPaymentRepository";
import { SqlLedgerAccountRepository } from "../repositories/SqlLedgerAccountRepository";
import { CreateOpenTabUseCase } from "../../../../core/src/application/use-cases/CreateOpenTabUseCase";
import { AttachItemToOpenTabUseCase } from "../../../../core/src/application/use-cases/AttachItemToOpenTabUseCase";
import { RecordOpenTabPaymentUseCase } from "../../../../core/src/application/use-cases/RecordOpenTabPaymentUseCase";
import { SettleOpenTabUseCase } from "../../../../core/src/application/use-cases/SettleOpenTabUseCase";
import {
  RecordLedgerPaymentUseCase,
  LedgerMethodNotAllowedForLedgerSettlementError,
} from "../../../../core/src/application/use-cases/RecordLedgerPaymentUseCase";

function setupScenario() {
  const connection = new NodeSqliteTestConnection();
  new MigrationRunner(connection, join(__dirname, "..", "migrations")).run();

  const now = new Date().toISOString();
  const staffId = randomUUID();
  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [staffId, "پرسنل تست", now, now]
  );

  const customerRepository = new SqlCustomerRepository(connection);
  const openTabRepository = new SqlOpenTabRepository(connection);
  const openTabItemRepository = new SqlOpenTabItemRepository(connection);
  const paymentRepository = new SqlPaymentRepository(connection);
  const ledgerAccountRepository = new SqlLedgerAccountRepository(connection);

  return {
    connection,
    staffId,
    customerRepository,
    openTabRepository,
    openTabItemRepository,
    paymentRepository,
    ledgerAccountRepository,
    createOpenTabUseCase: new CreateOpenTabUseCase(customerRepository, openTabRepository),
    attachItemUseCase: new AttachItemToOpenTabUseCase(openTabRepository, openTabItemRepository),
    recordPaymentUseCase: new RecordOpenTabPaymentUseCase(openTabRepository, paymentRepository),
    settleOpenTabUseCase: new SettleOpenTabUseCase(
      openTabRepository,
      paymentRepository,
      ledgerAccountRepository
    ),
    recordLedgerPaymentUseCase: new RecordLedgerPaymentUseCase(ledgerAccountRepository, paymentRepository),
  };
}

test("creating an open tab with a brand new name succeeds immediately", () => {
  const scenario = setupScenario();
  const result = scenario.createOpenTabUseCase.execute({
    customerName: "رضا احمدی",
    staffId: scenario.staffId,
  });

  assert.equal(result.status, "created");
});

test("creating a second open tab with a name matching an active tab requires confirmation, not a block", () => {
  const scenario = setupScenario();
  scenario.createOpenTabUseCase.execute({ customerName: "رضا احمدی", staffId: scenario.staffId });

  const secondAttempt = scenario.createOpenTabUseCase.execute({
    customerName: "رضا احمدی",
    staffId: scenario.staffId,
  });

  assert.equal(secondAttempt.status, "needs_confirmation");
  if (secondAttempt.status === "needs_confirmation") {
    assert.equal(secondAttempt.similarCustomers.length, 1);
  }
});

test("confirming despite similar name creates a fully independent second open tab", () => {
  const scenario = setupScenario();
  scenario.createOpenTabUseCase.execute({ customerName: "رضا احمدی", staffId: scenario.staffId });

  const confirmed = scenario.createOpenTabUseCase.execute({
    customerName: "رضا احمدی",
    staffId: scenario.staffId,
    confirmedDespiteSimilarName: true,
  });

  assert.equal(confirmed.status, "created");
});

test("attaching table and buffet items accumulates the total amount correctly", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "سارا محمدی",
    staffId: scenario.staffId,
  });
  assert.equal(created.status, "created");
  if (created.status !== "created") return;

  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "table_session",
    sourceId: randomUUID(),
    amount: 20000,
  });
  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "buffet_order",
    sourceId: randomUUID(),
    amount: 15000,
  });

  const openTab = scenario.openTabRepository.findById(created.openTabId);
  assert.equal(openTab?.totalAmount, 35000);
});

test("partial payments accumulate without settling the tab", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "مریم رضایی",
    staffId: scenario.staffId,
  });
  if (created.status !== "created") return;

  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "table_session",
    sourceId: randomUUID(),
    amount: 50000,
  });

  scenario.recordPaymentUseCase.execute({
    openTabId: created.openTabId,
    amount: 20000,
    method: "cash",
    staffId: scenario.staffId,
  });

  const openTab = scenario.openTabRepository.findById(created.openTabId);
  assert.equal(openTab?.paidAmount, 20000);
  assert.equal(openTab?.status, "active");
});

test("settling an open tab with cash pays the remaining balance and closes it", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "حسین کریمی",
    staffId: scenario.staffId,
  });
  if (created.status !== "created") return;

  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "table_session",
    sourceId: randomUUID(),
    amount: 50000,
  });
  scenario.recordPaymentUseCase.execute({
    openTabId: created.openTabId,
    amount: 20000,
    method: "cash",
    staffId: scenario.staffId,
  });

  const result = scenario.settleOpenTabUseCase.execute({
    openTabId: created.openTabId,
    method: "cash",
    staffId: scenario.staffId,
  });

  assert.deepEqual(result, { outcome: "settled" });

  const openTab = scenario.openTabRepository.findById(created.openTabId);
  assert.equal(openTab?.status, "settled");
  assert.equal(openTab?.paidAmount, 50000);
});

test("after settling, the same customer can open a brand new active tab", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "نیما یوسفی",
    staffId: scenario.staffId,
  });
  if (created.status !== "created") return;

  scenario.settleOpenTabUseCase.execute({
    openTabId: created.openTabId,
    method: "cash",
    staffId: scenario.staffId,
  });

  const secondTab = scenario.createOpenTabUseCase.execute({
    customerName: "نیما یوسفی",
    staffId: scenario.staffId,
    confirmedDespiteSimilarName: true,
  });

  assert.equal(secondTab.status, "created");
});

test("settling with ledger method converts the remaining balance into a ledger account instead of a payment", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "امیر صادقی",
    staffId: scenario.staffId,
  });
  if (created.status !== "created") return;

  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "table_session",
    sourceId: randomUUID(),
    amount: 80000,
  });

  const result = scenario.settleOpenTabUseCase.execute({
    openTabId: created.openTabId,
    method: "ledger",
    staffId: scenario.staffId,
  });

  assert.equal(result.outcome, "converted_to_ledger");

  const openTab = scenario.openTabRepository.findById(created.openTabId);
  assert.equal(openTab?.status, "converted_to_ledger");

  if (result.outcome === "converted_to_ledger") {
    const ledgerAccount = scenario.ledgerAccountRepository.findById(result.ledgerAccountId);
    assert.equal(ledgerAccount?.totalAmount, 80000);
    assert.equal(ledgerAccount?.status, "open");
  }
});

test("ledger accounts cannot be settled using the ledger payment method", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "بهنام رستمی",
    staffId: scenario.staffId,
  });
  if (created.status !== "created") return;

  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "table_session",
    sourceId: randomUUID(),
    amount: 60000,
  });

  const settleResult = scenario.settleOpenTabUseCase.execute({
    openTabId: created.openTabId,
    method: "ledger",
    staffId: scenario.staffId,
  });
  if (settleResult.outcome !== "converted_to_ledger") return;

  assert.throws(() => {
    scenario.recordLedgerPaymentUseCase.execute({
      ledgerAccountId: settleResult.ledgerAccountId,
      amount: 60000,
      method: "ledger" as never,
      staffId: scenario.staffId,
    });
  }, LedgerMethodNotAllowedForLedgerSettlementError);
});

test("ledger accounts settle correctly with cash and status flips once fully paid", () => {
  const scenario = setupScenario();
  const created = scenario.createOpenTabUseCase.execute({
    customerName: "الهام نوری",
    staffId: scenario.staffId,
  });
  if (created.status !== "created") return;

  scenario.attachItemUseCase.execute({
    openTabId: created.openTabId,
    sourceType: "table_session",
    sourceId: randomUUID(),
    amount: 100000,
  });

  const settleResult = scenario.settleOpenTabUseCase.execute({
    openTabId: created.openTabId,
    method: "ledger",
    staffId: scenario.staffId,
  });
  if (settleResult.outcome !== "converted_to_ledger") return;

  scenario.recordLedgerPaymentUseCase.execute({
    ledgerAccountId: settleResult.ledgerAccountId,
    amount: 40000,
    method: "cash",
    staffId: scenario.staffId,
  });

  let ledgerAccount = scenario.ledgerAccountRepository.findById(settleResult.ledgerAccountId);
  assert.equal(ledgerAccount?.status, "open");
  assert.equal(ledgerAccount?.paidAmount, 40000);

  scenario.recordLedgerPaymentUseCase.execute({
    ledgerAccountId: settleResult.ledgerAccountId,
    amount: 60000,
    method: "card_to_card",
    staffId: scenario.staffId,
  });

  ledgerAccount = scenario.ledgerAccountRepository.findById(settleResult.ledgerAccountId);
  assert.equal(ledgerAccount?.status, "settled");
  assert.equal(ledgerAccount?.paidAmount, 100000);
});

test("listActiveSummaries returns only active tabs and supports incremental name-prefix search", () => {
  const scenario = setupScenario();
  scenario.createOpenTabUseCase.execute({ customerName: "علی رضایی", staffId: scenario.staffId });
  scenario.createOpenTabUseCase.execute({ customerName: "علیرضا تهرانی", staffId: scenario.staffId });
  const settled = scenario.createOpenTabUseCase.execute({
    customerName: "زهرا کاظمی",
    staffId: scenario.staffId,
  });
  if (settled.status === "created") {
    scenario.settleOpenTabUseCase.execute({
      openTabId: settled.openTabId,
      method: "cash",
      staffId: scenario.staffId,
    });
  }

  const all = scenario.openTabRepository.listActiveSummaries();
  assert.equal(all.length, 2);

  const filtered = scenario.openTabRepository.listActiveSummaries("علی");
  assert.equal(filtered.length, 2);

  const narrower = scenario.openTabRepository.listActiveSummaries("علیر");
  assert.equal(narrower.length, 1);
  assert.equal(narrower[0].customerFullName, "علیرضا تهرانی");
});

