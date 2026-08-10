import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlStaffRepository } from "../repositories/SqlStaffRepository";
import { SqlTableTypeRepository } from "../repositories/SqlTableTypeRepository";
import { SqlTableRepository } from "../repositories/SqlTableRepository";
import { SqlDeviceRepository } from "../repositories/SqlDeviceRepository";
import { SqlDeviceControllerRateRepository } from "../repositories/SqlDeviceControllerRateRepository";

function buildMigratedConnection(): NodeSqliteTestConnection {
  const connection = new NodeSqliteTestConnection();
  const runner = new MigrationRunner(connection, join(__dirname, "..", "migrations"));
  runner.run();
  return connection;
}

test("staff can be created and later deactivated", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlStaffRepository(connection);

  repository.create({ id: randomUUID(), fullName: "رضا احمدی", isActive: true });
  assert.equal(repository.countActive(), 1);
  assert.equal(repository.findAllActive()[0].fullName, "رضا احمدی");

  const staffId = repository.findAllActive()[0].id;
  repository.deactivate(staffId);
  assert.equal(repository.countActive(), 0);
});

test("table type can be created and its rate updated", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlTableTypeRepository(connection);

  const id = randomUUID();
  repository.create({ id, name: "بیلیارد", hourlyRate: 60000, isActive: true });
  assert.equal(repository.findAllActive().length, 1);
  assert.equal(repository.findById(id)?.hourlyRate, 60000);

  repository.updateRate(id, 75000);
  assert.equal(repository.findById(id)?.hourlyRate, 75000);
});

test("table can be created under a table type and later deactivated", () => {
  const connection = buildMigratedConnection();
  const tableTypeRepository = new SqlTableTypeRepository(connection);
  const tableRepository = new SqlTableRepository(connection);

  const tableTypeId = randomUUID();
  tableTypeRepository.create({ id: tableTypeId, name: "بیلیارد", hourlyRate: 60000, isActive: true });

  const tableId = randomUUID();
  tableRepository.create({
    id: tableId,
    name: "میز ۱",
    tableTypeId,
    createdAt: new Date().toISOString(),
  });

  const created = tableRepository.findById(tableId);
  assert.equal(created?.name, "میز ۱");
  assert.equal(created?.status, "free");
  assert.equal(created?.hourlyRate, 60000);
  assert.equal(tableRepository.findAllActive().length, 1);

  tableRepository.deactivate(tableId);
  assert.equal(tableRepository.findAllActive().length, 0);
});

test("device can be created and later deactivated", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlDeviceRepository(connection);

  const deviceId = randomUUID();
  repository.create({ id: deviceId, name: "PS ۱", deviceType: "ps5", maxControllers: 4 });

  const created = repository.findById(deviceId);
  assert.equal(created?.name, "PS ۱");
  assert.equal(created?.status, "free");
  assert.equal(repository.findAllActive().length, 1);

  repository.deactivate(deviceId);
  assert.equal(repository.findAllActive().length, 0);
});

test("device controller rates can be inserted and updated via upsert", () => {
  const connection = buildMigratedConnection();
  const repository = new SqlDeviceControllerRateRepository(connection);

  repository.upsert({ id: randomUUID(), deviceType: "ps5", controllerCount: 1, hourlyRate: 30000 });
  repository.upsert({ id: randomUUID(), deviceType: "ps5", controllerCount: 2, hourlyRate: 50000 });

  assert.equal(repository.findRate("ps5", 1)?.hourlyRate, 30000);
  assert.equal(repository.findAllByDeviceType("ps5").length, 2);

  repository.upsert({ id: randomUUID(), deviceType: "ps5", controllerCount: 1, hourlyRate: 35000 });
  assert.equal(repository.findRate("ps5", 1)?.hourlyRate, 35000);
  assert.equal(repository.findAllByDeviceType("ps5").length, 2);
});
