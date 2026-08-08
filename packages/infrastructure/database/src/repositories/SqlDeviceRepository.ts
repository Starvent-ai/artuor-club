import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type { DeviceRecord, DeviceRepository } from "../../../../core/src/domain/ports/DeviceRepository";

interface DeviceRow {
  id: string;
  name: string;
  device_type: DeviceRecord["deviceType"];
  max_controllers: number;
  status: DeviceRecord["status"];
  is_active: number;
}

function toRecord(row: DeviceRow): DeviceRecord {
  return {
    id: row.id,
    name: row.name,
    deviceType: row.device_type,
    maxControllers: row.max_controllers,
    status: row.status,
    isActive: row.is_active === 1,
  };
}

export class SqlDeviceRepository implements DeviceRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  findAllActive(): DeviceRecord[] {
    const rows = this.connection.queryAll<DeviceRow>(
      "SELECT * FROM device WHERE is_active = 1 ORDER BY name ASC"
    );
    return rows.map(toRecord);
  }

  findById(id: string): DeviceRecord | undefined {
    const row = this.connection.queryOne<DeviceRow>("SELECT * FROM device WHERE id = ?", [id]);
    return row ? toRecord(row) : undefined;
  }

  updateStatus(id: string, status: DeviceRecord["status"]): void {
    this.connection.execute("UPDATE device SET status = ? WHERE id = ?", [status, id]);
  }
}
