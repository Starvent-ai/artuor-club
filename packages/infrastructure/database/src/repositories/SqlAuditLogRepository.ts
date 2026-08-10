import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import type {
  AuditLogRecord,
  AuditLogRepository,
} from "../../../../core/src/domain/ports/AuditLogRepository";

export class SqlAuditLogRepository implements AuditLogRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  record(entry: AuditLogRecord): void {
    this.connection.execute(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, old_value, new_value, staff_id, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.entityType,
        entry.entityId,
        entry.action,
        entry.oldValue,
        entry.newValue,
        entry.staffId,
        entry.occurredAt,
      ]
    );
  }
}
