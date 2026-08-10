import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  DeviceControllerRateRecord,
  DeviceControllerRateRepository,
} from "../../../../core/src/domain/ports/DeviceControllerRateRepository";

interface DeviceControllerRateRow {
  id: string;
  device_type: DeviceControllerRateRecord["deviceType"];
  controller_count: number;
  hourly_rate: number;
}

function toRecord(row: DeviceControllerRateRow): DeviceControllerRateRecord {
  return {
    id: row.id,
    deviceType: row.device_type,
    controllerCount: row.controller_count,
    hourlyRate: row.hourly_rate,
  };
}

export class SqlDeviceControllerRateRepository implements DeviceControllerRateRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  findRate(
    deviceType: "ps4" | "ps5",
    controllerCount: number
  ): DeviceControllerRateRecord | undefined {
    const row = this.connection.queryOne<DeviceControllerRateRow>(
      "SELECT * FROM device_controller_rate WHERE device_type = ? AND controller_count = ?",
      [deviceType, controllerCount]
    );
    return row ? toRecord(row) : undefined;
  }

  findAllByDeviceType(deviceType: "ps4" | "ps5"): DeviceControllerRateRecord[] {
    const rows = this.connection.queryAll<DeviceControllerRateRow>(
      "SELECT * FROM device_controller_rate WHERE device_type = ? ORDER BY controller_count ASC",
      [deviceType]
    );
    return rows.map(toRecord);
  }

  upsert(record: DeviceControllerRateRecord): void {
    const existing = this.findRate(record.deviceType, record.controllerCount);
    if (existing) {
      this.connection.execute("UPDATE device_controller_rate SET hourly_rate = ? WHERE id = ?", [
        record.hourlyRate,
        existing.id,
      ]);
      return;
    }
    this.connection.execute(
      "INSERT INTO device_controller_rate (id, device_type, controller_count, hourly_rate) VALUES (?, ?, ?, ?)",
      [record.id, record.deviceType, record.controllerCount, record.hourlyRate]
    );
  }
}
