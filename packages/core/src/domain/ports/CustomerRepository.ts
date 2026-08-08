export interface CustomerRecord {
  id: string;
  fullName: string;
  phoneNumber: string | null;
}

export interface CustomerRepository {
  create(record: CustomerRecord): void;
  findById(id: string): CustomerRecord | undefined;
  findActiveTabCustomersBySimilarName(fullName: string): CustomerRecord[];
}
