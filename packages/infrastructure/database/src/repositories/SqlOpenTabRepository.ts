import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  OpenTabRecord,
  OpenTabRepository,
  OpenTabSummary,
} from "../../../../core/src/domain/ports/OpenTabRepository";

interface OpenTabRow {
  id: string;
  customer_id: string;
  status: OpenTabRecord["status"];
  opened_at: string;
  closed_at: string | null;
  total_amount: number;
  paid_amount: number;
  staff_id: string;
}

function toRecord(row: OpenTabRow): OpenTabRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    staffId: row.staff_id,
  };
}

export class SqlOpenTabRepository implements OpenTabRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  findActiveByCustomerId(customerId: string): OpenTabRecord | undefined {
    const row = this.connection.queryOne<OpenTabRow>(
      "SELECT * FROM open_tab WHERE customer_id = ? AND status = 'active'",
      [customerId]
    );
    return row ? toRecord(row) : undefined;
  }

  findById(id: string): OpenTabRecord | undefined {
    const row = this.connection.queryOne<OpenTabRow>(
      "SELECT * FROM open_tab WHERE id = ?",
      [id]
    );
    return row ? toRecord(row) : undefined;
  }

  create(record: OpenTabRecord): void {
    const existingActive = this.findActiveByCustomerId(record.customerId);
    if (existingActive) {
      throw new Error("DUPLICATE_ACTIVE_OPEN_TAB");
    }

    this.connection.execute(
      `INSERT INTO open_tab
        (id, customer_id, status, opened_at, closed_at, total_amount, paid_amount, staff_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.customerId,
        record.status,
        record.openedAt,
        record.closedAt,
        record.totalAmount,
        record.paidAmount,
        record.staffId,
      ]
    );
  }

  updateAmounts(id: string, totalAmount: number, paidAmount: number): void {
    this.connection.execute(
      "UPDATE open_tab SET total_amount = ?, paid_amount = ? WHERE id = ?",
      [totalAmount, paidAmount, id]
    );
  }

  updateStatus(id: string, status: OpenTabRecord["status"], closedAt: string | null): void {
    this.connection.execute(
      "UPDATE open_tab SET status = ?, closed_at = ? WHERE id = ?",
      [status, closedAt, id]
    );
  }

  listActiveSummaries(customerNamePrefix?: string): OpenTabSummary[] {
    interface SummaryRow {
      open_tab_id: string;
      customer_id: string;
      customer_full_name: string;
      total_amount: number;
      paid_amount: number;
      opened_at: string;
    }

    if (customerNamePrefix && customerNamePrefix.trim().length > 0) {
      const rows = this.connection.queryAll<SummaryRow>(
        `SELECT open_tab.id as open_tab_id, customer.id as customer_id,
                customer.full_name as customer_full_name,
                open_tab.total_amount, open_tab.paid_amount, open_tab.opened_at
         FROM open_tab
         JOIN customer ON customer.id = open_tab.customer_id
         WHERE open_tab.status = 'active' AND customer.full_name LIKE ?
         ORDER BY open_tab.opened_at DESC`,
        [`${customerNamePrefix}%`]
      );
      return rows.map((row) => ({
        openTabId: row.open_tab_id,
        customerId: row.customer_id,
        customerFullName: row.customer_full_name,
        totalAmount: row.total_amount,
        paidAmount: row.paid_amount,
        openedAt: row.opened_at,
      }));
    }

    const rows = this.connection.queryAll<SummaryRow>(
      `SELECT open_tab.id as open_tab_id, customer.id as customer_id,
              customer.full_name as customer_full_name,
              open_tab.total_amount, open_tab.paid_amount, open_tab.opened_at
       FROM open_tab
       JOIN customer ON customer.id = open_tab.customer_id
       WHERE open_tab.status = 'active'
       ORDER BY open_tab.opened_at DESC`
    );
    return rows.map((row) => ({
      openTabId: row.open_tab_id,
      customerId: row.customer_id,
      customerFullName: row.customer_full_name,
      totalAmount: row.total_amount,
      paidAmount: row.paid_amount,
      openedAt: row.opened_at,
    }));
  }
}
