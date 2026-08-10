import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  TableTypeRecord,
  TableTypeRepository,
} from "../../../../core/src/domain/ports/TableTypeRepository";

interface TableTypeRow {
  id: string;
  name: string;
  hourly_rate: number;
  is_active: number;
}

function toRecord(row: TableTypeRow): TableTypeRecord {
  return {
    id: row.id,
    name: row.name,
    hourlyRate: row.hourly_rate,
    isActive: row.is_active === 1,
  };
}

export class SqlTableTypeRepository implements TableTypeRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  findAllActive(): TableTypeRecord[] {
    const rows = this.connection.queryAll<TableTypeRow>(
      "SELECT * FROM table_type WHERE is_active = 1 ORDER BY name ASC"
    );
    return rows.map(toRecord);
  }

  findById(id: string): TableTypeRecord | undefined {
    const row = this.connection.queryOne<TableTypeRow>("SELECT * FROM table_type WHERE id = ?", [id]);
    return row ? toRecord(row) : undefined;
  }

  create(record: TableTypeRecord): void {
    this.connection.execute(
      "INSERT INTO table_type (id, name, hourly_rate, is_active) VALUES (?, ?, ?, 1)",
      [record.id, record.name, record.hourlyRate]
    );
  }

  updateRate(id: string, hourlyRate: number): void {
    this.connection.execute("UPDATE table_type SET hourly_rate = ? WHERE id = ?", [hourlyRate, id]);
  }
}
