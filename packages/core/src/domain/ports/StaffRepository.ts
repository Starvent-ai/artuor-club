export interface StaffRecord {
  id: string;
  fullName: string;
  isActive: boolean;
}

export interface StaffRepository {
  countActive(): number;
  findAllActive(): StaffRecord[];
  findById(id: string): StaffRecord | undefined;
}
