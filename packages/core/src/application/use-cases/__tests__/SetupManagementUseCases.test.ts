import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateStaffUseCase } from "../CreateStaffUseCase";
import { CreateTableTypeUseCase } from "../CreateTableTypeUseCase";
import { CreateTableUseCase } from "../CreateTableUseCase";
import { CreateDeviceUseCase } from "../CreateDeviceUseCase";
import { SetDeviceControllerRateUseCase } from "../SetDeviceControllerRateUseCase";
import type { StaffRecord, StaffRepository } from "../../../domain/ports/StaffRepository";
import type { TableTypeRecord, TableTypeRepository } from "../../../domain/ports/TableTypeRepository";
import type { TableRecord, TableRepository } from "../../../domain/ports/TableRepository";
import type { DeviceRecord, DeviceRepository } from "../../../domain/ports/DeviceRepository";
import type {
  DeviceControllerRateRecord,
  DeviceControllerRateRepository,
} from "../../../domain/ports/DeviceControllerRateRepository";

class InMemoryStaffRepository implements StaffRepository {
  staff: StaffRecord[] = [];
  countActive(): number {
    return this.staff.filter((member) => member.isActive).length;
  }
  findAllActive(): StaffRecord[] {
    return this.staff.filter((member) => member.isActive);
  }
  findById(id: string): StaffRecord | undefined {
    return this.staff.find((member) => member.id === id);
  }
  create(record: StaffRecord): void {
    this.staff.push(record);
  }
  deactivate(id: string): void {
    const member = this.staff.find((item) => item.id === id);
    if (member) member.isActive = false;
  }
}

class InMemoryTableTypeRepository implements TableTypeRepository {
  types: TableTypeRecord[] = [];
  findAllActive(): TableTypeRecord[] {
    return this.types.filter((type) => type.isActive);
  }
  findById(id: string): TableTypeRecord | undefined {
    return this.types.find((type) => type.id === id);
  }
  create(record: TableTypeRecord): void {
    this.types.push(record);
  }
  updateRate(id: string, hourlyRate: number): void {
    const type = this.types.find((item) => item.id === id);
    if (type) type.hourlyRate = hourlyRate;
  }
}

class InMemoryTableRepository implements TableRepository {
  tables: TableRecord[] = [];
  findAllActive(): TableRecord[] {
    return this.tables.filter((table) => table.isActive);
  }
  findById(id: string): TableRecord | undefined {
    return this.tables.find((table) => table.id === id);
  }
  updateStatus(id: string, status: TableRecord["status"]): void {
    const table = this.tables.find((item) => item.id === id);
    if (table) table.status = status;
  }
  create(input: { id: string; name: string; tableTypeId: string; createdAt: string }): void {
    this.tables.push({
      id: input.id,
      name: input.name,
      tableTypeId: input.tableTypeId,
      hourlyRate: 0,
      status: "free",
      isActive: true,
    });
  }
  deactivate(id: string): void {
    const table = this.tables.find((item) => item.id === id);
    if (table) table.isActive = false;
  }
}

class InMemoryDeviceRepository implements DeviceRepository {
  devices: DeviceRecord[] = [];
  findAllActive(): DeviceRecord[] {
    return this.devices.filter((device) => device.isActive);
  }
  findById(id: string): DeviceRecord | undefined {
    return this.devices.find((device) => device.id === id);
  }
  updateStatus(id: string, status: DeviceRecord["status"]): void {
    const device = this.devices.find((item) => item.id === id);
    if (device) device.status = status;
  }
  create(input: { id: string; name: string; deviceType: "ps4" | "ps5"; maxControllers: number }): void {
    this.devices.push({
      id: input.id,
      name: input.name,
      deviceType: input.deviceType,
      maxControllers: input.maxControllers,
      status: "free",
      isActive: true,
    });
  }
  deactivate(id: string): void {
    const device = this.devices.find((item) => item.id === id);
    if (device) device.isActive = false;
  }
}

class InMemoryDeviceControllerRateRepository implements DeviceControllerRateRepository {
  rates: DeviceControllerRateRecord[] = [];
  findRate(deviceType: "ps4" | "ps5", controllerCount: number): DeviceControllerRateRecord | undefined {
    return this.rates.find(
      (rate) => rate.deviceType === deviceType && rate.controllerCount === controllerCount
    );
  }
  findAllByDeviceType(deviceType: "ps4" | "ps5"): DeviceControllerRateRecord[] {
    return this.rates.filter((rate) => rate.deviceType === deviceType);
  }
  upsert(record: DeviceControllerRateRecord): void {
    const existing = this.findRate(record.deviceType, record.controllerCount);
    if (existing) {
      existing.hourlyRate = record.hourlyRate;
      return;
    }
    this.rates.push(record);
  }
}

test("CreateStaffUseCase creates an active staff member", () => {
  const repository = new InMemoryStaffRepository();
  const useCase = new CreateStaffUseCase(repository);

  const staffId = useCase.execute({ fullName: "رضا احمدی" });

  assert.equal(repository.findAllActive().length, 1);
  assert.equal(repository.findById(staffId)?.fullName, "رضا احمدی");
});

test("CreateTableTypeUseCase creates an active table type with the given rate", () => {
  const repository = new InMemoryTableTypeRepository();
  const useCase = new CreateTableTypeUseCase(repository);

  const tableTypeId = useCase.execute({ name: "بیلیارد", hourlyRate: 60000 });

  assert.equal(repository.findById(tableTypeId)?.hourlyRate, 60000);
});

test("CreateTableUseCase creates a free table under the given table type", () => {
  const repository = new InMemoryTableRepository();
  const useCase = new CreateTableUseCase(repository);

  const tableId = useCase.execute({ name: "میز ۱", tableTypeId: "type-1" });

  const created = repository.findById(tableId);
  assert.equal(created?.name, "میز ۱");
  assert.equal(created?.status, "free");
});

test("CreateDeviceUseCase creates a free device defaulting to 4 controllers", () => {
  const repository = new InMemoryDeviceRepository();
  const useCase = new CreateDeviceUseCase(repository);

  const deviceId = useCase.execute({ name: "PS ۱", deviceType: "ps5" });

  const created = repository.findById(deviceId);
  assert.equal(created?.maxControllers, 4);
  assert.equal(created?.status, "free");
});

test("SetDeviceControllerRateUseCase inserts then updates a rate via upsert", () => {
  const repository = new InMemoryDeviceControllerRateRepository();
  const useCase = new SetDeviceControllerRateUseCase(repository);

  useCase.execute({ deviceType: "ps5", controllerCount: 1, hourlyRate: 30000 });
  assert.equal(repository.findRate("ps5", 1)?.hourlyRate, 30000);

  useCase.execute({ deviceType: "ps5", controllerCount: 1, hourlyRate: 35000 });
  assert.equal(repository.findRate("ps5", 1)?.hourlyRate, 35000);
  assert.equal(repository.findAllByDeviceType("ps5").length, 1);
});
