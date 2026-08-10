import { randomUUID } from "node:crypto";
import type { TableTypeRepository } from "../../domain/ports/TableTypeRepository";

export interface CreateTableTypeInput {
  name: string;
  hourlyRate: number;
}

export class CreateTableTypeUseCase {
  constructor(private readonly tableTypeRepository: TableTypeRepository) {}

  execute(input: CreateTableTypeInput): string {
    const tableTypeId = randomUUID();
    this.tableTypeRepository.create({
      id: tableTypeId,
      name: input.name,
      hourlyRate: input.hourlyRate,
      isActive: true,
    });
    return tableTypeId;
  }
}
