import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type { PaymentRecord, PaymentRepository } from "../../../../core/src/domain/ports/PaymentRepository";

interface PaymentRow {
  id: string;
  target_type: PaymentRecord["targetType"];
  target_id: string;
  amount: number;
  method: PaymentRecord["method"];
  paid_at: string;
  staff_id: string;
}

function toRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    amount: row.amount,
    method: row.method,
    paidAt: row.paid_at,
    staffId: row.staff_id,
  };
}

export class SqlPaymentRepository implements PaymentRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: PaymentRecord): void {
    this.connection.execute(
      `INSERT INTO payment (id, target_type, target_id, amount, method, paid_at, staff_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.targetType, record.targetId, record.amount, record.method, record.paidAt, record.staffId]
    );
  }

  findByTarget(targetType: PaymentRecord["targetType"], targetId: string): PaymentRecord[] {
    const rows = this.connection.queryAll<PaymentRow>(
      "SELECT * FROM payment WHERE target_type = ? AND target_id = ? ORDER BY paid_at ASC",
      [targetType, targetId]
    );
    return rows.map(toRecord);
  }
}
