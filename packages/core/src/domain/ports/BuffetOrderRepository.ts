export interface BuffetOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface BuffetOrderRecord {
  id: string;
  targetType: "table_session" | "ps_session" | "open_tab" | "immediate_sale";
  targetId: string | null;
  openTabId: string | null;
  totalAmount: number;
  isPaidImmediately: boolean;
  createdAt: string;
  staffId: string;
  items: BuffetOrderItemInput[];
}

export interface BuffetOrderRepository {
  create(record: BuffetOrderRecord): void;
}
