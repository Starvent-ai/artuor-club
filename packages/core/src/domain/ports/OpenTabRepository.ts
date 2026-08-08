export interface OpenTabRecord {
  id: string;
  customerId: string;
  status: "active" | "settled" | "converted_to_ledger";
  openedAt: string;
  closedAt: string | null;
  totalAmount: number;
  paidAmount: number;
  staffId: string;
}

export interface OpenTabSummary {
  openTabId: string;
  customerId: string;
  customerFullName: string;
  totalAmount: number;
  paidAmount: number;
  openedAt: string;
}

export interface OpenTabRepository {
  findActiveByCustomerId(customerId: string): OpenTabRecord | undefined;
  create(record: OpenTabRecord): void;
  findById(id: string): OpenTabRecord | undefined;
  updateAmounts(id: string, totalAmount: number, paidAmount: number): void;
  updateStatus(id: string, status: OpenTabRecord["status"], closedAt: string | null): void;
  listActiveSummaries(customerNamePrefix?: string): OpenTabSummary[];
}

