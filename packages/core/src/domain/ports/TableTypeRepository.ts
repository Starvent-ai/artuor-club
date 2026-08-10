export interface TableTypeRecord {
  id: string;
  name: string;
  hourlyRate: number;
  isActive: boolean;
}

export interface TableTypeRepository {
  findAllActive(): TableTypeRecord[];
  findById(id: string): TableTypeRecord | undefined;
  create(record: TableTypeRecord): void;
  updateRate(id: string, hourlyRate: number): void;
}
