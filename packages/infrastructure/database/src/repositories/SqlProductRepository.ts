import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type { ProductRecord, ProductRepository } from "../../../../core/src/domain/ports/ProductRepository";

interface ProductRow {
  id: string;
  name: string;
  category_id: string;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: number;
}

function toRecord(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    purchasePrice: row.purchase_price,
    salePrice: row.sale_price,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    isActive: row.is_active === 1,
  };
}

export class SqlProductRepository implements ProductRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: ProductRecord): void {
    this.connection.execute(
      `INSERT INTO product
        (id, name, category_id, purchase_price, sale_price, stock_quantity, low_stock_threshold, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.name,
        record.categoryId,
        record.purchasePrice,
        record.salePrice,
        record.stockQuantity,
        record.lowStockThreshold,
        record.isActive ? 1 : 0,
      ]
    );
  }

  findById(id: string): ProductRecord | undefined {
    const row = this.connection.queryOne<ProductRow>("SELECT * FROM product WHERE id = ?", [id]);
    return row ? toRecord(row) : undefined;
  }

  findAllActive(): ProductRecord[] {
    const rows = this.connection.queryAll<ProductRow>(
      "SELECT * FROM product WHERE is_active = 1 ORDER BY name ASC"
    );
    return rows.map(toRecord);
  }

  updateStockQuantity(id: string, newQuantity: number): void {
    this.connection.execute("UPDATE product SET stock_quantity = ? WHERE id = ?", [newQuantity, id]);
  }
}
