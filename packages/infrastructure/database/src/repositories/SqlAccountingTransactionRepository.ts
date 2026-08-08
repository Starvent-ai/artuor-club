import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  AccountingTransactionFilter,
  AccountingTransactionRecord,
  AccountingTransactionRepository,
} from "../../../../core/src/domain/ports/AccountingTransactionRepository";

interface AccountingTransactionRow {
  id: string;
  type: "table_income" | "ps_income" | "buffet_income" | "expense";
  source_id: string | null;
  amount: number;
  payment_method: "cash" | "pos" | "card_to_card" | "ledger";
  description: string | null;
  staff_id: string;
  occurred_at: string;
}

function toRecord(row: AccountingTransactionRow): AccountingTransactionRecord {
  return {
    id: row.id,
    type: row.type,
    sourceId: row.source_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    description: row.description,
    staffId: row.staff_id,
    occurredAt: row.occurred_at,
  };
}

export class SqlAccountingTransactionRepository implements AccountingTransactionRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  record(transaction: AccountingTransactionRecord): void {
    this.connection.execute(
      `INSERT INTO accounting_transaction
        (id, type, source_id, amount, payment_method, description, staff_id, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.type,
        transaction.sourceId,
        transaction.amount,
        transaction.paymentMethod,
        transaction.description,
        transaction.staffId,
        transaction.occurredAt,
      ]
    );
  }

  findBetween(startIso: string, endIso: string): AccountingTransactionRecord[] {
    const rows = this.connection.queryAll<AccountingTransactionRow>(
      `SELECT * FROM accounting_transaction
       WHERE occurred_at >= ? AND occurred_at < ?
       ORDER BY occurred_at ASC`,
      [startIso, endIso]
    );
    return rows.map(toRecord);
  }

  search(filter: AccountingTransactionFilter): AccountingTransactionRecord[] {
    const conditions: string[] = [];
    const parameters: (string | number)[] = [];

    if (filter.startIso) {
      conditions.push("occurred_at >= ?");
      parameters.push(filter.startIso);
    }
    if (filter.endIso) {
      conditions.push("occurred_at < ?");
      parameters.push(filter.endIso);
    }
    if (filter.staffId) {
      conditions.push("staff_id = ?");
      parameters.push(filter.staffId);
    }
    if (filter.type) {
      conditions.push("type = ?");
      parameters.push(filter.type);
    }
    if (filter.paymentMethod) {
      conditions.push("payment_method = ?");
      parameters.push(filter.paymentMethod);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = this.connection.queryAll<AccountingTransactionRow>(
      `SELECT * FROM accounting_transaction ${whereClause} ORDER BY occurred_at DESC`,
      parameters
    );
    return rows.map(toRecord);
  }
}
