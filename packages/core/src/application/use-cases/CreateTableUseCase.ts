import { randomUUID } from "node:crypto";
import type { TableRepository } from "../../domain/ports/TableRepository";

export interface CreateTableInput {
  name: string;
  tableTypeId: string;
  now?: Date;
}

export class CreateTableUseCase {
  constructor(private readonly tableRepository: TableRepository) {}

  execute(input: CreateTableInput): string {
    const tableId = randomUUID();
    this.tableRepository.create({
      id: tableId,
      name: input.name,
      tableTypeId: input.tableTypeId,
      createdAt: (input.now ?? new Date()).toISOString(),
    });
    return tableId;
  }
}
