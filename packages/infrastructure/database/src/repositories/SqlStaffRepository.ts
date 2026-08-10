import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type { StaffRecord, StaffRepository } from "../../../../core/src/domain/ports/StaffRepository";

interface StaffRow {
  id: string;
  full_name: string;
  is_active: number;
}

function toRecord(row: StaffRow): StaffRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    isActive: row.is_active === 1,
  };
}

export class SqlStaffRepository implements StaffRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  countActive(): number {
    const row = this.connection.queryOne<{ total: number }>(
      "SELECT COUNT(*) as total FROM staff WHERE is_active = 1"
    );
    return row?.total ?? 0;
  }

  findAllActive(): StaffRecord[] {
    const rows = this.connection.queryAll<StaffRow>(
      "SELECT * FROM staff WHERE is_active = 1 ORDER BY full_name ASC"
    );
    return rows.map(toRecord);
  }

  findById(id: string): StaffRecord | undefined {
    const row = this.connection.queryOne<StaffRow>("SELECT * FROM staff WHERE id = ?", [id]);
    return row ? toRecord(row) : undefined;
  }

  create(record: StaffRecord): void {
    const now = new Date().toISOString();
    this.connection.execute(
      "INSERT INTO staff (id, full_name, is_active, created_at, updated_at, sync_status) VALUES (?, ?, 1, ?, ?, 'local')",
      [record.id, record.fullName, now, now]
    );
  }

  deactivate(id: string): void {
    this.connection.execute("UPDATE staff SET is_active = 0, updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      id,
    ]);
  }
}
