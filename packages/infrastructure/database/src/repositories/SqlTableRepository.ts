import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type { TableRecord, TableRepository } from "../../../../core/src/domain/ports/TableRepository";

interface TableRow {
  id: string;
  name: string;
  table_type_id: string;
  hourly_rate: number;
  status: TableRecord["status"];
  is_active: number;
}

function toRecord(row: TableRow): TableRecord {
  return {
    id: row.id,
    name: row.name,
    tableTypeId: row.table_type_id,
    hourlyRate: row.hourly_rate,
    status: row.status,
    isActive: row.is_active === 1,
  };
}

export class SqlTableRepository implements TableRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  findAllActive(): TableRecord[] {
    const rows = this.connection.queryAll<TableRow & { hourly_rate: number }>(
      `SELECT billiard_table.id, billiard_table.name, billiard_table.table_type_id,
              table_type.hourly_rate, billiard_table.status, billiard_table.is_active
       FROM billiard_table
       JOIN table_type ON table_type.id = billiard_table.table_type_id
       WHERE billiard_table.is_active = 1
       ORDER BY billiard_table.name ASC`
    );
    return rows.map(toRecord);
  }

  findById(id: string): TableRecord | undefined {
    const row = this.connection.queryOne<TableRow & { hourly_rate: number }>(
      `SELECT billiard_table.id, billiard_table.name, billiard_table.table_type_id,
              table_type.hourly_rate, billiard_table.status, billiard_table.is_active
       FROM billiard_table
       JOIN table_type ON table_type.id = billiard_table.table_type_id
       WHERE billiard_table.id = ?`,
      [id]
    );
    return row ? toRecord(row) : undefined;
  }

  updateStatus(id: string, status: TableRecord["status"]): void {
    this.connection.execute("UPDATE billiard_table SET status = ?, updated_at = ? WHERE id = ?", [
      status,
      new Date().toISOString(),
      id,
    ]);
  }

  create(input: { id: string; name: string; tableTypeId: string; createdAt: string }): void {
    this.connection.execute(
      `INSERT INTO billiard_table (id, name, table_type_id, status, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'free', 1, ?, ?)`,
      [input.id, input.name, input.tableTypeId, input.createdAt, input.createdAt]
    );
  }

  deactivate(id: string): void {
    this.connection.execute("UPDATE billiard_table SET is_active = 0, updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      id,
    ]);
  }
}
