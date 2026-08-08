import { randomUUID } from "node:crypto";
import type { ProductRepository } from "../../domain/ports/ProductRepository";
import type { InventoryMovementRepository } from "../../domain/ports/InventoryMovementRepository";
import type { BuffetOrderRepository, BuffetOrderItemInput } from "../../domain/ports/BuffetOrderRepository";
import type { OpenTabRepository } from "../../domain/ports/OpenTabRepository";
import type { OpenTabItemRepository } from "../../domain/ports/OpenTabItemRepository";
import type { AccountingTransactionRepository } from "../../domain/ports/AccountingTransactionRepository";
import { AttachItemToOpenTabUseCase } from "./AttachItemToOpenTabUseCase";

export interface CreateBuffetOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateBuffetOrderInput {
  items: CreateBuffetOrderItemInput[];
  openTabId?: string;
  isPaidImmediately: boolean;
  paymentMethod?: "cash" | "pos" | "card_to_card";
  staffId: string;
  now?: Date;
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`PRODUCT_NOT_FOUND:${productId}`);
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: string) {
    super(`INSUFFICIENT_STOCK:${productId}`);
  }
}

export class EmptyOrderError extends Error {
  constructor() {
    super("EMPTY_ORDER");
  }
}

export class OrderRequiresTabOrImmediatePaymentError extends Error {
  constructor() {
    super("ORDER_REQUIRES_TAB_OR_IMMEDIATE_PAYMENT");
  }
}

export interface CreateBuffetOrderResult {
  buffetOrderId: string;
  totalAmount: number;
  lowStockProductIds: string[];
}

export class CreateBuffetOrderUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly buffetOrderRepository: BuffetOrderRepository,
    private readonly openTabRepository: OpenTabRepository,
    private readonly openTabItemRepository: OpenTabItemRepository,
    private readonly accountingTransactionRepository: AccountingTransactionRepository
  ) {}

  execute(input: CreateBuffetOrderInput): CreateBuffetOrderResult {
    if (input.items.length === 0) {
      throw new EmptyOrderError();
    }

    if (!input.openTabId && !input.isPaidImmediately) {
      throw new OrderRequiresTabOrImmediatePaymentError();
    }

    const now = input.now ?? new Date();
    const products = input.items.map((item) => {
      const product = this.productRepository.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }
      if (product.stockQuantity < item.quantity) {
        throw new InsufficientStockError(item.productId);
      }
      return product;
    });

    const resolvedItems: BuffetOrderItemInput[] = input.items.map((item, index) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: products[index].salePrice,
    }));

    const totalAmount = resolvedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const buffetOrderId = randomUUID();

    this.buffetOrderRepository.create({
      id: buffetOrderId,
      targetType: input.openTabId ? "open_tab" : "immediate_sale",
      targetId: null,
      openTabId: input.openTabId ?? null,
      totalAmount,
      isPaidImmediately: input.isPaidImmediately,
      createdAt: now.toISOString(),
      staffId: input.staffId,
      items: resolvedItems,
    });

    const lowStockProductIds: string[] = [];

    input.items.forEach((item, index) => {
      const product = products[index];
      const newQuantity = product.stockQuantity - item.quantity;

      this.inventoryMovementRepository.create({
        id: randomUUID(),
        productId: item.productId,
        changeQuantity: -item.quantity,
        reason: "sale",
        referenceId: buffetOrderId,
        createdAt: now.toISOString(),
      });

      this.productRepository.updateStockQuantity(item.productId, newQuantity);

      if (newQuantity <= product.lowStockThreshold) {
        lowStockProductIds.push(item.productId);
      }
    });

    if (input.openTabId) {
      const attachUseCase = new AttachItemToOpenTabUseCase(
        this.openTabRepository,
        this.openTabItemRepository
      );
      attachUseCase.execute({
        openTabId: input.openTabId,
        sourceType: "buffet_order",
        sourceId: buffetOrderId,
        amount: totalAmount,
        now,
      });
    } else if (input.isPaidImmediately && input.paymentMethod) {
      this.accountingTransactionRepository.record({
        id: randomUUID(),
        type: "buffet_income",
        sourceId: buffetOrderId,
        amount: totalAmount,
        paymentMethod: input.paymentMethod,
        description: null,
        staffId: input.staffId,
        occurredAt: now.toISOString(),
      });
    }

    return { buffetOrderId, totalAmount, lowStockProductIds };
  }
}
