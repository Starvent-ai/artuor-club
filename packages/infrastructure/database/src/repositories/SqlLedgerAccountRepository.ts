import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  LedgerAccountRecord,
  LedgerAccountRepository,
} from "../../../../core/src/domain/ports/LedgerAccountRepository";

interface LedgerAccountRow {
  id: string;
  customer_id: string;
  source_type: LedgerAccountRecord["sourceType"];
  source_open_tab_id: string | null;
  status: LedgerAccountRecord["status"];
  total_amount: number;
  paid_amount: number;
  opened_at: string;
  settled_at: string | null;
}

function toRecord(row: LedgerAccountRow): LedgerAccountRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    sourceType: row.source_type,
    sourceOpenTabId: row.source_open_tab_id,
    status: row.status,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    openedAt: row.opened_at,
    settledAt: row.settled_at,
  };
}

export class SqlLedgerAccountRepository implements LedgerAccountRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: LedgerAccountRecord): void {
    this.connection.execute(
      `INSERT INTO ledger_account
        (id, customer_id, source_type, source_open_tab_id, status, total_amount, paid_amount, opened_at, settled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.customerId,
        record.sourceType,
        record.sourceOpenTabId,
        record.status,
        record.totalAmount,
        record.paidAmount,
        record.openedAt,
        record.settledAt,
      ]
    );
  }

  findById(id: string): LedgerAccountRecord | undefined {
    const row = this.connection.queryOne<LedgerAccountRow>("SELECT * FROM ledger_account WHERE id = ?", [id]);
    return row ? toRecord(row) : undefined;
  }

  updateAmounts(id: string, totalAmount: number, paidAmount: number): void {
    this.connection.execute(
      "UPDATE ledger_account SET total_amount = ?, paid_amount = ? WHERE id = ?",
      [totalAmount, paidAmount, id]
    );
  }

  updateStatus(id: string, status: LedgerAccountRecord["status"], settledAt: string | null): void {
    this.connection.execute("UPDATE ledger_account SET status = ?, settled_at = ? WHERE id = ?", [
      status,
      settledAt,
      id,
    ]);
  }

  findAllOpenByCustomerId(customerId: string): LedgerAccountRecord[] {
    const rows = this.connection.queryAll<LedgerAccountRow>(
      "SELECT * FROM ledger_account WHERE customer_id = ? AND status = 'open'",
      [customerId]
    );
    return rows.map(toRecord);
  }
}
