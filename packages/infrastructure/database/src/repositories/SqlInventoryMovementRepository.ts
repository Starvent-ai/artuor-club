import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  InventoryMovementRecord,
  InventoryMovementRepository,
} from "../../../../core/src/domain/ports/InventoryMovementRepository";

export class SqlInventoryMovementRepository implements InventoryMovementRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: InventoryMovementRecord): void {
    this.connection.execute(
      `INSERT INTO inventory_movement (id, product_id, change_quantity, reason, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [record.id, record.productId, record.changeQuantity, record.reason, record.referenceId, record.createdAt]
    );
  }
}
