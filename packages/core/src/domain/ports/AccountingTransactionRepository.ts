export interface AccountingTransactionRecord {
  id: string;
  type: "table_income" | "ps_income" | "buffet_income" | "expense";
  sourceId: string | null;
  amount: number;
  paymentMethod: "cash" | "pos" | "card_to_card" | "ledger";
  description: string | null;
  staffId: string;
  occurredAt: string;
}

export interface AccountingTransactionFilter {
  startIso?: string;
  endIso?: string;
  staffId?: string;
  type?: AccountingTransactionRecord["type"];
  paymentMethod?: AccountingTransactionRecord["paymentMethod"];
}

export interface AccountingTransactionRepository {
  record(transaction: AccountingTransactionRecord): void;
  findBetween(startIso: string, endIso: string): AccountingTransactionRecord[];
  search(filter: AccountingTransactionFilter): AccountingTransactionRecord[];
}
