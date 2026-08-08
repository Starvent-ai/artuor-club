export interface ProductRecord {
  id: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface ProductRepository {
  create(record: ProductRecord): void;
  findById(id: string): ProductRecord | undefined;
  findAllActive(): ProductRecord[];
  updateStockQuantity(id: string, newQuantity: number): void;
}
