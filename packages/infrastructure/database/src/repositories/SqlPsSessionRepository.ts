import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  PsSessionRecord,
  PsSessionRepository,
} from "../../../../core/src/domain/ports/PsSessionRepository";

interface PsSessionRow {
  id: string;
  device_id: string;
  open_tab_id: string | null;
  staff_id: string;
  start_time: string;
  end_time: string | null;
  final_amount: number | null;
  status: PsSessionRecord["status"];
}

function toRecord(row: PsSessionRow): PsSessionRecord {
  return {
    id: row.id,
    deviceId: row.device_id,
    openTabId: row.open_tab_id,
    staffId: row.staff_id,
    startTime: row.start_time,
    endTime: row.end_time,
    finalAmount: row.final_amount,
    status: row.status,
  };
}

export class SqlPsSessionRepository implements PsSessionRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: PsSessionRecord): void {
    this.connection.execute(
      `INSERT INTO ps_session
        (id, device_id, open_tab_id, staff_id, start_time, end_time, final_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.deviceId,
        record.openTabId,
        record.staffId,
        record.startTime,
        record.endTime,
        record.finalAmount,
        record.status,
      ]
    );
  }

  findActiveByDeviceId(deviceId: string): PsSessionRecord | undefined {
    const row = this.connection.queryOne<PsSessionRow>(
      "SELECT * FROM ps_session WHERE device_id = ? AND status = 'active'",
      [deviceId]
    );
    return row ? toRecord(row) : undefined;
  }

  findById(id: string): PsSessionRecord | undefined {
    const row = this.connection.queryOne<PsSessionRow>("SELECT * FROM ps_session WHERE id = ?", [
      id,
    ]);
    return row ? toRecord(row) : undefined;
  }

  closeSession(id: string, endTime: string, finalAmount: number): void {
    this.connection.execute(
      "UPDATE ps_session SET status = 'closed', end_time = ?, final_amount = ? WHERE id = ?",
      [endTime, finalAmount, id]
    );
  }
}
