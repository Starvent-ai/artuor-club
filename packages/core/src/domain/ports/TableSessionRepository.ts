export interface TableSessionRecord {
  id: string;
  tableId: string;
  openTabId: string | null;
  staffId: string;
  startTime: string;
  endTime: string | null;
  rawSeconds: number | null;
  billedMinutes: number | null;
  finalAmount: number | null;
  status: "active" | "closed";
}

export interface TableSessionRepository {
  create(record: TableSessionRecord): void;
  findActiveByTableId(tableId: string): TableSessionRecord | undefined;
  findById(id: string): TableSessionRecord | undefined;
  closeSession(
    id: string,
    endTime: string,
    rawSeconds: number,
    billedMinutes: number,
    finalAmount: number
  ): void;
}
