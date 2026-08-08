export interface InventoryMovementRecord {
  id: string;
  productId: string;
  changeQuantity: number;
  reason: "sale" | "manual_adjustment" | "initial_stock";
  referenceId: string | null;
  createdAt: string;
}

export interface InventoryMovementRepository {
  create(record: InventoryMovementRecord): void;
}
