import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  LedgerAccountRecord,
  LedgerAccountRepository,
  LedgerAccountSummary,
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

  listOpenSummaries(customerNamePrefix?: string): LedgerAccountSummary[] {
    interface SummaryRow {
      ledger_account_id: string;
      customer_id: string;
      customer_full_name: string;
      total_amount: number;
      paid_amount: number;
      opened_at: string;
    }

    if (customerNamePrefix && customerNamePrefix.trim().length > 0) {
      const rows = this.connection.queryAll<SummaryRow>(
        `SELECT ledger_account.id as ledger_account_id, customer.id as customer_id,
                customer.full_name as customer_full_name,
                ledger_account.total_amount, ledger_account.paid_amount, ledger_account.opened_at
         FROM ledger_account
         JOIN customer ON customer.id = ledger_account.customer_id
         WHERE ledger_account.status = 'open' AND customer.full_name LIKE ?
         ORDER BY ledger_account.opened_at DESC`,
        [`${customerNamePrefix}%`]
      );
      return rows.map((row) => ({
        ledgerAccountId: row.ledger_account_id,
        customerId: row.customer_id,
        customerFullName: row.customer_full_name,
        totalAmount: row.total_amount,
        paidAmount: row.paid_amount,
        openedAt: row.opened_at,
      }));
    }

    const rows = this.connection.queryAll<SummaryRow>(
      `SELECT ledger_account.id as ledger_account_id, customer.id as customer_id,
              customer.full_name as customer_full_name,
              ledger_account.total_amount, ledger_account.paid_amount, ledger_account.opened_at
       FROM ledger_account
       JOIN customer ON customer.id = ledger_account.customer_id
       WHERE ledger_account.status = 'open'
       ORDER BY ledger_account.opened_at DESC`
    );
    return rows.map((row) => ({
      ledgerAccountId: row.ledger_account_id,
      customerId: row.customer_id,
      customerFullName: row.customer_full_name,
      totalAmount: row.total_amount,
      paidAmount: row.paid_amount,
      openedAt: row.opened_at,
    }));
  }
}
