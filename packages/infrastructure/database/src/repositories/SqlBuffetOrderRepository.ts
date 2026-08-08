import { randomUUID } from "node:crypto";
import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  BuffetOrderRecord,
  BuffetOrderRepository,
} from "../../../../core/src/domain/ports/BuffetOrderRepository";

export class SqlBuffetOrderRepository implements BuffetOrderRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: BuffetOrderRecord): void {
    this.connection.runInTransaction(() => {
      this.connection.execute(
        `INSERT INTO buffet_order
          (id, target_type, target_id, open_tab_id, total_amount, is_paid_immediately, created_at, staff_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.targetType,
          record.targetId,
          record.openTabId,
          record.totalAmount,
          record.isPaidImmediately ? 1 : 0,
          record.createdAt,
          record.staffId,
        ]
      );

      for (const item of record.items) {
        this.connection.execute(
          `INSERT INTO buffet_order_item (id, buffet_order_id, product_id, quantity, unit_price)
           VALUES (?, ?, ?, ?, ?)`,
          [randomUUID(), record.id, item.productId, item.quantity, item.unitPrice]
        );
      }
    });
  }
}
