import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { NodeSqliteTestConnection } from "./NodeSqliteTestConnection";
import { MigrationRunner } from "../MigrationRunner";
import { SqlDeviceRepository } from "../repositories/SqlDeviceRepository";
import { SqlDeviceControllerRateRepository } from "../repositories/SqlDeviceControllerRateRepository";
import { SqlPsSessionRepository } from "../repositories/SqlPsSessionRepository";
import { SqlPsSessionSegmentRepository } from "../repositories/SqlPsSessionSegmentRepository";
import { SqlAccountingTransactionRepository } from "../repositories/SqlAccountingTransactionRepository";
import { StartPsSessionUseCase, DeviceNotFreeError } from "../../../../core/src/application/use-cases/StartPsSessionUseCase";
import { ChangePsSessionControllerCountUseCase } from "../../../../core/src/application/use-cases/ChangePsSessionControllerCountUseCase";
import { EndPsSessionUseCase } from "../../../../core/src/application/use-cases/EndPsSessionUseCase";

function setupScenario() {
  const connection = new NodeSqliteTestConnection();
  new MigrationRunner(connection, join(__dirname, "..", "migrations")).run();

  const now = new Date().toISOString();
  const staffId = randomUUID();
  const deviceId = randomUUID();

  connection.execute(
    "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
    [staffId, "پرسنل تست", now, now]
  );
  connection.execute(
    "INSERT INTO device (id, name, device_type, max_controllers, status, is_active) VALUES (?, 'PS ۱', 'ps5', 4, 'free', 1)",
    [deviceId]
  );
  connection.execute(
    "INSERT INTO device_controller_rate (id, device_type, controller_count, hourly_rate) VALUES (?, 'ps5', 1, 30000)",
    [randomUUID()]
  );
  connection.execute(
    "INSERT INTO device_controller_rate (id, device_type, controller_count, hourly_rate) VALUES (?, 'ps5', 2, 50000)",
    [randomUUID()]
  );

  const deviceRepository = new SqlDeviceRepository(connection);
  const rateRepository = new SqlDeviceControllerRateRepository(connection);
  const sessionRepository = new SqlPsSessionRepository(connection);
  const segmentRepository = new SqlPsSessionSegmentRepository(connection);
  const transactionRepository = new SqlAccountingTransactionRepository(connection);

  return {
    connection,
    staffId,
    deviceId,
    deviceRepository,
    rateRepository,
    sessionRepository,
    segmentRepository,
    transactionRepository,
    startUseCase: new StartPsSessionUseCase(
      deviceRepository,
      rateRepository,
      sessionRepository,
      segmentRepository
    ),
    changeControllerCountUseCase: new ChangePsSessionControllerCountUseCase(
      deviceRepository,
      rateRepository,
      sessionRepository,
      segmentRepository
    ),
    endUseCase: new EndPsSessionUseCase(
      deviceRepository,
      rateRepository,
      sessionRepository,
      segmentRepository,
      transactionRepository
    ),
  };
}

test("starting a session marks the device as in_use and opens the first segment", () => {
  const scenario = setupScenario();
  const sessionId = scenario.startUseCase.execute({
    deviceId: scenario.deviceId,
    staffId: scenario.staffId,
    controllerCount: 1,
  });

  const device = scenario.deviceRepository.findById(scenario.deviceId);
  assert.equal(device?.status, "in_use");

  const segments = scenario.segmentRepository.findAllByPsSessionId(sessionId);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].controllerCount, 1);
  assert.equal(segments[0].segmentEnd, null);
});

test("cannot start a session on a device that is already in use", () => {
  const scenario = setupScenario();
  scenario.startUseCase.execute({
    deviceId: scenario.deviceId,
    staffId: scenario.staffId,
    controllerCount: 1,
  });

  assert.throws(() => {
    scenario.startUseCase.execute({
      deviceId: scenario.deviceId,
      staffId: scenario.staffId,
      controllerCount: 1,
    });
  }, DeviceNotFreeError);
});

test("changing the controller count closes the old segment and opens a new one at the new rate", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    deviceId: scenario.deviceId,
    staffId: scenario.staffId,
    controllerCount: 1,
    now: startTime,
  });

  const changeTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  scenario.changeControllerCountUseCase.execute({
    sessionId,
    newControllerCount: 2,
    now: changeTime,
  });

  const segments = scenario.segmentRepository.findAllByPsSessionId(sessionId);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].controllerCount, 1);
  assert.equal(segments[0].segmentEnd, changeTime.toISOString());
  assert.equal(segments[0].billedMinutes, 30);
  assert.equal(segments[0].segmentAmount, 15000);
  assert.equal(segments[1].controllerCount, 2);
  assert.equal(segments[1].segmentEnd, null);
});

test("ending a multi-segment session sums all segment amounts into the final total", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    deviceId: scenario.deviceId,
    staffId: scenario.staffId,
    controllerCount: 1,
    now: startTime,
  });

  const changeTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  scenario.changeControllerCountUseCase.execute({
    sessionId,
    newControllerCount: 2,
    now: changeTime,
  });

  const endTime = new Date(changeTime.getTime() + 30 * 60 * 1000);
  const result = scenario.endUseCase.execute({
    sessionId,
    staffId: scenario.staffId,
    paymentMethod: "cash",
    hasAttachedItems: false,
    now: endTime,
  });

  assert.equal(result.totalBilledMinutes, 60);
  assert.equal(result.amount, 40000);
  assert.equal(result.transactionRecorded, true);

  const device = scenario.deviceRepository.findById(scenario.deviceId);
  assert.equal(device?.status, "free");

  const session = scenario.sessionRepository.findById(sessionId);
  assert.equal(session?.status, "closed");
  assert.equal(session?.finalAmount, 40000);
});

test("ending a very short session below the threshold without attached items is not recorded", () => {
  const scenario = setupScenario();
  const startTime = new Date("2026-01-01T10:00:00Z");
  const sessionId = scenario.startUseCase.execute({
    deviceId: scenario.deviceId,
    staffId: scenario.staffId,
    controllerCount: 1,
    now: startTime,
  });

  const endTime = new Date(startTime.getTime() + 2 * 60 * 1000);
  const result = scenario.endUseCase.execute({
    sessionId,
    staffId: scenario.staffId,
    paymentMethod: "cash",
    hasAttachedItems: false,
    now: endTime,
  });

  assert.equal(result.amount, 0);
  assert.equal(result.transactionRecorded, false);
});
