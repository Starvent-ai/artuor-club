import { randomUUID } from "node:crypto";
import type { ProductRepository } from "../../domain/ports/ProductRepository";
import type { InventoryMovementRepository } from "../../domain/ports/InventoryMovementRepository";

export interface CreateProductInput {
  name: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  initialStock: number;
  lowStockThreshold: number;
  now?: Date;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository
  ) {}

  execute(input: CreateProductInput): string {
    const productId = randomUUID();

    this.productRepository.create({
      id: productId,
      name: input.name,
      categoryId: input.categoryId,
      purchasePrice: input.purchasePrice,
      salePrice: input.salePrice,
      stockQuantity: input.initialStock,
      lowStockThreshold: input.lowStockThreshold,
      isActive: true,
    });

    if (input.initialStock > 0) {
      this.inventoryMovementRepository.create({
        id: randomUUID(),
        productId,
        changeQuantity: input.initialStock,
        reason: "initial_stock",
        referenceId: null,
        createdAt: (input.now ?? new Date()).toISOString(),
      });
    }

    return productId;
  }
}
