import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  OpenTabItemRecord,
  OpenTabItemRepository,
} from "../../../../core/src/domain/ports/OpenTabItemRepository";

interface OpenTabItemRow {
  id: string;
  open_tab_id: string;
  source_type: OpenTabItemRecord["sourceType"];
  source_id: string;
  amount: number;
  created_at: string;
}

function toRecord(row: OpenTabItemRow): OpenTabItemRecord {
  return {
    id: row.id,
    openTabId: row.open_tab_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export class SqlOpenTabItemRepository implements OpenTabItemRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: OpenTabItemRecord): void {
    this.connection.execute(
      `INSERT INTO open_tab_item (id, open_tab_id, source_type, source_id, amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [record.id, record.openTabId, record.sourceType, record.sourceId, record.amount, record.createdAt]
    );
  }

  findByOpenTabId(openTabId: string): OpenTabItemRecord[] {
    const rows = this.connection.queryAll<OpenTabItemRow>(
      "SELECT * FROM open_tab_item WHERE open_tab_id = ? ORDER BY created_at ASC",
      [openTabId]
    );
    return rows.map(toRecord);
  }
}
