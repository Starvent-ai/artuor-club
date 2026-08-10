export interface AuditLogRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete";
  oldValue: string | null;
  newValue: string | null;
  staffId: string | null;
  occurredAt: string;
}

export interface AuditLogRepository {
  record(entry: AuditLogRecord): void;
}
