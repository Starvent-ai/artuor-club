export interface PaymentRecord {
  id: string;
  targetType: "open_tab" | "ledger_account";
  targetId: string;
  amount: number;
  method: "cash" | "pos" | "card_to_card" | "ledger";
  paidAt: string;
  staffId: string;
}

export interface PaymentRepository {
  create(record: PaymentRecord): void;
  findByTarget(targetType: PaymentRecord["targetType"], targetId: string): PaymentRecord[];
}
