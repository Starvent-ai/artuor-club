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
}
