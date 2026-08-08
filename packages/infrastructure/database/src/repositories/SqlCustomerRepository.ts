import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type { CustomerRecord, CustomerRepository } from "../../../../core/src/domain/ports/CustomerRepository";

interface CustomerRow {
  id: string;
  full_name: string;
  phone_number: string | null;
}

function toRecord(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
  };
}

export class SqlCustomerRepository implements CustomerRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  create(record: CustomerRecord): void {
    this.connection.execute(
      "INSERT INTO customer (id, full_name, phone_number, created_at) VALUES (?, ?, ?, ?)",
      [record.id, record.fullName, record.phoneNumber, new Date().toISOString()]
    );
  }

  findById(id: string): CustomerRecord | undefined {
    const row = this.connection.queryOne<CustomerRow>("SELECT * FROM customer WHERE id = ?", [id]);
    return row ? toRecord(row) : undefined;
  }

  findActiveTabCustomersBySimilarName(fullName: string): CustomerRecord[] {
    const normalized = fullName.trim();
    const rows = this.connection.queryAll<CustomerRow>(
      `SELECT customer.id, customer.full_name, customer.phone_number
       FROM customer
       JOIN open_tab ON open_tab.customer_id = customer.id
       WHERE open_tab.status = 'active' AND customer.full_name = ?`,
      [normalized]
    );
    return rows.map(toRecord);
  }
}
