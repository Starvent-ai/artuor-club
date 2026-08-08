import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  TableSessionRecord,
  TableSessionRepository,
} from "../../../../core/src/domain/ports/TableSessionRepository";

interface TableSessionRow {
  id: string;
  table_id: string;
  open_tab_id: string | null;
  staff_id: string;
  start_time: string;
  end_time: string | null;
  raw_seconds: number | null;
  billed_minutes: number | null;
  final_amount: number | null;
  status: TableSessionRecord["status"];
}

function toRecord(row: TableSessionRow): TableSessionRecord {
  return {
    id: row.id,
    tableId: row.table_id,
    openTabId: row.open_tab_id,
    staffId: row.staff_id,
    startTime: row.start_time,
    endTime: row.end_time,
    rawSeconds: row.raw_seconds,
    billedMinutes: row.billed_minutes,
    finalAmount: row.final_amount,
    status: row.status,
  };
}

export class SqlTableSessionRepository implements TableSessionRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: TableSessionRecord): void {
    this.connection.execute(
      `INSERT INTO table_session
        (id, table_id, open_tab_id, staff_id, start_time, end_time, raw_seconds, billed_minutes, final_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.tableId,
        record.openTabId,
        record.staffId,
        record.startTime,
        record.endTime,
        record.rawSeconds,
        record.billedMinutes,
        record.finalAmount,
        record.status,
      ]
    );
  }

  findActiveByTableId(tableId: string): TableSessionRecord | undefined {
    const row = this.connection.queryOne<TableSessionRow>(
      "SELECT * FROM table_session WHERE table_id = ? AND status = 'active'",
      [tableId]
    );
    return row ? toRecord(row) : undefined;
  }

  findById(id: string): TableSessionRecord | undefined {
    const row = this.connection.queryOne<TableSessionRow>(
      "SELECT * FROM table_session WHERE id = ?",
      [id]
    );
    return row ? toRecord(row) : undefined;
  }

  closeSession(
    id: string,
    endTime: string,
    rawSeconds: number,
    billedMinutes: number,
    finalAmount: number
  ): void {
    this.connection.execute(
      `UPDATE table_session
       SET status = 'closed', end_time = ?, raw_seconds = ?, billed_minutes = ?, final_amount = ?
       WHERE id = ?`,
      [endTime, rawSeconds, billedMinutes, finalAmount, id]
    );
  }
}
