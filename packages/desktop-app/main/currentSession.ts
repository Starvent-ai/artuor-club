let currentStaffId: string | null = null;

export function setCurrentStaffId(staffId: string): void {
  currentStaffId = staffId;
}

export function getCurrentStaffId(): string | null {
  return currentStaffId;
}
