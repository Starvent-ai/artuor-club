import { randomUUID } from "node:crypto";
import type { StaffRepository } from "../../domain/ports/StaffRepository";

export interface CreateStaffInput {
  fullName: string;
}

export class CreateStaffUseCase {
  constructor(private readonly staffRepository: StaffRepository) {}

  execute(input: CreateStaffInput): string {
    const staffId = randomUUID();
    this.staffRepository.create({ id: staffId, fullName: input.fullName, isActive: true });
    return staffId;
  }
}
