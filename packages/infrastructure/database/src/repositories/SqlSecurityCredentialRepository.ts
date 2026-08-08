import type { DatabaseConnection } from "../../../../core/src/domain/ports/DatabaseConnection";
import {
  SECURITY_CREDENTIAL_ID,
  type SecurityCredentialRecord,
  type SecurityCredentialRepository,
} from "../../../../core/src/domain/ports/SecurityCredentialRepository";

interface SecurityCredentialRow {
  id: string;
  is_password_set: number;
  password_hash: string | null;
  security_question: string | null;
  security_answer_hash: string | null;
  updated_at: string;
}

function toRecord(row: SecurityCredentialRow): SecurityCredentialRecord {
  return {
    id: row.id,
    isPasswordSet: row.is_password_set === 1,
    passwordHash: row.password_hash,
    securityQuestion: row.security_question,
    securityAnswerHash: row.security_answer_hash,
    updatedAt: row.updated_at,
  };
}

export class SqlSecurityCredentialRepository implements SecurityCredentialRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  get(): SecurityCredentialRecord | undefined {
    const row = this.connection.queryOne<SecurityCredentialRow>(
      "SELECT * FROM settings_security WHERE id = ?",
      [SECURITY_CREDENTIAL_ID]
    );
    return row ? toRecord(row) : undefined;
  }

  save(record: SecurityCredentialRecord): void {
    this.connection.execute(
      `INSERT INTO settings_security (id, is_password_set, password_hash, security_question, security_answer_hash, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         is_password_set = excluded.is_password_set,
         password_hash = excluded.password_hash,
         security_question = excluded.security_question,
         security_answer_hash = excluded.security_answer_hash,
         updated_at = excluded.updated_at`,
      [
        record.id,
        record.isPasswordSet ? 1 : 0,
        record.passwordHash,
        record.securityQuestion,
        record.securityAnswerHash,
        record.updatedAt,
      ]
    );
  }
}
