export interface OpenTabItemRecord {
  id: string;
  openTabId: string;
  sourceType: "table_session" | "ps_session" | "buffet_order";
  sourceId: string;
  amount: number;
  createdAt: string;
}

export interface OpenTabItemRepository {
  create(record: OpenTabItemRecord): void;
  findByOpenTabId(openTabId: string): OpenTabItemRecord[];
}
