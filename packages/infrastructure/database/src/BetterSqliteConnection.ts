import Database from "better-sqlite3";
import type { DatabaseConnection } from "../../../core/src/domain/ports/DatabaseConnection";

export class BetterSqliteConnection implements DatabaseConnection {
  private readonly db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  execute(sql: string, params: unknown[] = []): void {
    this.db.prepare(sql).run(...params);
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  queryAll<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  runInTransaction<T>(work: () => T): T {
    const transaction = this.db.transaction(work);
    return transaction();
  }

  close(): void {
    this.db.close();
  }
}
