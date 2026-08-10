import { test } from "node:test";
import assert from "node:assert/strict";
import { DetermineEntryScreenUseCase } from "../DetermineEntryScreenUseCase";
import type { StaffRecord, StaffRepository } from "../../../domain/ports/StaffRepository";

class InMemoryStaffRepository implements StaffRepository {
  constructor(private readonly staff: StaffRecord[]) {}

  countActive(): number {
    return this.staff.filter((member) => member.isActive).length;
  }

  findAllActive(): StaffRecord[] {
    return this.staff.filter((member) => member.isActive);
  }

  findById(id: string): StaffRecord | undefined {
    return this.staff.find((member) => member.id === id);
  }

  create(record: StaffRecord): void {
    this.staff.push(record);
  }

  deactivate(id: string): void {
    const member = this.staff.find((item) => item.id === id);
    if (member) {
      member.isActive = false;
    }
  }
}

test("goes straight to main application when no staff exists", () => {
  const useCase = new DetermineEntryScreenUseCase(new InMemoryStaffRepository([]));
  assert.equal(useCase.execute(), "main_application");
});

test("shows staff selection when at least one active staff member exists", () => {
  const repository = new InMemoryStaffRepository([
    { id: "1", fullName: "علی", isActive: true },
  ]);
  const useCase = new DetermineEntryScreenUseCase(repository);
  assert.equal(useCase.execute(), "staff_selection");
});

test("ignores inactive staff when deciding entry screen", () => {
  const repository = new InMemoryStaffRepository([
    { id: "1", fullName: "علی", isActive: false },
  ]);
  const useCase = new DetermineEntryScreenUseCase(repository);
  assert.equal(useCase.execute(), "main_application");
});
