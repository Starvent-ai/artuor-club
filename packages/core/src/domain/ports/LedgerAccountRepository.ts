export interface LedgerAccountRecord {
  id: string;
  customerId: string;
  sourceType: "converted_from_open_tab" | "direct_loan";
  sourceOpenTabId: string | null;
  status: "open" | "settled";
  totalAmount: number;
  paidAmount: number;
  openedAt: string;
  settledAt: string | null;
}

export interface LedgerAccountSummary {
  ledgerAccountId: string;
  customerId: string;
  customerFullName: string;
  totalAmount: number;
  paidAmount: number;
  openedAt: string;
}

export interface LedgerAccountRepository {
  create(record: LedgerAccountRecord): void;
  findById(id: string): LedgerAccountRecord | undefined;
  updateAmounts(id: string, totalAmount: number, paidAmount: number): void;
  updateStatus(id: string, status: LedgerAccountRecord["status"], settledAt: string | null): void;
  findAllOpenByCustomerId(customerId: string): LedgerAccountRecord[];
  listOpenSummaries(customerNamePrefix?: string): LedgerAccountSummary[];
}
