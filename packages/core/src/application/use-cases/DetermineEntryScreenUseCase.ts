import type { StaffRepository } from "../../domain/ports/StaffRepository";

export type EntryScreen = "main_application" | "staff_selection";

export class DetermineEntryScreenUseCase {
  constructor(private readonly staffRepository: StaffRepository) {}

  execute(): EntryScreen {
    const activeStaffCount = this.staffRepository.countActive();
    return activeStaffCount === 0 ? "main_application" : "staff_selection";
  }
}
