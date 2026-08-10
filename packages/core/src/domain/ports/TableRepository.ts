export interface TableRecord {
  id: string;
  name: string;
  tableTypeId: string;
  hourlyRate: number;
  status: "free" | "in_use";
  isActive: boolean;
}

export interface TableRepository {
  findAllActive(): TableRecord[];
  findById(id: string): TableRecord | undefined;
  updateStatus(id: string, status: TableRecord["status"]): void;
  create(input: { id: string; name: string; tableTypeId: string; createdAt: string }): void;
  deactivate(id: string): void;
}
